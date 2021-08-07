const axios = require("axios")
const paginator = require("../tools/paginator");
const mongo = require("../db");
const uniqueArrayByName = require('../tools/uniqueArrayByName')

async function name(message, args, blizzardToken, class_){
  let userConfig = await mongo.userModel.findOne({name:`${message.author.username}#${message.author.discriminator}`}).exec();
  let gamemode = userConfig ? userConfig.gamemode : "wild";
  let paginateStep = userConfig ? userConfig.paginateStep : 3;

  const res = await axios.get("https://us.api.blizzard.com/hearthstone/cards", 
  { params: {
    locale: "ko_KR",
    textFilter: encodeURI(args),
    class: class_,
    set: gamemode,
    access_token: blizzardToken
  }});
  let cards = res.data.cards;
  
  if( res.data.cardCount == 0 ) {
    message.channel.send("검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  }

  cards = uniqueArrayByName(cards);

  cards = cards.filter(card => 
    card.name.includes(args));

  if ( cards.length == 0){
    message.channel.send("검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  }

  images = cards.map(card => { return card.image; })

  pagi = new paginator(message, images, paginateStep, res.data.cardCount);
  pagi.next();
}

module.exports = {
  name : '이름',
  description : 'name',
  execute : name
}