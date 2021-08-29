/*
  로컬 DB화 미루기 - 서치 성능 이슈(확인 안됨)
*/

const Paginator = require("../tools/Paginator");
const loadUserConfig = require("../tools/loadUserConfig")
const uniqueArray = require('../tools/uniqueArray')
const range = require('../tools/range')
const CONSTANTS = require('../constants')
const BlizzardToken = require("../tools/BlizzardToken");
const safeAxiosGet = require("../tools/safeAxiosGet");

function preProcess(cards){
  return uniqueArray(cards, "name");
}

async function all(message, args, info){
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let blizzardToken = await BlizzardToken.getToken();
  let class_ = info.class_;
  // inference 를 하면 안된다.
  let searchingMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);
  let className = class_ ? class_.name : undefined;
  let cardCount;
  let temp = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
  { params: {
    locale: userConfig.languageMode,
    textFilter: encodeURI(args),
    class: className,
    set: userConfig.gameMode,
    pageSize: 1,
    page: 1,
    access_token: blizzardToken
  }})
  .catch((e) =>{
    console.log(e);
    return message.channel.send("‼️ 카드 정보를 가져오던 중 오류가 발생했습니다. 다시 시도해 주세요!")
  });

  cardCount = temp.data.cardCount;
  if ( cardCount == 0 ){
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }
  if ( cardCount > CONSTANTS.cardCountLimit ){
    message.channel.send("‼️ 검색 결과가 너무 많습니다! 좀더 구체적인 검색어를 입력해 주세요.");
    return;
  }

  // ! pageSize가 너무 작으면 429:too many request 발생
  // TODO pageSize가 paginateStep보다 작으면 오류 발생. 현재는 50으로 유지할 것. 이거고치지않았나..?
  let promises;
  // if ( userConfig.languageMode == "ko_KR" ){
  promises = range( Math.ceil(cardCount / CONSTANTS.pageSize), 1).map(i => 
    safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: userConfig.languageMode,
      textFilter: encodeURI(args),
      class: className,
      set: userConfig.gameMode,
      pageSize: CONSTANTS.pageSize,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards)
  )
  // }
  //  else if ( userConfig.languageMode == "en_US" ){
  //   promises = Promise.all(range( Math.ceil(cardCount / CONSTANTS.pageSize), 1).map(i => 
  //     axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
  //     { params: {
  //       locale: "ko_KR",
  //       textFilter: encodeURI(args),
  //       class: class_,
  //       set: userConfig.gameMode,
  //       pageSize: CONSTANTS.pageSize,
  //       page : i,
  //       access_token: blizzardToken
  //     }})) // [Array[Card], Array[Card], ...]
  //     .then(res => res.map(cards => cards.map(card => card.id))) // [Array[Id], Array[Id], ... ]
  //     .then(ids => ids.map(id => 
  //       axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards/${ id }`,
  //       { params : {
  //         locale: userConfig.languageMode,
  //         access_token: blizzardToken
  //       }})))
  //     .then(res => res.map( card => card.data ))
  //   );
  // }
  let pagi = new Paginator(message, promises, userConfig.paginateStep, cardCount, preProcess, true, userConfig.goldenCardMode);
  let msgs = await pagi.next();
  searchingMessage.delete();

  while(msgs){
    let infoMessage = await msgs.infoMessage;
    [m, reaction] = await msgs.infoPromise;
    await m;
    if( reaction === "next" ){
      await message.channel.sendTyping();
      await infoMessage.delete();
      msgs = await pagi.next();
    } else if( reaction === "prev" ){
      await message.channel.sendTyping();
      await infoMessage.delete();
      msgs = await pagi.prev();
    } else if( reaction === "timeout" ){
      infoMessage.delete();
      break;
    }
  }

  return;
}

module.exports = {
  name : ['모든'],
  description : 'all',
  execute : all
}