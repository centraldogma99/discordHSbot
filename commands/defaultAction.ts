const childs = require("./childs");
import { getMostMatchingCard } from "../tools/getMostMatchingCard";
import { loadUserConfig } from "../tools/loadUserConfig";
import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { searchInfo } from "../types/searchInfo";
import stringsKor from "../languages/kor/search.json"
import stringsEng from "../languages/eng/search.json"
import { parseLang } from "../languages/parseLang"

async function defaultAction(message: Message, args: string, info: searchInfo) {
  const userConfig = await loadUserConfig(message.author);
  const lang = userConfig.languageMode === 'ko_KR' ? parseLang(stringsKor) : parseLang(stringsEng);

  let searchingMessage = await message.channel.send(lang("SEARCHING"))
  await message.channel.sendTyping().catch(console.log);

  const resCard = await getMostMatchingCard(args, userConfig.gameMode, info?.conditions?.class_);
  if (!resCard) {
    message.channel.send(lang("ERROR-NO-RESULT"));
    return;
  }

  const targetImage = resCard.image;

  let msgObj: { files: string[], components?: MessageActionRow[] } = { files: [targetImage] }
  searchingMessage.delete().catch(console.log);

  if (resCard.childIds.length > 0) {
    const btn = new MessageButton()
      .setCustomId('primary')
      .setLabel(lang("SEARCH-TOKENS"))
      .setStyle('PRIMARY');
    const row = new MessageActionRow()
      .addComponents(btn)
    msgObj.components = [row];
    const msg = await message.channel.send(msgObj);
    const buttonCollector = msg.createMessageComponentCollector({ componentType: 'BUTTON', time: 20000, max: 1 });
    buttonCollector.on('collect', async i => {
      await i.update({ content: lang("SEARCHING-TOKENS"), components: [] })
      await childs.execute(message, args, { fromDefault: true, card: resCard });
    })
    buttonCollector.on('end', async (_, r) => {
      if (r == 'time') await msg.delete().catch(console.log);
    })
  } else {
    await message.channel.send(msgObj);
  }

}

module.exports = {
  name: ['defaultAction'],
  description: 'defaultAction',
  execute: defaultAction
};