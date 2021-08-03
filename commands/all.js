const axios = require("axios")
require("dotenv").config()
const paginator = require("../tools/paginator");
const paginateStep = 3;

async function all(message, args, blizzardToken){
  const url = "https://kr.api.blizzard.com/hearthstone/cards?locale=ko_KR&textFilter=" + encodeURI(args) + "&access_token=" + blizzardToken
  const res = await axios({
    method: "GET",
    url: url
  })
  let cards = res.data.cards;
  
  if( cards.length == 0 ) {
    message.channel.send("검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  }
  let idxToRemove = [];
  for(let i=0;i<cards.length;i++){
    for(let j=i+1;j<cards.length;j++){
      if(cards[i].name == cards[j].name)
        idxToRemove = idxToRemove.concat(j);
    }
  }
  for(const idx of idxToRemove){
    cards.splice(idx, 1);
  }
  let images = cards.map(item => item.image);
  pagi = new paginator(message, images, paginateStep);
  pagi.next();
}

module.exports = {
  name : '모든',
  description : 'all',
  execute : all
}