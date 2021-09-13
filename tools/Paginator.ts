const uniqueArray: (array: any[], element?: string) => any[] = require('./helpers/uniqueArray');
const mergeImages: (imageURLs: unknown[], cardsPerLine: number) => Promise<Buffer> = require('./helpers/mergeImages');
import { Message, MessageButton, MessageActionRow } from "discord.js";
const RequestScheduler = require('./helpers/RequestScheduler');

interface imageAddr {
  _imageAddrASDF: void;
  value: string;
}

interface Card {
  alias: string,
  name: string,
  image: imageAddr,
  imageGold?: imageAddr,
  childIds?: string,
  rarityId: Number,
  manaCost: Number,
  cardSetId: Number,
  classId: Number,
  text: string
}

export class Paginator {
  message: Message;
  paginateStep: number;
  // @cursor 최근에 출력된 페이지의 첫 번째 항목의 인덱스
  cursor: number;
  promises: (() => Promise<imageAddr | imageAddr[]>)[] | imageAddr[];
  // @images promise가 resolve된 후 반환된 image들이 저장된다.
  images: imageAddr[];
  lengthEnabled: boolean;
  numberOfCards: number;
  prevMessage: Message;
  isPromise: boolean;
  promiseResSize: number;
  nextPagePromise: Promise<imageAddr[]> | Promise<imageAddr[][]>;

  constructor(
    message: Message,
    promises: (() => Promise<imageAddr | imageAddr[]>)[] | imageAddr[],
    paginateStep: number,
    isPromise: boolean = false,
    // preProcess: (items: imageAddr[]) => T[] = (items => items),
    lengthEnabled: boolean = false,
    length?: number,
    promiseResSize? : number
  ){
    /*
      @promises T를 반환하는 promise들이 lazy eval을 위해 wrapper 함수로 감싸져 있다.
        즉, () => Promise<T | T[]>.
        이 때는 @isPromise = true 이다.
        또는, T[] 형태로 이미 계산된 형태로 주어질 수도 있다.
        이 때는 @isPromise = false 이다.
      @promiseResSize promises가 resolve되면 반환되는 값(T 또는 T[])의 길이
        (T의 경우 1, T[]의 경우 card[].length)
        @isPromise = true 일 때만.
      @isPromise promise가 (() => Promise<T | T[]>)[]인지(true), T[]인지(false).
      @preProcess promise가 resolve된 후에 거치는 함수이다. 주로 조건에 맞지 않는 항목을 제거하는 데 쓰인다.
        @isPromise = true 일 때만.
        @preProcess 를 거친 후에 데이터 개수가 변할 수 있다.
      @length 아이템의 개수. 단 이는 @preProcess를 거치지 않은 상태이므로 정확하지 않다.
        @lengthEnabled = true 일 때 주어져야 한다.
      @lengthEnabled 
        true일 경우 "n개의 결과 - k/m 페이지"
        false일 경우 length가 정확하지 않음을 의미 - "n페이지" 로만 출력
    */
    if(paginateStep < 1 || !Number.isInteger(paginateStep)) throw new Error('a step must be an integer bigger than 0');
    if(!Array.isArray(promises)) throw Error('Paginator: @promises must be given as an array');
    if(promises.length == 0) throw Error('Paginator: @promises is null array');
    if(lengthEnabled && !length)
      throw Error('Paginator: if @lengthEnabled is true, @length must be given');
    if(isPromise && !promiseResSize)
      throw Error('Paginator: if @isPromise is true, @promiseResSize must be given');

    this.message = message;
    this.paginateStep = paginateStep;
    this.cursor = -paginateStep;
    this.promises = promises;
    this.images = [];
    this.lengthEnabled = lengthEnabled;
    this.numberOfCards = length;
    this.isPromise = isPromise;
    this.promiseResSize = promiseResSize;
  }

  prev(){
    let targetImages = this.images.slice(this.cursor - this.paginateStep, this.cursor);
    this.cursor = this.cursor - this.paginateStep;

    return this.showMessages(targetImages);
  }

