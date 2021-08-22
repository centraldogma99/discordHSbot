const childs = require("./childs")
const getMostMatchingCard = require("../tools/getMostMatchingCard");
const loadUserConfig = require("../tools/loadUserConfig");
const cardNameUntrim = require('../tools/cardNameUntrim')

async function defaultAction(message, args, blizzardToken, class_){
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  let userConfig = await loadUserConfig(message.author);
  let cardNameProcessed = await cardNameUntrim(args, userConfig.gameMode);
  if( !cardNameProcessed ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }
  cardNameProcessed = cardNameProcessed.name
  const resCard = await getMostMatchingCard(message, cardNameProcessed, userConfig.gameMode, blizzardToken);
  if (!resCard) return;

  const targetImage = userConfig.goldenCardMode ?
    (resCard.imageGold ? resCard.imageGold : resCard.image) : resCard.image;
  
  await message.channel.send({files: [targetImage]});
  infoMessage.delete();
  if( resCard.childIds != null ){
    msg = await message.channel.send("**< ! >**  관련 카드가 있습니다. 아래 ➡️을 눌러 관련 카드를 검색할 수 있습니다.")
    await msg.react("➡️")
    collected = await msg.awaitReactions(
      { filter: (reaction, user) => {
          return reaction.emoji.name === "➡️" && user.id == message.author.id;
        },
        time : 20000, max : 1
      }
    )
    if ( collected.size != 0 ){
      childs.execute(message, args, blizzardToken, fromDefault = true);
    }
  }
}

module.exports = {
  name : 'defaultAction',
  description : 'defaultAction',
  execute : defaultAction
}