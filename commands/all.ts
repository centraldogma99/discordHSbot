/*
  로컬  DB화 미루기 - 서치 성능 이슈(확인 안됨), 한글 검색 불가
*/

import { Paginator } from "../tools/Paginator";
import { loadUserConfig } from "../tools/loadUserConfig";
import { uniqueArray } from "../tools/helpers/uniqueArray";
import { range } from "../tools/helpers/range";
import CONSTANTS from "../constants";
import { BlizzardToken } from "../tools/BlizzardToken";
import { safeAxiosGet } from "../tools/helpers/safeAxiosGet";
import { Message } from "discord.js";
import { Card } from "../types/card";
import { searchInfo } from "../types/searchInfo";

async function all(message: Message, args: string, info: searchInfo) {
  if (!args) {
    await message.channel.send("❌ 검색어를 입력해 주세요.");
    return;
  }

  const blizzardToken = await BlizzardToken.getToken();
  const userConfig = await loadUserConfig(message.author);

  function axiosShort(page: number) {
    return () =>
      safeAxiosGet(
        `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
        {
          params: {
            locale: userConfig.languageMode,
            textFilter: encodeURI(args),
            gameMode:
              userConfig.gameMode == "battlegrounds"
                ? "battlegrounds"
                : "constructed",
            tier: info?.tier ?? null,
            class: info?.class_?.name,
            set:
              userConfig.gameMode == "battlegrounds"
                ? null
                : userConfig.gameMode,
            pageSize: CONSTANTS.pageSize,
            page: page,
            access_token: blizzardToken,
          },
        }
      )
        .then((res) => res.data.cards)
        .then((cards) => uniqueArray(cards, "name"))
        .then((cards: Card[]) => cards.map((card) => card.image))
        .catch((e) => {
          throw e;
        });
  }

  const searchingMessage = await message.channel.send("🔍 검색 중입니다...");
  await message.channel.sendTyping();

  let temp;
  try {
    temp = await safeAxiosGet(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: userConfig.languageMode,
          textFilter: encodeURI(args),
          gameMode:
            userConfig.gameMode == "battlegrounds"
              ? "battlegrounds"
              : "constructed",
          tier: info?.tier ?? null,
          class: info?.class_?.name,
          set:
            userConfig.gameMode == "battlegrounds" ? null : userConfig.gameMode,
          pageSize: CONSTANTS.pageSize,
          page: 1,
          access_token: blizzardToken,
        },
      }
    ).catch((e) => {
      throw e;
    });
  } catch (e) {
    console.log(e);
    message.channel.send(
      "‼️ 카드 정보를 가져오던 중 오류가 발생했습니다. 다시 시도해 주세요!"
    );
    return;
  }

  const cardCount = temp.data.cardCount;
  if (cardCount == 0) {
    message.channel.send(
      "‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요."
    );
    return;
  }
  const firstCards = uniqueArray(temp.data.cards as Card[], "name");

  let promises: (() => Promise<string[]>)[];
  if (Math.ceil(cardCount / CONSTANTS.pageSize) > 1) {
    promises = range(Math.ceil(cardCount / CONSTANTS.pageSize), 2).map((i) =>
      axiosShort(i)
    );
    promises = [
      () => Promise.resolve(firstCards.map((card) => card.image)),
      ...promises,
    ];
  } else {
    promises = [() => Promise.resolve(firstCards.map((card) => card.image))];
  }

  const pagi = new Paginator(
    message,
    { value: promises, isPromise: true },
    userConfig.paginateStep,
    CONSTANTS.pageSize,
    true,
    cardCount
  );
  let msgs = await pagi.next();
  searchingMessage.delete().catch(console.log);

  while (msgs) {
    const [m, reaction] = await msgs.infoPromise;
    await m;
    if (reaction === "next") {
      await message.channel.sendTyping();
      await msgs.infoMessage.delete().catch(console.log);
      msgs = await pagi.next();
    } else if (reaction === "prev") {
      await message.channel.sendTyping();
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
  name: ["모든"],
  description: "all",
  execute: all,
};
