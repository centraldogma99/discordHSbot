import { Paginator } from "../tools/Paginator";
import { getMostMatchingCard } from "../tools/getMostMatchingCard";
import { loadUserConfig } from "../tools/loadUserConfig";
import { safeAxiosGet } from "../tools/helpers/safeAxiosGet";
import { BlizzardToken } from "../tools/BlizzardToken";
import CONSTANTS from "../constants";
import { Message } from "discord.js";
import { searchInfo } from "../types/searchInfo";
import { Card } from "../types/card";

async function childs(message: Message, args: string, info: searchInfo) {
  const cardLanguage = process.env.CARD_LANGUAGE;
  if (!args) {
    await message.channel.send("❌ Please enter a keyword to search.")
    return;
  }
  let resCard: Card, searchingMessage: Message;
  const userConfig = await loadUserConfig(message.author);
  if (!info?.fromDefault) {
    // fromDefault가 false일 경우, 카드 찾기
    searchingMessage = await message.channel.send("🔍 Searching...");
    await message.channel.sendTyping().catch(console.log);

    resCard = await getMostMatchingCard(args, userConfig.gameMode, info?.conditions?.class_);
    if (!resCard) {
      message.channel.send("‼️ No results found! Make sure there are no spaces between letters.");
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

  if (resCard.childIds.length > 0) {
    promises = resCard.childIds.map(id => () => safeAxiosGet(`https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards/${id}`,
      {
        params: {
          locale: cardLanguage,
          access_token: blizzardToken
        }
      }
    )
      .then(res => res.data.image)
      .catch(e => { throw e }));
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
  } else {
    message.channel.send("‼️ There are no related cards matching the card.!");
    return;
  }
}

module.exports = {
  name: ['child', 'token', 'related'],
  description: 'childs',
  execute: childs
};