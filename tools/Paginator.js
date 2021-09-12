const uniqueArray = require('./helpers/uniqueArray')
const mergeImages = require('./helpers/mergeImages');
const { MessageButton, MessageActionRow } = require('discord.js');
const RequestScheduler = require('./helpers/RequestScheduler');

// How paginator works
// next 
// 커서 이동
// card가 한 페이지를 출력할 수 있을 때까지 promise resolve
// 다음 promise 만들기, 큐에 등록
// this.cards 중복 제거
// showMessage 실행(이미지 합치기, 메시지 보내기)
class Paginator {
  constructor(message, promises, isBlizzardReq=false, promiseResSize=null, paginateStep, length, preProcess=null, {lengthEnabled = true, goldenCardMode = false}){
    /*
      @cursor 최근에 출력된 페이지의 첫 번째 항목의 인덱스
      @promises 카드를 검색하는 promise들이 lazy eval을 위해 wrapper 함수로 감싸져 있다.
        즉, () => Promise<card | card[]>.
        또는, card[] 형태로 이미 계산된 형태로 넘어올 수도 있다.
        이때는 isBlizzardReq = false 이다.
      @promiseResSize promises가 resolve되면 반환되는 값(card 또는 card[])의 길이
        (card의 경우 1, card[]의 경우 card[].length)
        @isBlizzardReq = true 일 때만.
      @isBlizzardReq promise가 battle.net API에 요청하는 wrapper인지(true), card[]인지(false).
      @preProcess promise가 resolve된 후에 거치는 함수이다. 주로 조건에 맞지 않는 항목을 제거하는 데 쓰인다.
        @isBlizzardReq = true 일 때만.
      this.cards promise가 resolve된 후 preProcess를 거쳐 최종적으로 만들어진 card들이 저장된다.
      @length 모든 카드의 개수. 단 이는 preProcess를 거치지 않은 상태이므로 정확하지 않다. #TODO
      @lengthEnabled numberOfCards 이슈를 해결하기 위해. false일 경우 length가 정확하지 않음을 의미 - 별도의 페이지 메시지.
    */
    if(paginateStep < 1) throw Error('Paginator: @paginateStep must be an integer bigger than 0');
    if(Array.isArray(promises.length)) throw Error('Paginator: @promises must be given as an array');
    if(promises.length == 0) throw Error('Paginator: @promises is null array');
    if(isBlizzardReq){
      if(!promiseResSize || !preProcess){
        throw Error('Paginator: for blizzardReq @promiseResSize and @preProcess must be given')
      }
    }

    this.message = message;
    this.paginateStep = paginateStep;
    this.promises = promises;
    this.promiseResSize = promiseResSize;
    this.isBlizzardReq = isBlizzardReq;
    this.cursor = -paginateStep;
    this.preProcess = preProcess;
    this.cards = [];
    this.lengthEnabled = lengthEnabled;
    this.goldenCardMode = goldenCardMode;
    this.numberOfCards = length;

    if(!this.isBlizzardReq){
      this.cards = this.promises;
      this.promises = [];
    }
  }

  prev(){
    let targetCards = this.cards.slice(this.cursor - this.paginateStep, this.cursor);
    this.cursor = this.cursor - this.paginateStep;

    return this.showMessages(targetCards);
  }

