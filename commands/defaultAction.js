const axios = require("axios")
require("dotenv").config()
const childs = require("./childs")
const blizzardToken = process.env.BLIZZARD_TOKEN

async function defaultAction(message, args){
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
  await message.channel.send({files: [rescard.image]});
  if( rescard.childIds != null ){
    msg = await message.channel.send("**< ! >**  관련 카드가 있습니다. 아래 이모티콘을 눌러 관련 카드를 검색할 수 있습니다.")
    await msg.react("😃")
    collected = await msg.awaitReactions(
      (reaction, user) => {
         return reaction.emoji.name === "😃" && user.id == message.author.id
      },
      { time : 15000, max : 1 }
    )
    console.log(collected)
    if ( collected.size != 0 ){
      childs.execute(message, args);
    }
  }
}

module.exports = {
    name : 'defaultAction',
    description : 'defaultAction',
    execute : defaultAction
}