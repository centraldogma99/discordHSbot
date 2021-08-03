const axios = require("axios")
let paginator = require("../tools/paginator");
require("dotenv").config()
const paginateStep = 3;

async function childs(message, args, blizzardToken){
  const url = "https://kr.api.blizzard.com/hearthstone/cards?locale=ko_KR&textFilter=" + encodeURI(args) + "&access_token=" + blizzardToken
  const res = await axios({
    method: "GET",
    url: url
  })
  if( res.data.cards.length == 0 ) {
    message.channel.send("검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.")
    return;
  }
  
  let rescard = res.data.cards[0];
  let images = [];

  if(rescard.childIds != null){
    for await(const id of rescard.childIds){
      const rescard = await axios({
        method : "GET",
        url : "https://kr.api.blizzard.com/hearthstone/cards/"+id+"?locale=ko_KR&access_token="+blizzardToken
      })
      images = images.concat(rescard.data.image);
    }
    pagi = new paginator(message, images, paginateStep);
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