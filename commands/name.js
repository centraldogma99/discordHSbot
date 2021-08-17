const axios = require("axios")
const paginator = require("../tools/Paginator");
const loadUserConfig = require("../tools/loadUserConfig")
const uniqueArrayByName = require('../tools/uniqueArrayByName')
const range = require('../tools/range')
const CONSTANTS = require('../constants')

function preProcess(args){
  return (cards) => {
    let tempCards = uniqueArrayByName(cards);
    return tempCards.filter(card => card.name.includes(args));
  }
}

async function name(message, args, blizzardToken, class_){
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  const userConfig = await loadUserConfig(message.author);

  let temp = await axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
  { params: {
    locale: userConfig.languageMode,
    textFilter: encodeURI(args),
    class: class_,
    set: userConfig.gameMode,
    pageSize: 1,
    page: 1,
    access_token: blizzardToken
  }});

  let cardCount = temp.data.cardCount;
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
      textFilter: encodeURI(args),
      class: class_,
      set: userConfig.gameMode,
      pageSize: CONSTANTS.pageSize,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards);
  });
  
  let pagi = new paginator(message, promises, userConfig.paginateStep, cardCount, preProcess(args), false, userConfig.goldenCardMode);
  let msgs = await pagi.next();
  infoMessage.delete();

  while(msgs && msgs.reaction){
    msgs.targetMessages.map(msg => msg.delete());
    msgs.infoMessage.delete();
    if( msgs.reaction === "➡️" ){
      msgs = await pagi.next();
    } else if( msgs.reaction === "⬅️" ){
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