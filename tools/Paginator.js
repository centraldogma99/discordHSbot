/*
  ! 모든 cards 는 로드된 후에 preProcess() 를 거쳐야함
*/
const uniqueArrayByName = require('./uniqueArrayByName')
const cropImage = require('./cropImage');
const mergeImages = require('./mergeImages');

class Paginator {
  constructor(message, promises, step, length, preProcess, lengthEnabled = true, goldenCardMode = false){
    /*
      @cursor 최근에 출력된 페이지의 첫 번째 항목의 인덱스
      @promises 카드를 검색하는 promise들. 이들의 resolve값은 Array[card] 이어야 한다.
      @preProcess promise가 resolve된 후에 거치는 함수이다. 주로 조건에 맞지 않는 항목을 제거하는 데 쓰인다.
      @cards promise가 resolve된 후 preProcess를 거쳐 최종적으로 만들어진 card들이 저장된다.
      @numberOfCards 모든 카드의 개수. 단 이는 preProcess를 거치지 않은 상태이므로 정확하지 않다. #TODO
      @lengthEnabled numberOfCards 이슈를 해결하기 위해. false일 경우 length가 정확하지 않음을 의미 - 별도의 페이지 메시지.
    */
    if(step < 1) throw new Error('a step must be an integer bigger than 0');
    this.message = message;
    this.step = step;
    this.cursor = -step;
    this.promises = promises;
    this.preProcess = preProcess
    this.cards = [];
    this.lengthEnabled = lengthEnabled;
    this.goldenCardMode = goldenCardMode;

    this.numberOfCards = length;
  }

  prev(){
    let targetCards = this.cards.slice(this.cursor - this.step, this.cursor);
    this.cursor = this.cursor - this.step;

    return this.showMessages(targetCards);
  }

  async next(){
    this.cursor = this.cursor + this.step;

    // ? 끝일 때, 또는 처음 next가 실행되었을 때, 다음 promise 로드.
    while ( this.cursor + this.step >= this.cards.length ){
      if( this.promises.length > 0 ){
        let cards = await this.promises[0];
        cards = this.preProcess(cards);
        // TODO 더 나은 알고리즘 찾기
        // if (this.cards.length > 0)
        this.cards = uniqueArrayByName(this.cards.concat(cards));
        this.promises = this.promises.slice(1);
      } else {
        break;
      }
    }
    let targetCards = this.cards.slice(this.cursor, this.cursor + this.step);
    return this.showMessages(targetCards);
  }

  async showMessages(targetCards){
    let infoMessage;
    let isLongResult = this.cards.length > this.step
    
    
    let images;
    if ( !this.goldenCardMode ){
      images = targetCards.map(card => card.image);
    } else {
      images = targetCards.map(card => card.imageGold ? card.imageGold : card.image );
    }
    const mergeImage = await mergeImages(images, this.step % 3 == 0 ? 3 : 2);
    const promise = this.message.channel.send({ files : [mergeImage] });
    
    // ? await 필요한가
    // targetMessage는 1개인것으로.
    let targetMessage = await promise;
    if(isLongResult){
      let lastMessage = targetMessage;
      // for (const msg of targetMessages.slice(1, targetMessages.length)){
      //   if (msg.createdTimestamp > lastMessage.createdTimestamp){
      //     lastMessage = msg;
      //   }
      // }
      // 왼쪽 감정표현
      if ( this.cursor - this.step >= 0 ){
        await lastMessage.react("⬅️");
      }else{
        await lastMessage.react("❌");
      }
      // 오른쪽 감정표현
      if ( this.cursor + this.step < this.cards.length || this.promises.length > 0){
        lastMessage.react("➡️");
      } else {
        lastMessage.react("❌");
      }
      
      if ( !this.lengthEnabled ){
        infoMessage = this.message.channel.send(`🔍 ${ this.cursor/this.step + 1 } 페이지`);
      } else {
        infoMessage = this.message.channel.send(
          `🔍 총 ${ this.numberOfCards }개의 결과 : ${ this.cursor/this.step + 1 }/${ Math.ceil(this.numberOfCards/this.step) }`
        );
      }
      let collectedReactions = await lastMessage.awaitReactions(
        {
          filter: (reaction, user) => {
            return (reaction.emoji.name === "➡️" ||
            reaction.emoji.name === "⬅️") &&
            user.id === this.message.author.id;
          },
          time : 20000,
          max : 1
        }
      )

      let reaction;
      if (collectedReactions.size == 0){
        return;
      } else {
        reaction = collectedReactions.keys().next().value;
      }
      return {
        'reaction': reaction,
        'infoMessage': await infoMessage,
        'targetMessage': targetMessage
      }
    } else {
      return;
    }
  }

  get getCardsLength(){
    return this.cards.length;
  }

  get getCursor(){
    return this.cursor;
  }
}

module.exports = Paginator;