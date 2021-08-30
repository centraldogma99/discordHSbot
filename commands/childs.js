const Paginator = require("../tools/Paginator");
const getMostMatchingCard = require("../tools/getMostMatchingCard");
const loadUserConfig = require("../tools/loadUserConfig")
const childRequest = require("../tools/childRequest");

function preProcess(cards){
  return cards;
}

async function childs(message, args, info){
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let resCard, searchingMessage;
  const userConfig = await loadUserConfig(message.author);
  if ( !info?.fromDefault ){
    searchingMessage = await message.channel.send("🔍 검색 중입니다...");
    await message.channel.sendTyping();

    resCard = await getMostMatchingCard(args, userConfig.gameMode, info?.class_);
    if (!resCard) {
      message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
      return;
    }
    await message.channel.send({files: [resCard.image]})
  } else {
    resCard = info?.card;
  }
  
  await message.channel.sendTyping();
  let promises = [];

  if( resCard.childIds.length > 0 ){
    promises = childRequest(resCard.childIds, userConfig);

    let pagi = new Paginator(message, promises, userConfig.paginateStep, resCard.childIds.length, preProcess, lengthEnabled = false, userConfig.goldenCardMode);
    let msgs = await pagi.next();
    searchingMessage?.delete()

    while(msgs){
      [m, reaction] = await msgs.infoPromise;
      await m;
      if( reaction === "next" ){
        await message.channel.sendTyping();
        await msgs.infoMessage.delete();
        msgs = await pagi.next();
      } else if( reaction === "prev" ){
        await message.channel.sendTyping();
        await msgs.infoMessage.delete();
        msgs = await pagi.prev();
      } else if( reaction === "timeout" ){
        msgs.infoMessage.delete();
        break;
      }
    }
    return;
  } else {
    message.channel.send("‼️ 해당 카드의 관련 카드가 없습니다!");
    return;
  }
}

module.exports = {
  name : ['관련', '토큰'],
  description : 'childs',
  execute : childs
}