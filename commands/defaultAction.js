require("dotenv").config()
const childs = require("./childs")
const getMostMatchingCard = require("../tools/getMostMatchingCard");
const loadUserConfig = require("../tools/loadUserConfig");

function base64_decode(base64Image, file) {
  fs.writeFileSync(file,base64Image);
   console.log('******** File created from base64 encoded string ********');
}


async function defaultAction(message, args, blizzardToken, class_){
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  let userConfig = await loadUserConfig(message.author);
  const resCard = await getMostMatchingCard(message, args, userConfig.gameMode, blizzardToken);
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
      childs.execute(message, args, blizzardToken);
    }
  }
}

module.exports = {
  name : 'defaultAction',
  description : 'defaultAction',
  execute : defaultAction
}