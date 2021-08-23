/*
  TODO : preProcess 함수 구현 및 paginator 생성자 인자로 넘기기
  TODO : 모든 카드를 한번에 요청하지 말고 개수에 따라 유동적으로 쪼개어 요청
*/

const axios = require("axios")
const paginator = require("../tools/Paginator");
const loadUserConfig = require("../tools/loadUserConfig")
const uniqueArray = require('../tools/uniqueArray')
const range = require('../tools/range')
const CONSTANTS = require('../constants')
const cardNameUntrim = require("../tools/cardNameUntrim");

function preProcess(cards){
  return uniqueArray(cards, "name");
}

async function all(message, args, blizzardToken, class_){
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);

  let cardNameProcessed, cardCount;
  cardNameProcessed = await cardNameUntrim(args, userConfig.gameMode);
  if( cardNameProcessed.msg == "noCardData" ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }
  cardNameProcessed = cardNameProcessed.name;
  let temp = await axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
  { params: {
    locale: userConfig.languageMode,
    textFilter: encodeURI(cardNameProcessed),
    class: class_,
    set: userConfig.gameMode,
    pageSize: 1,
    page: 1,
    access_token: blizzardToken
  }});
  cardCount = temp.data.cardCount;

  if ( cardCount > CONSTANTS.cardCountLimit ){
    message.channel.send("‼️ 검색 결과가 너무 많습니다! 좀더 구체적인 검색어를 입력해 주세요.");
    return;
  }

  // ! pageSize가 너무 작으면 429:too many request 발생
  // TODO pageSize가 paginateStep보다 작으면 오류 발생. 현재는 50으로 유지할 것. 이거고치지않았나..?
  let promises;
  // if ( userConfig.languageMode == "ko_KR" ){
  promises = range( Math.ceil(cardCount / CONSTANTS.pageSize), 1).map(i => 
    axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: userConfig.languageMode,
      textFilter: encodeURI(cardNameProcessed),
      class: class_,
      set: userConfig.gameMode,
      pageSize: CONSTANTS.pageSize,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards)
  );
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
  let pagi = new paginator(message, promises, userConfig.paginateStep, cardCount, preProcess, true, userConfig.goldenCardMode);

  let msgs = await pagi.next();
  infoMessage.delete();

  // ? Short meesage일 경우? - next()의 반환값이 없으므로 아무런 처리도 하지 않아도 된다.
  // FIXME? 삭제가 더 늦게 되는 문제. 안 고쳐도 될지도. 그림 합치는것 구현 이후에 다시 고려
  while(msgs && msgs.reaction){
    msgs.targetMessage.delete();
    msgs.infoMessage.delete();
    if( msgs.reaction === "➡️" ){
      await message.channel.sendTyping();
      msgs = await pagi.next();
    } else if( msgs.reaction === "⬅️" ){
      await message.channel.sendTyping();
      msgs = await pagi.prev();
    }
  }

  return;
}

module.exports = {
  name : '모든',
  description : 'all',
  execute : all
}