/*
  로컬 DB화 미루기 - 서치 성능 이슈(확인 안됨), 한글 검색 불가
*/

import { Paginator } from "../tools/Paginator";
import { loadUserConfig } from "../tools/loadUserConfig";
import { uniqueArray } from '../tools/helpers/uniqueArray';
import { range } from '../tools/helpers/range';
import CONSTANTS from '../constants';
import { BlizzardToken } from "../tools/BlizzardToken";
import safeAxios from "../tools/helpers/safeAxiosGet";
import { Message } from "discord.js";
import { Card } from "../types/card";
import { searchInfo } from "../types/searchInfo"
import ApiRes from "../types/ApiRes"
import loadLang from "../languages/loadLang";
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLangArr } from "../languages/parseLang"
import { AxiosResponse } from "axios";

const axios = safeAxios();

async function all(message: Message, args: string, info: searchInfo) {
  const userConfig = await loadUserConfig(message.author);
  const lang = loadLang(userConfig.languageMode)

  if (!args) {
    await message.channel.send(lang("ERROR-NO-KEYWORD"))
    return;
  }

  const blizzardToken = await BlizzardToken.getToken();

  function axiosShort(page: number) {
    return () => axios.get<ApiRes>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: userConfig.languageMode,
          textFilter: encodeURI(args),
          gameMode: userConfig.gameMode == 'battlegrounds' ? 'battlegrounds' : 'constructed',
          tier: info?.conditions?.tier ?? null,
          class: info?.conditions?.class_?.name,
          set: userConfig.gameMode == 'battlegrounds' ? null : userConfig.gameMode,
          pageSize: CONSTANTS.pageSize,
          page: page,
          access_token: blizzardToken
        }
      })
      .then(res => res.data.cards)
      .then(cards => uniqueArray(cards, "name"))
      .then((cards: Card[]) => cards.map(card => card.image))
  }

  const searchingMessage = await message.channel.send(lang("SEARCHING"))
  await message.channel.sendTyping().catch(console.log);

  let cardCount: number;
  let temp: AxiosResponse<ApiRes>;
  try {
    temp = await axios.get<ApiRes>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: userConfig.languageMode,
          textFilter: encodeURI(args),
          gameMode: userConfig.gameMode == 'battlegrounds' ? 'battlegrounds' : 'constructed',
          tier: info?.conditions?.tier ?? null,
          class: info?.conditions?.class_?.name,
          set: userConfig.gameMode == 'battlegrounds' ? null : userConfig.gameMode,
          pageSize: CONSTANTS.pageSize,
          page: 1,
          access_token: blizzardToken
        }
      })
      .catch(e => { throw e })
  } catch (e) {
    console.log(e);
    message.channel.send(lang("ERROR-RETRIEVE-API"));
    return;
  }

  cardCount = temp.data.cardCount;
  if (cardCount == 0) {
    message.channel.send(lang("ERROR-NO-RESULT"));
    return;
  }
  let firstCards = uniqueArray(temp.data.cards, "name");

  let promises: (() => Promise<string[]>)[];
  if (Math.ceil(cardCount / CONSTANTS.pageSize) > 1) {
    promises = range(Math.ceil(cardCount / CONSTANTS.pageSize), 2).map(i =>
      axiosShort(i)
    )
    promises = [() => Promise.resolve(firstCards.map(card => card.image)), ...promises]
  } else {
    promises = [() => Promise.resolve(firstCards.map(card => card.image))]
  }

  const pagi = new Paginator(message, { value: promises, isPromise: true }, userConfig.paginateStep, CONSTANTS.pageSize, true, cardCount)
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
  name: [...parseLangArr(commandsKor)("ALL"), ...parseLangArr(commandsEng)("ALL")],
  description: 'all',
  execute: all
}