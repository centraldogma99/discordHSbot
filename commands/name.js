const axios = require("axios")
const paginator = require("../tools/paginator");
const mongo = require("../db");
const uniqueArrayByName = require('../tools/uniqueArrayByName')
const range = require('../tools/range')

function preProcess(args){
  return (cards) => {
    let tempCards = uniqueArrayByName(cards);
    return tempCards.filter(card => card.name.includes(args));
  }
}

async function name(message, args, blizzardToken, class_){
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  const userConfig = await mongo.userModel.findOne({name:`${message.author.username}#${message.author.discriminator}`}).exec();
  const gamemode = userConfig ? userConfig.gamemode : "wild";
  const paginateStep = userConfig ? userConfig.paginateStep : 3;
  const cardCountLimit = 1500;
  const pageSize = 50;

  let temp = await axios.get("https://us.api.blizzard.com/hearthstone/cards", 
  { params: {
    locale: "ko_KR",
    textFilter: encodeURI(args),
    class: class_,
    set: gamemode,
    pageSize: 1,
    page: 1,
    access_token: blizzardToken
  }});

  let cardCount = temp.data.cardCount;
  if( cardCount == 0 ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  } else if ( cardCount > cardCountLimit ){
    message.channel.send("‼️ 검색 결과가 너무 많습니다. 좀더 구체적인 검색어를 입력해 주세요.")
    return;
  }

  let promises = range( Math.ceil(cardCount / pageSize), 1).map(i => {
    return axios.get("https://us.api.blizzard.com/hearthstone/cards", 
    { params: {
      locale: "ko_KR",
      textFilter: encodeURI(args),
      class: class_,
      set: gamemode,
      pageSize: pageSize,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards);
  });
  
  let pagi = new paginator(message, promises, paginateStep, cardCount, preProcess(args));
  let msgs = await pagi.next();
  infoMessage.delete();

  while(msgs && msgs["reaction"]){
    msgs["targetMessages"].map(msg => msg.delete());
    msgs["infoMessage"].delete();
    if( msgs["reaction"] === "➡️" ){
      msgs = await pagi.next();
    } else if( msgs["reaction"] === "⬅️" ){
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