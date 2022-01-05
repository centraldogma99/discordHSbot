import { BlizzardToken } from "../tools/BlizzardToken";
import { Paginator } from "../tools/Paginator";
import safeAxios from "../tools/helpers/safeAxiosGet";
import CONSTANTS from "../constants";
import { loadUserConfig } from "../tools/loadUserConfig";
import { Message, MessageEmbed } from "discord.js";
import { requestScheduler as RequestScheduler } from "../tools/helpers/RequestScheduler";
import { uniqueArray } from "../tools/helpers/uniqueArray";
import { Card } from "../types/card";
import { ApiResDeckCode } from "../types/ApiRes";
import loadLang from "../languages/loadLang";
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLangArr } from "../languages/parseLang"

const axios = safeAxios();

async function deck(message: Message, args: string) {
  const userConfig = await loadUserConfig(message.author);
  const lang = loadLang(userConfig.languageMode)

  if (!args) {
    await message.channel.send(lang("ERROR-NO-KEYWORD"))
    return;
  }
  let code = args.split('\n').filter(line => line != '').filter(line => !line.startsWith('#'))[0];

  const searchingMessage = await message.channel.send(lang("SEARCHING"))

  const blizzardToken = await BlizzardToken.getToken();
  let deckInfoPromise = () => axios.get<ApiResDeckCode>(
    `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/deck`,
    {
      params: {
        locale: userConfig.languageMode,
        code: code,
        access_token: blizzardToken
      }
    })
    .then(res => res.data)

  let deckInfo;
  try {
    deckInfo = await RequestScheduler.getRes(RequestScheduler.addReq(deckInfoPromise));
    if (deckInfo instanceof Error) throw deckInfo;
  } catch (e) {
    console.log(e.response.status);
    if (e.response.status === 400)
      message.channel.send(lang("ERROR-INVALID-DECKCODE"));
    else
      throw e;
    return;
  }

  let cards: Card[] = deckInfo.cards.sort((a: Card, b: Card) => a.manaCost - b.manaCost);
  const names = cards.map(card => card.name)
  const costsAndRarities = Object.fromEntries(cards.map(card =>
    [card.name, { cost: card.manaCost, isLegendary: card.rarityId == 5 ? '⭐' : '' }]))
  const obj = {};
  for (const name of names) {
    if (!obj[name]) obj[name] = 1;
    else obj[name] += 1;
  }
  const str = Object.keys(obj).map(
    k => `${obj[k]} x (${costsAndRarities[k].cost}) ${k} ${costsAndRarities[k].isLegendary}`
  ).join('\n')

  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(lang("DECKLIST-TITLE").replace("{class}", deckInfo.class.name))
    .setDescription(str)
    .setThumbnail(deckInfo.hero.image)
  await message.channel.send({ embeds: [embed] });

  await message.channel.sendTyping().catch(console.log);
  // remove redundant cards
  cards = uniqueArray(cards, 'name');
  const pagi = new Paginator(message, { value: cards.map((card: Card) => card.image), isPromise: false }, userConfig.paginateStep, userConfig.languageMode)  // #FIXME maybe
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
}

module.exports = {
  name: [...parseLangArr(commandsKor)("DECK"), ...parseLangArr(commandsEng)("DECK")],
  description: "decklist",
  execute: deck
};