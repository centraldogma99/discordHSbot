const axios = require("axios")
const paginator = require("../tools/paginator");
const mongo = require("../db");

async function childs(message, args, blizzardToken){
  let userConfig = await mongo.userModel.findOne({name:`${message.author.username}#${message.author.discriminator}`}).exec();
  const res = await axios.get("https://us.api.blizzard.com/hearthstone/cards", 
  { params: {
    locale: "ko_KR",
    textFilter: encodeURI(args),
    set: userConfig.gamemode,
    access_token: blizzardToken
  }});
  if( res.data.cardCount == 0 ) {
    message.channel.send("검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  }
  
  let rescard = res.data.cards[0];
  for(card of res.data.cards) {
    if(card.name == args) rescard = card;
  }
  let images = [];

  if(rescard.childIds != null){
    for await(const id of rescard.childIds){
      const rescard = await axios({
        method : "GET",
        url : "https://kr.api.blizzard.com/hearthstone/cards/"+id+"?locale=ko_KR&access_token="+blizzardToken
      })
      images = images.concat(rescard.data.image);
    }

    let paginateStep;
    userConfig = await userConfig

    if( !userConfig.paginateStep ) paginateStep = 3;
    else paginateStep = userConfig.paginateStep
    pagi = new paginator(message, images, paginateStep, rescard.childIds.length);
    pagi.next();
  } else {
    message.channel.send("해당 카드의 관련 카드가 없습니다!");
    return;
  }
}

module.exports = {
  name : '관련',
  description : 'childs',
  execute : childs
}