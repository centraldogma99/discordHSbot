import { loadUserConfig } from "../tools/loadUserConfig";
import { cardNameInfer } from "../tools/cardNameInfer";
import { Message } from "discord.js";
import { Paginator } from "../tools/Paginator";
import { searchInfo } from "../types/searchInfo";

async function name(message: Message, args: string, info: searchInfo){
  // DB는 이미 중복 제거되어 있으므로 중복 처리 필요 없음
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let class_ = info.class_;
  let searchingMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);

  let resCards = await cardNameInfer(args, userConfig.gameMode);
  
  if(class_ && resCards) resCards = resCards.filter(card => card.classId == class_.id)
  if ( !resCards || resCards.length <= 0 ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }

  const pagi = new Paginator(message, { value: resCards.map(card => card.image), isPromise: false }, userConfig.paginateStep);
  let msgs = await pagi.next();
  searchingMessage.delete().catch(console.log);

  while(msgs){
    const [m, reaction] = await msgs.infoPromise;
    await m;
    if( reaction === "next" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete().catch(console.log);
      msgs = await pagi.next();
    } else if( reaction === "prev" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete().catch(console.log);
      msgs = await pagi.prev();
    } else if( reaction === "timeout" ){
      msgs.infoMessage.delete().catch(console.log);
      break;
    }
  }
  return;
}

module.exports = {
  name : ['name', 'cardname'],
  description : 'name',
  execute : name
}