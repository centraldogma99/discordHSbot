import { Paginator } from "../tools/Paginator";
import { getMostMatchingCard } from "../tools/getMostMatchingCard";
import { loadUserConfig } from "../tools/loadUserConfig";
import safeAxios from "../tools/helpers/safeAxiosGet";
import { BlizzardToken } from "../tools/BlizzardToken";
import CONSTANTS from "../constants";
import { Message } from "discord.js";
import { searchInfo } from "../types/searchInfo";
import { Card } from "../types/card";
import loadLang from "../languages/loadLang"
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLangArr } from "../languages/parseLang"

const axios = safeAxios();

async function childs(message: Message, args: string, info: searchInfo) {
  const userConfig = await loadUserConfig(message.author);
  const lang = loadLang(userConfig.languageMode)

  if (!args) {
    await message.channel.send(lang("ERROR-NO-KEYWORD"))
    return;
  }
  let resCard: Card, searchingMessage: Message;
  if (!info?.fromDefault) {
    // fromDefault가 false일 경우, 카드 찾기
    searchingMessage = await message.channel.send(lang("SEARCHING"));
    await message.channel.sendTyping().catch(console.log);

    resCard = await getMostMatchingCard(args,
      userConfig.gameMode,
      info?.conditions?.class_,
      userConfig.languageMode);
    if (!resCard) {
      message.channel.send(lang("ERROR-NO-RESULT"));
      return;
    }
    await message.channel.send({ files: [resCard.image] })
  } else {
    // fromDefault true일 경우, defaultAction에서 card를 보내줌.
    resCard = info?.card;
  }

  await message.channel.sendTyping().catch(console.log);
  let promises = [];
  let blizzardToken = await BlizzardToken.getToken();

  if (resCard.childIds.length === 0) {
    message.channel.send(lang("ERROR-NO-RESULT"));
    return;
  }

  promises = resCard.childIds.map(id =>
    () => axios.get<Card>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards/${id}`,
      {
        params: {
          locale: userConfig.languageMode,
          access_token: blizzardToken
        }
      }
    )
      .then(res => res.data.image));
  const pagi = new Paginator(message, { value: promises, isPromise: true }, userConfig.paginateStep, 1)
  let msgs = await pagi.next();
  searchingMessage?.delete().catch(console.log);

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
  name: [...parseLangArr(commandsKor)("CHILD"), ...parseLangArr(commandsEng)("CHILD")],
  description: 'childs',
  execute: childs
};