  async next(){
    this.cursor = this.cursor + this.paginateStep;

    // this.cards 장전하기
    if(this.isPromise){
      // 페이지를 채우기 위해서 resolve 되어야 할 promise 개수 구하기. "대강" 한 페이지를 채우는.
      // 마지막 Promise덩어리가 promiseResSize만큼이지 않을 수도 있다.
      const promiseUnitSize = Math.ceil(this.paginateStep / this.promiseResSize);
      
      while( this.cursor + this.paginateStep > this.images.length && (this.promises.length > 0 || this.nextPagePromise)){
        // 카드 큐(this.cards)에 표시할 카드가 부족한 경우 반복
        // 더 풀어낼 promise가 있는 경우에만 실행된다.
        let images: imageAddr[] | imageAddr[][];
        if( !this.nextPagePromise ){
          // 처음 next() 가 실행됐을 때만 실행된다.
          let numOfPromisesNeedToResolved = promiseUnitSize;

          let reqIdsCurrent: number[] = Array(numOfPromisesNeedToResolved).fill(null);
          reqIdsCurrent = reqIdsCurrent.map((_, index) => RequestScheduler.addReq(this.promises[index]));
          images = await Promise.all(reqIdsCurrent.map(reqId => RequestScheduler.getRes(reqId)));
          
          // 배열의 길이를 넘어가서 slice를 하더라도 정상동작(빈 배열이 됨)
          this.promises = this.promises.slice(numOfPromisesNeedToResolved);
        } else {
          images = await this.nextPagePromise;
          this.nextPagePromise = null;
        }

        // images가 imageAddr[][] 일 경우 imageAddr[] 로 만들어 주기 위하여.
        if( Array.isArray(images[0]) ){
          images = (images as imageAddr[][]).reduce((f: imageAddr[], s: imageAddr[]) => f.concat(s))
        }
        let isError = false;
        const imagesFilter = (image: imageAddr | Error) => {
          if(image instanceof Error){
            console.log(image);
            isError = true;
            // null 또는 undefined일 수 있는가?
          } else if(image != null && image != undefined){
            return true;
          } else {
            return false;
          }
        }
        images = images as imageAddr[]
        images = images.filter(imagesFilter)

        if(isError){
          this.message.channel.send("‼️ 서버 오류로 인해 결과를 출력할 수 없습니다. 잠시 후 다시 시도해 보세요.\n문제가 지속되면 개발자에게 알려주세요!")
          return;
        }
        
        // TODO 더 나은 알고리즘 찾기
        // TODO promiseResSize가 마지막 페이지인 경우(다르다)
        this.images = uniqueArray(this.images.concat(images));

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
    } else {
      if(!this.images) this.images = this.promises as imageAddr[]
    }
    let targetImages = this.images.slice(this.cursor, this.cursor + this.paginateStep);
    return this.showMessages(targetImages);
  }

  async showMessages(targetImages: imageAddr[]){
    let isLongResult = this.images.length > this.paginateStep
    
    const mergeImage = await mergeImages(targetImages, this.paginateStep % 3 == 0 ? 3 : 2);
    
    this.prevMessage?.delete().catch(console.log);
    let targetMessage = await this.message.channel.send({ files : [mergeImage] });
    this.prevMessage = targetMessage;
    if(isLongResult){
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
      if( this.cursor + this.paginateStep >= this.images.length && this.promises.length <= 0){
        moveButtons[1].setDisabled(true);
      }

      const infoStr = this.lengthEnabled ?
        `🔍 총 ${ this.numberOfCards }개의 결과 : ${ this.cursor/this.paginateStep + 1 }/${ Math.ceil(this.numberOfCards/this.paginateStep)}` :
        `🔍 ${ this.cursor/this.paginateStep + 1 } 페이지`
        
      let infoMessage = await this.message.channel.send({ 
        content: infoStr,
        components: [new MessageActionRow().addComponents(moveButtons)]
      })
      let infoPromise = infoMessage.awaitMessageComponent({ componentType: 'BUTTON', time: waitingTime })
      .then(i => [i.update({ content: "☑️ 다음 페이지를 가져오는 중...", components: [] }), (i.component as MessageButton).customId])
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