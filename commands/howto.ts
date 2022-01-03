import { Message, MessageEmbed, MessageButton, MessageActionRow } from "discord.js";
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLangArr } from "../languages/parseLang"
import { loadUserConfig } from "../tools/loadUserConfig";
import korSet from "../languages/kor/howto.json"
import engSet from "../languages/eng/howto.json"

async function howto(message: Message) {
  const userConfig = await loadUserConfig(message.author)
  const lang = userConfig.languageMode === 'ko_KR' ? korSet : engSet;
  let currentPage = 0;

  const embeds = lang.pages.map(page =>
    new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(lang.title)
      .setDescription(page.desc)
      .addFields(page.fields)
  )

  const showMessages = async () => {
    let moveButtons = [
      new MessageButton()
        .setCustomId('prev')
        .setLabel('이전')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('next')
        .setLabel(`다음 (${currentPage + 1}/${lang.pages.length})`)
        .setStyle('PRIMARY')
    ]

    if (lang.pages.length - currentPage - 1 === 0) {
      moveButtons[1].setDisabled(true);
    } else {
      moveButtons[1].setDisabled(false);
    }
    if (lang.pages.length - currentPage - 1 === 4) {
      moveButtons[0].setDisabled(true);
    } else {
      moveButtons[0].setDisabled(false);
    }

    const p = await message.channel.send({
      embeds: [embeds[currentPage]],
      components: [new MessageActionRow().addComponents(moveButtons)]
    });
    try {
      const i = await p.awaitMessageComponent({
        componentType: 'BUTTON',
        time: 30000
      })
      if ((i.component as MessageButton).customId === 'prev') {
        p.delete();
        currentPage--;
        showMessages();
      } else {
        p.delete();
        currentPage++;
        showMessages();
      }
    } catch (e) {
      p.delete()
      return;
    }
  }

  showMessages();
}

module.exports = {
  name: [...parseLangArr(commandsKor)("HOWTO"), ...parseLangArr(commandsEng)("HOWTO")],
  description: 'howto',
  execute: howto
}