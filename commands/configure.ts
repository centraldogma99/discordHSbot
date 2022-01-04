import { Message, MessageActionRow, MessageActionRowComponent, MessageButton, User } from 'discord.js';
import { userModel } from '../db';
import { loadUserConfig } from '../tools/loadUserConfig';
import configKor from "../languages/kor/config.json"
import configEng from "../languages/eng/config.json"
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLang, parseLangArr } from "../languages/parseLang"

async function addConfig(messageAuthor: User, fieldName: string, value: any) {
  let query = userModel.findOne({ id: messageAuthor.id });
  try {
    const user = await query.exec();
    return user.updateOne({ [fieldName]: value }).exec();
  } catch (e) {
    return await userModel.insertMany([{
      id: messageAuthor.id,
      tag: messageAuthor.tag,
      [fieldName]: value
    }]);
  }
}

async function configure(message: Message) {
  const userConfig = await loadUserConfig(message.author);
  const lang = userConfig.languageMode === 'ko_KR' ? parseLang(configKor) : parseLang(configEng)

  // 게임모드 설정 시작
  const f1 = async () => {
    let gameModeButtons = [
      new MessageButton()
        .setCustomId('standard')
        .setLabel(lang("STANDARD"))
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('wild')
        .setLabel(lang("WILD"))
        .setStyle('SECONDARY')
    ];
    for (const button of gameModeButtons) {
      if (button.customId == userConfig.gameMode) {
        button.setStyle("PRIMARY");
        button.setDisabled(true);
        break;
      }
    }
    await message.channel.send(
      lang("CONFIG-CONFIGURING").replace("{name}", message.author.tag)
    );
    const gameModeMsg = await message.channel.send({
      content: lang('GAMEMODE-CONFIG-TITLE'),
      components: [new MessageActionRow().addComponents(gameModeButtons)]
    });
    let gameModeMsgCollector = gameModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
    gameModeMsgCollector.on('collect', async i => {
      if (i.user.id != message.author.id) return;
      await addConfig(message.author, "gameMode", (i.component as MessageActionRowComponent).customId);
      const resultStr = lang("CONFIG-RESULT")
        .replace("{user}", message.author.tag)
        .replace("{config}", lang("GAMEMODE"))
        .replace("{value}", (i.component as any).label)
      await i.update({ content: resultStr, components: [] })
      gameModeMsgCollector.stop("done");
    })
    gameModeMsgCollector.on('end', async (_, r) => {
      if (r == 'time') await gameModeMsg.delete().catch(console.log);
    })
  }
  f1();
  // 게임모드 설정 끝

  // 언어 설정 시작
  (async () => {
    const languageButtons = [
      new MessageButton()
        .setCustomId('en_US')
        .setLabel('English')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('ko_KR')
        .setLabel('한국어')
        .setStyle('SECONDARY')
    ];
    for (const button of languageButtons) {
      if (button.customId === userConfig.languageMode) {
        button.setStyle("PRIMARY");
        button.setDisabled(true);
        break;
      }
    }

    let mainMsg = await message.channel.send({
      content: lang('LANGUAGE-CONFIG-TITLE'),
      components: [new MessageActionRow().addComponents(languageButtons)]
    });
    const msgCollector = mainMsg.createMessageComponentCollector({
      componentType: 'BUTTON', time: 30000
    });
    msgCollector.on('collect', async i => {
      if (i.user.id != message.author.id) return;
      await addConfig(
        message.author, "languageMode",
        (i.component as MessageActionRowComponent).customId
      );
      const resultStr = lang("CONFIG-RESULT")
        .replace("{user}", message.author.tag)
        .replace("{config}", lang("LANGUAGE"))
        .replace("{value}", (i.component as any).label)
      await i.update({ content: resultStr, components: [] })
      msgCollector.stop("done");
    })
    msgCollector.on('end', async (_, r) => {
      if (r == 'time') await mainMsg.delete().catch(console.log);
    })
  })();
  // 언어 설정 끝

  // 황금 설정 시작
  // let goldenCardModeButtons = [
  //   new MessageButton()
  //     .setCustomId('false')
  //     .setLabel('일반')
  //     .setStyle('SECONDARY'),
  //   new MessageButton()
  //     .setCustomId('true')
  //     .setLabel('황금')
  //     .setStyle('SECONDARY'),
  // ];
  // for (const button of goldenCardModeButtons){
  //   if ((button.customId === 'true') == userConfig.goldenCardMode){
  //     button.setStyle("PRIMARY");
  //     button.setDisabled(true);
  //     break;
  //   }
  // }

  // const row3 = new MessageActionRow().addComponents(goldenCardModeButtons);
  // let goldenCardModeMsg = await message.channel.send({
  //   content: '⚙️ 황금카드 설정(황금카드 이미지가 없으면 일반 카드로 검색됩니다.)',
  //   components: [row3]
  // });
  // let goldenCardModeMsgCollector = goldenCardModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  // goldenCardModeMsgCollector.on('collect', async i => {
  //   if ( i.user.id != message.author.id ) return;
  //   await addConfig(message.author.id, "goldenCardMode", (i.component as MessageActionRowComponent).customId === 'true')
  //   await i.update({ content: `☑️ ${message.author.username}#${message.author.discriminator}님의 황금카드모드가 "${(i.component as any).label}"으로 설정되었습니다.`, components: [] })
  //   goldenCardModeMsgCollector.stop("done");
  // })
  // goldenCardModeMsgCollector.on('end', (_, r) => {
  //   if(r == 'time') {
  //     goldenCardModeMsg.delete().catch(console.log);
  //     firstMsg.delete().catch(console.log);
  //   }
  // })
  // 황금 설정 끝

  // 페이지 설정 시작
  (async () => {
    const pageMenuButton = new MessageButton()
      .setCustomId('pageMenu')
      .setStyle('PRIMARY')
      .setLabel(lang("PAGE-CONFIG-BUTTON"))
    const row2 = new MessageActionRow().addComponents(pageMenuButton);

    let pageMsg = await message.channel.send({
      content: lang("PAGE-CONFIG-TITLE").replace("{value}", userConfig.paginateStep.toString()),
      components: [row2]
    });
    const pageMsgCollector = pageMsg.createMessageComponentCollector({
      componentType: 'BUTTON', time: 30000
    });
    pageMsgCollector.on('collect', async (i) => {
      if (i.user.id != message.author.id) return;
      await i.update({
        content: lang("PAGE-CONFIG-MESSAGE").replace("{value}", userConfig.paginateStep.toString()),
        components: []
      })
      const messageCollector = message.channel.createMessageCollector({ time: 30000 });
      messageCollector.on('collect', async m => {
        if (isNaN(m.content as any) || parseInt(m.content) < 1 || parseInt(m.content) > 9) {
          messageCollector.stop("wrongValue");
          return;
        } else {
          await addConfig(message.author, "paginateStep", parseInt(m.content))
          messageCollector.stop("answered");
          return;
        }
      })
      messageCollector.on('end', async (m, r) => {
        if (r == 'answered') {
          const resultStr = lang('CONFIG-RESULT')
            .replace('{user}', message.author.tag)
            .replace('{config}', lang("PAGE"))
            .replace('{value}', m.first().content)
          await message.channel.send(resultStr);
          pageMsg.delete().catch(console.log);
        } else if (r == 'time') {
          message.channel.send(lang("ERROR-TIMEOUT"))
        } else if (r == 'wrongValue') {
          message.channel.send(lang("ERROR-INVALID"));
        }
      })
    })
    pageMsgCollector.on('end', async (_, r) => {
      if (r == 'time') await pageMsg.delete().catch(console.log);
    })
  })();
  // 페이지 설정 끝
}
module.exports = {
  name: [...parseLangArr(commandsKor)("CONFIGURE"),
  ...parseLangArr(commandsEng)("CONFIGURE")],
  description: "configure",
  execute: configure
}