  async next(){
    this.cursor = this.cursor + this.paginateStep;
    
    // this.cards 장전하기
    if(this.isBlizzardReq){
      // 페이지를 채우기 위해서 resolve 되어야 할 promise 개수 구하기. "대강" 한 페이지를 채우는.
      // 마지막 Promise덩어리가 promiseResSize만큼이지 않을 수도 있다.
      const promiseUnitSize = Math.ceil(this.paginateStep / this.promiseResSize);
      
      while( this.cursor + this.paginateStep > this.cards.length && (this.promises.length > 0 || this.nextPagePromise)){
        // 카드 큐(this.cards)에 표시할 카드가 부족한 경우 반복
        // 더 풀어낼 promise가 있는 경우에만 실행된다.
        let cards;
        if( !this.nextPagePromise ){
          // 처음 next() 가 실행됐을 때만 실행된다.
          let numOfPromisesNeedToResolved = promiseUnitSize;

          let reqIdsCurrent = Array(numOfPromisesNeedToResolved).fill(null);
          reqIdsCurrent = reqIdsCurrent.map((_, index) => RequestScheduler.addReq(this.promises[index]));
          cards = await Promise.all(reqIdsCurrent.map(reqId => RequestScheduler.getRes(reqId)));
          
          // 배열의 길이를 넘어가서 slice를 하더라도 정상동작(빈 배열이 됨)
          this.promises = this.promises.slice(numOfPromisesNeedToResolved);
        } else {
          cards = await this.nextPagePromise;
          this.nextPagePromise = null;
        }

        // cards가 (card[])[] 일 경우 card[] 로 만들어 주기 위하여.
        if( Array.isArray(cards[0]) ){
          cards = cards.reduce((f,s) => f.concat(s))
        }
        let isError = false;
        const cardsFilter = card => {
          if(card instanceof Error){
            console.log(card);
            isError = true;
          } else if(card != null && card != undefined){
            return true;
          } else {
            return false;
          }
        }
        cards = cards.filter(cardsFilter)
        if(isError){
          this.message.channel.send("‼️ 서버 오류로 인해 결과를 출력할 수 없습니다. 잠시 후 다시 시도해 보세요.\n문제가 지속되면 개발자에게 알려주세요!")
          return;
        }
        
          
        cards = this.preProcess(cards);
        // TODO 더 나은 알고리즘 찾기
        // TODO promiseResSize가 마지막 페이지인 경우(다르다)
        this.cards = uniqueArray(this.cards.concat(cards), "name");

        if( this.promises.length > 0 ){
          // ready for next page
          let numOfPromisesNextPage = promiseUnitSize;
          // 요청하려는 promise가 남은 promise보다 많은 경우
          if(numOfPromisesNextPage > this.promises.length) numOfPromisesNextPage = this.promises.length;
          let reqIdsNext = Array(numOfPromisesNextPage).fill(null);
          reqIdsNext = reqIdsNext.map((_, index) => RequestScheduler.addReq(this.promises[index]));
          this.nextPagePromise = Promise.all(reqIdsNext.map(reqId => RequestScheduler.getRes(reqId)));
          this.promises = this.promises.slice(numOfPromisesNextPage);
        }
      }
    }
    let targetCards = this.cards.slice(this.cursor, this.cursor + this.paginateStep);
    return this.showMessages(targetCards);
  }

  async showMessages(targetCards){
    let images;
    if ( !this.goldenCardMode ){
      images = targetCards.map(card => card.image);
    } else {
      images = targetCards.map(card => card.imageGold ? card.imageGold : card.image );
    }
    const mergeImage = await mergeImages(images, this.paginateStep % 3 == 0 ? 3 : 2);
    
    if( this.prevMessage ) this.prevMessage.delete();
    let targetMessage = await this.message.channel.send({ files : [mergeImage] });
    this.prevMessage = targetMessage;
    // 한 페이지만에 모든 결과가 출력되는 경우가 아닌 경우(구 isLongResult)
    if(this.cards.length > this.paginateStep || (this.promises.length > 0 || this.nextPagePromise)){
      const waitingTime = 30000;

      let moveButtons = [
        new MessageButton()
          .setCustomId('prev')
          .setLabel('이전')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId('next')
          .setLabel('다음')
          .setStyle('PRIMARY')
      ]
      
      // 왼쪽 감정표현
      if( this.cursor - this.paginateStep < 0){
        moveButtons[0].setDisabled(true);
      }
      // 오른쪽 감정표현
      if(this.cursor + this.paginateStep >= this.cards.length && !this.nextPagePromise){
        moveButtons[1].setDisabled(true);
      }
      
      let infoStr;
      const row = new MessageActionRow().addComponents(moveButtons);
      if ( !this.lengthEnabled ){
        infoStr = `🔍 ${ this.cursor/this.paginateStep + 1 } 페이지`;
      } else {
        infoStr = `🔍 총 ${ this.numberOfCards }개의 결과 : ${ this.cursor/this.paginateStep + 1 }/${ Math.ceil(this.numberOfCards/this.paginateStep)}`
      }
      let infoMessage = await this.message.channel.send({ 
        content: infoStr,
        components: [row]
      })
      let infoPromise = infoMessage.awaitMessageComponent({ componentType: 'BUTTON', time: waitingTime })
      .then(i => [i.update({ content: "☑️ 다음 페이지를 가져오는 중...", components: [] }), i.component.customId])
      .catch(() => [undefined, "timeout"])
        
      
      return {
        'infoPromise': infoPromise,
        'infoMessage': infoMessage,
        'targetMessage': targetMessage
      }
    } else {
      return;
    }
  }
}

module.exports = Paginator;