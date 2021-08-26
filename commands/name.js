const Paginator = require("../tools/Paginator");
const loadUserConfig = require("../tools/loadUserConfig")
const cardNameInfer = require("../tools/cardNameInfer");

function preProcess(args){
  return args;
}

async function name(message, args, info){
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let class_ = info.class_;
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);

  let resCards = await cardNameInfer(args, userConfig.gameMode);
  
  if(class_ && resCards) resCards = resCards.filter(card => card.classId == class_.classId)
  if ( !resCards || resCards.length <= 0 ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }

  let pagi = new Paginator(message, resCards, userConfig.paginateStep, resCards.length, preProcess, true, userConfig.goldenCardMode);
  let msgs = await pagi.next();
  infoMessage.delete();

  while(msgs){
    if( await msgs.reaction === "next" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete();
      msgs = await pagi.next();
    } else if( await msgs.reaction === "prev" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete();
      msgs = await pagi.prev();
    }
  }
  return;
}

module.exports = {
  name : '이름',
  description : 'name',
  execute : name
}