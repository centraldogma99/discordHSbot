const axios = require("axios")
require("dotenv").config()
const paginator = require("../tools/paginator");
const blizzardToken = process.env.BLIZZARD_TOKEN
const paginateStep = 3;

async function all(message, args){
  const url = "https://kr.api.blizzard.com/hearthstone/cards?locale=ko_KR&textFilter=" + encodeURI(args) + "&access_token=" + blizzardToken
  const res = await axios({
    method: "GET",
    url: url
  })
  
  if( res.data.cards.length == 0 ) {
    message.channel.send("검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  }
  let images = res.data.cards.map(item => item.image);
  pagi = new paginator(message, images, paginateStep);
  pagi.next();
}

module.exports = {
  name : '모든',
  description : 'all',
  execute : all
}