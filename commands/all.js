/*
  TODO : preProcess 함수 구현 및 paginator 생성자 인자로 넘기기
  TODO : 모든 카드를 한번에 요청하지 말고 개수에 따라 유동적으로 쪼개어 요청
*/

const axios = require("axios")
const paginator = require("../tools/paginator");
const mongo = require("../db");
const uniqueArrayByName = require('../tools/uniqueArrayByName')
const range = require('../tools/range')

function preProcess(cards){
  return uniqueArrayByName(cards);
}

async function all(message, args, blizzardToken, class_){
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  const userConfig = await mongo.userModel.findOne({name:`${message.author.username}#${message.author.discriminator}`}).exec();
  const gamemode = userConfig ? userConfig.gamemode : "wild";
  const paginateStep = userConfig ? userConfig.paginateStep : 3;
  const pageSize = 50;
  const cardCountLimit = 1500;

  // TODO 카드 개수알아내기 위한 요청, 추후 개선 필요
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
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  } else if ( cardCount > cardCountLimit ){
    message.channel.send("‼️ 검색 결과가 너무 많습니다. 좀더 구체적인 검색어를 입력해 주세요.");
    return;
  }

  // ! pageSize가 너무 작으면 429:too many request 발생
  // TODO pageSize가 paginateStep보다 작으면 오류 발생. 현재는 40으로 유지할 것.
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

  let pagi = new paginator(message, promises, paginateStep, cardCount, preProcess);
  let msgs = await pagi.next();
  infoMessage.delete();

  // ? Short meesage일 경우? - next()의 반환값이 없으므로 아무런 처리도 하지 않아도 된다.
  // FIXME? 삭제가 더 늦게 되는 문제. 안 고쳐도 될지도. 그림 합치는것 구현 이후에 다시 고려
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
  name : '모든',
  description : 'all',
  execute : all
}