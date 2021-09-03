const Paginator = require("../tools/Paginator");
const loadUserConfig = require("../tools/loadUserConfig")
const cardNameInfer = require("../tools/cardNameInfer");

async function name(message, args, info){
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let class_ = info.class_;
  let searchingMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author.id);

  let resCards = await cardNameInfer(args, userConfig.gameMode);
  
  if(class_ && resCards) resCards = resCards.filter(card => card.classId == class_.classId)
  if ( !resCards || resCards.length <= 0 ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }

  const pagi = new Paginator(message, resCards, userConfig.paginateStep, resCards.length, c => c,
    {lengthEnabled: true, goldenCardMode: userConfig.goldenCardMode});
  let msgs = await pagi.next();
  searchingMessage.delete();

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
}

module.exports = {
  name : ['이름', '카드명'],
  description : 'name',
  execute : name
}