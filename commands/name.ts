import { loadUserConfig } from "../tools/loadUserConfig";
import { cardNameInfer } from "../tools/cardNameInfer";
import { Message } from "discord.js";
import { Paginator } from "../tools/Paginator";
import { searchInfo } from "../types/searchInfo";
import stringsKor from "../languages/kor/search.json"
import stringsEng from "../languages/eng/search.json"
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLang, parseLangArr } from "../languages/parseLang"

async function name(message: Message, args: string, info: searchInfo) {
  const userConfig = await loadUserConfig(message.author);

  const lang = userConfig.languageMode === 'ko_KR' ? parseLang(stringsKor) : parseLang(stringsEng);
  // DB는 이미 중복 제거되어 있으므로 중복 처리 필요 없음
  if (!args) {
    await message.channel.send(lang("ERROR-NO-KEYWORD"))
    return;
  }
  let class_ = info.conditions?.class_;
  let searchingMessage = await message.channel.send(lang("SEARCHING"))
  await message.channel.sendTyping().catch(console.log);

  let resCards = await cardNameInfer(args, userConfig.gameMode, userConfig.languageMode);

  if (class_ && resCards) resCards = resCards.filter(card => card.classId === class_.id)
  if (!resCards || resCards.length <= 0) {
    message.channel.send(lang("ERROR-NO-RESULT"));
    return;
  }

  const pagi = new Paginator(message, { value: resCards.map(card => card.image), isPromise: false }, userConfig.paginateStep, userConfig.languageMode);
  let msgs = await pagi.next();
  searchingMessage.delete().catch(console.log);

  while (msgs) {
    const [m, reaction] = await msgs.infoPromise;
    await m;
    if (reaction === "next") {
      await message.channel.sendTyping().catch(console.log);
      await msgs.infoMessage.delete().catch(console.log);
      msgs = await pagi.next();
    } else if (reaction === "prev") {
      await message.channel.sendTyping().catch(console.log);
      await msgs.infoMessage.delete().catch(console.log);
      msgs = await pagi.prev();
    } else if (reaction === "timeout") {
      msgs.infoMessage.delete().catch(console.log);
      break;
    }
  }
  return;
}

module.exports = {
  name: [...parseLangArr(commandsKor)("NAME"), ...parseLangArr(commandsEng)("NAME")],
  description: 'name',
  execute: name
}