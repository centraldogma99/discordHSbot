const axios = require("axios")
const paginator = require("../tools/Paginator");
const loadUserConfig = require("../tools/loadUserConfig")
const uniqueArray = require('../tools/uniqueArray')
const range = require('../tools/range')
const CONSTANTS = require('../constants')
const cardNameUntrim = require('../tools/cardNameUntrim')

function preProcess(args){
  return (cards) => {
    let tempCards = uniqueArray(cards, "name");
    return tempCards.filter(card => card.name.includes(args));
  }
}

async function name(message, args, blizzardToken, class_){
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);

  let cardNameProcessed = await cardNameUntrim(args, userConfig.gameMode);
  if( !cardNameProcessed ) {
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

  let cardCount = temp.data.cardCount;
  // ? 이거 필요 없을수도
  if( cardCount == 0 ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  } else if ( cardCount > CONSTANTS.cardCountLimit ){
    message.channel.send("‼️ 검색 결과가 너무 많습니다. 좀더 구체적인 검색어를 입력해 주세요.")
    return;
  }

  let promises = range( Math.ceil(cardCount / CONSTANTS.pageSize), 1).map(i => {
    return axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: userConfig.languageMode,
      textFilter: encodeURI(cardNameProcessed),
      class: class_,
      set: userConfig.gameMode,
      pageSize: CONSTANTS.pageSize,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards);
  });
  let pagi = new paginator(message, promises, userConfig.paginateStep, cardCount, preProcess(cardNameProcessed), false, userConfig.goldenCardMode);
  let msgs = await pagi.next();
  infoMessage.delete();

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
  name : '이름',
  description : 'name',
  execute : name
}