const axios = require("axios")
const paginator = require("../tools/Paginator");
const getMostMatchingCard = require("../tools/getMostMatchingCard");
const loadUserConfig = require("../tools/loadUserConfig")
const CONSTANTS = require('../constants')

function preProcess(cards){
  return cards;
}

async function childs(message, args, blizzardToken){
  if ( !args ){ await message.channel.send("찾을 카드명을 입력해 주세요."); return; }
  const infoMessage = await message.channel.send("🔍 검색 중입니다...");
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);

  const resCard = await getMostMatchingCard(message, args, userConfig.gameMode, blizzardToken);
  if (!resCard) return;
  await message.channel.send({files: [resCard.image]})

  let promises = [];

  if(resCard.childIds != null){
    promises = resCard.childIds.map( id => 
      axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards/${ id }`,
      { params : {
        locale: userConfig.languageMode,
        access_token: blizzardToken
      }})
      .then(res => res.data)
    )

    let pagi = new paginator(message, [Promise.all(promises)], userConfig.paginateStep, resCard.childIds.length, preProcess, true, userConfig.goldenCardMode);
    let msgs = await pagi.next();
    infoMessage.delete()

    while(msgs && msgs.reaction){
      msgs.targetMessage.delete();
      msgs.infoMessage.delete();
      if( msgs.reaction === "➡️" ){
        await message.channel.sendTyping();
        msgs = await pagi.next();
      } else if( msgs.reaction === "⬅️" ){
        await message.channel.sendTyping();
        msgs = await pagi.prev();
      }
    }
    return;
  } else {
    message.channel.send("‼️ 해당 카드의 관련 카드가 없습니다!");
    return;
  }
}

module.exports = {
  name : '관련',
  description : 'childs',
  execute : childs
}