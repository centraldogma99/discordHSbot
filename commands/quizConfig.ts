import { MessageActionRow, MessageButton, User } from 'discord.js';
import { userModel } from "../db";
import { loadUserConfig } from '../tools/loadUserConfig';
import kor from "../languages/kor/quizConfig.json"
import eng from "../languages/eng/quizConfig.json"
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLang, parseLangArr } from "../languages/parseLang"

// FIXME duplicate code
async function addQuizConfig(messageAuthor: User, fieldName: string, value) {
  // @value should be typechecked before given as parameter
  try {
    const user = await userModel.findOne({ id: messageAuthor.id });
    if (!user.quizConfig.gameMode
      && !user.quizConfig.rarity
      && !user.quizConfig.difficulty
      && !user.quizConfig.chances) {
      return user.updateOne({ quizConfig: { [fieldName]: value } });
    } else {
      return user.updateOne({ $set: { [`quizConfig.${fieldName}`]: value } });
    }
  } catch (e) {
    return userModel.insertMany([{
      id: messageAuthor.id,
      tag: messageAuthor.tag,
      quizConfig: { [fieldName]: value }
    }]);
  }
}

async function quizConfig(message) {
  let userConfig = await loadUserConfig(message.author);
  const lang = userConfig.languageMode === 'ko_KR' ?
    parseLang(kor) : parseLang(eng);

  async function chanceConfig(message) {
    const messageCollector = message.channel.createMessageCollector({ time: 30000 });
    messageCollector.on('collect', async m => {
      if (isNaN(m.content) || parseInt(m.content) < 3 || parseInt(m.content) > 9) {
        messageCollector.stop("wrongValue");
        return;
      } else {
        await addQuizConfig(message.author, "chances", parseInt(m.content))
        messageCollector.stop("answered");
        return;
      }
    })
    messageCollector.on('end', async (m, r) => {
      if (r == 'answered') {
        await message.channel.send(
          lang("QUIZCONFIG-RESULT")
            .replace("{config}", lang("CHANCE-COUNT"))
            .replace("{string}", m.first().content)
        )
      } else if (r == 'time') {
        message.channel.send(lang("QUIZCONFIG-NOINPUT"))
      } else if (r == 'wrongValue') {
        message.channel.send(lang("QUIZCONFIG-INVALID"));
      }
    })
  }
  async function timeConfig(message) {
    const messageCollector = message.channel.createMessageCollector({ time: 30000 });
    messageCollector.on('collect', async m => {
      if (isNaN(m.content) || parseInt(m.content) <= 0 || parseInt(m.content) > 6000) {
        messageCollector.stop("wrongValue");
        return;
      } else {
        await addQuizConfig(message.author, "time", parseInt(m.content))
        messageCollector.stop("answered");
        return;
      }
    })
    messageCollector.on('end', async (m, r) => {
      if (r == 'answered') {
        await message.channel.send(
          lang("QUIZCONFIG-RESULT")
            .replace("{config}", lang("TIME-LIMIT"))
            .replace("{string}", m.first().content)
        )
      } else if (r == 'time') {
        message.channel.send(lang("QUIZCONFIG-NOINPUT"))
      } else if (r == 'wrongValue') {
        message.channel.send(lang("QUIZCONFIG-INVALID"));
      }
    })
  }

  let stdBtn = new MessageButton()
    .setCustomId('standard')
    .setLabel(lang("STANDARD"))
    .setStyle('SECONDARY')
  let wildBtn = new MessageButton()
    .setCustomId('wild')
    .setLabel(lang("WILD"))
    .setStyle('SECONDARY')
  let realWildBtn = new MessageButton()
    .setCustomId('realwild')
    .setLabel(lang("WILD-NO-STANDARD"))
    .setStyle('SECONDARY')
  if (userConfig.quizConfig.gameMode == 'standard') {
    stdBtn.setDisabled(true);
    stdBtn.setStyle('PRIMARY');
  } else if (userConfig.quizConfig.gameMode == 'wild') {
    wildBtn.setDisabled(true);
    wildBtn.setStyle('PRIMARY');
  } else if (userConfig.quizConfig.gameMode == 'realwild') {
    realWildBtn.setDisabled(true);
    realWildBtn.setStyle('PRIMARY');
  }

  const row1 = new MessageActionRow().addComponents([stdBtn, wildBtn, realWildBtn]);
  const firstMsg = await message.channel.send(`**${message.author.username}#${message.author.discriminator}is configuring quiz...**`)
  let gameModeMsg = await message.channel.send({
    content: lang("QUIZCONFIG-GAMEMODE-TITLE"), components: [row1]
  });
  const gameModeMsgCollector = gameModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  gameModeMsgCollector.on('collect', async i => {
    userConfig = await loadUserConfig(message.author);
    if (i.user.id != message.author.id) return;
    if (i.component.customId == 'standard')
      if (userConfig.quizConfig.rarity == 2) {
        await i.update({
          content: lang("QUIZCONFIG-STANDARD-BASIC-ERROR"),
          components: []
        });
        gameModeMsgCollector.stop("error")
        return;
      }
    await addQuizConfig(message.author, "gameMode", i.component.customId);

    await i.update({
      content: lang("QUIZCONFIG-RESULT")
        .replace("{config}", lang("GAME-MODE"))
        .replace("{string}", i.component.label),
      components: []
    })
    gameModeMsgCollector.stop("done")
  })
  gameModeMsgCollector.on('end', async (_, r: string) => {
    if (r === 'time') await gameModeMsg.delete().catch(console.log);
  })


  let rarityButtons = [
    new MessageButton()
      .setCustomId('5')
      .setLabel(lang('LEGENDARY'))
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('4')
      .setLabel(lang("EPIC"))
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('3')
      .setLabel(lang("RARE"))
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('1')
      .setLabel(lang("COMMON"))
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('2')
      .setLabel(lang("BASIC"))
      .setStyle('SECONDARY')
  ]
  const userRarity = userConfig.quizConfig.rarity;
  if (userRarity) {
    for (const button of rarityButtons) {
      if (parseInt(button.customId) === userRarity) {
        button.setStyle("PRIMARY");
        break;
      }
    }
  }

  const row2 = new MessageActionRow().addComponents(rarityButtons)
  let rarityMsg = await message.channel.send({
    content: lang("QUIZCONFIG-RARITY-TITLE"),
    components: [row2]
  });
  const rarityMsgCollector = rarityMsg.createMessageComponentCollector({
    componentType: 'BUTTON', time: 30000
  });
  rarityMsgCollector.on('collect', async i => {
    // 방금 위에서 바뀌었을 경우를 위해 refresh
    userConfig = await loadUserConfig(message.author);
    if (i.user.id != message.author.id) return;
    if (i.component.style != "PRIMARY") {
      if (userConfig.quizConfig.gameMode === 'standard')
        if (i.component.customId == 2) {
          await i.update({
            content: lang("QUIZCONFIG-STANDARD-BASIC-ERROR"),
            components: []
          });
          rarityMsgCollector.stop("error")
          return;
        }
      await addQuizConfig(message.author, "rarity", parseInt(i.component.customId));
      await i.update({
        content: lang("QUIZCONFIG-RESULT")
          .replace("{config}", lang("RARITY"))
          .replace("{string}", i.component.label),
        components: []
      });
      rarityMsgCollector.stop("done");
      return;
    } else {
      // It's guaranteed there is user config data, don't have to call addQuizConfig()
      await userModel.updateOne(
        { id: message.author.id },
        { $set: { "quizConfig.rarity": 0 } }
      )
      await i.update({ content: lang("QUIZCONFIG-RARITY-REMOVED"), components: [] });
      rarityMsgCollector.stop("done");
      return;
    }
  })
  rarityMsgCollector.on('end', async (_, r) => {
    if (r == 'time') await rarityMsg.delete().catch(console.log);
  })

  let difficultyButtons = [
    new MessageButton()
      .setCustomId('1')
      .setLabel('1')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('2')
      .setLabel('2')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('3')
      .setLabel('3')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('4')
      .setLabel('4')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('5')
      .setLabel('5')
      .setStyle('SECONDARY')
  ]
  let userDifficulty = userConfig.quizConfig.difficulty;
  if (userDifficulty) {
    for (const button of difficultyButtons) {
      if (parseInt(button.customId) === userDifficulty) {
        button.setStyle("PRIMARY");
        break;
      }
    }
  }
  const row3 = new MessageActionRow().addComponents(difficultyButtons);
  let difficultyMsg = await message.channel.send({
    content: lang("QUIZCONFIG-DIFFICULTY-TITLE"),
    components: [row3]
  });
  const difficultyMsgCollector = difficultyMsg.createMessageComponentCollector({
    componentType: 'BUTTON', time: 30000
  });
  difficultyMsgCollector.on('collect', async i => {
    if (i.user.id != message.author.id) return;
    await addQuizConfig(message.author, "difficulty", parseInt(i.component.customId))

    await i.update({
      content: lang("QUIZCONFIG-RESULT")
        .replace("{config}", lang("DIFFICULTY"))
        .replace("{string}", i.component.label),
      components: []
    });
    difficultyMsgCollector.stop("done");
  })
  difficultyMsgCollector.on('end', async (_, r) => {
    if (r === 'time') await difficultyMsg.delete().catch(console.log);
  })

  const chancesMenuButton = new MessageButton()
    .setCustomId('chancesMenu')
    .setStyle('PRIMARY')
    .setLabel(lang("QUIZCONFIG-CHANCE-BUTTON"))
  const row4 = new MessageActionRow().addComponents(chancesMenuButton);
  let chancesMsg = await message.channel.send({
    content: lang("QUIZCONFIG-CHANCE-TITLE")
      .replace("{value}", userConfig.quizConfig.chances.toString()),
    components: [row4]
  });
  const chancesMsgCollector = chancesMsg.createMessageComponentCollector({
    componentType: 'BUTTON', time: 30000
  });
  chancesMsgCollector.on('collect', async (i) => {
    if (i.user.id != message.author.id) return;
    await i.update({
      content: lang("QUIZCONFIG-CHANCE-MESSAGE")
        .replace("{value}", userConfig.quizConfig.chances.toString()),
      components: []
    })
    chanceConfig(message);
  })
  chancesMsgCollector.on('end', async (_, r) => {
    if (r === 'time') {
      chancesMsg.delete().catch(console.log);
      firstMsg.delete().catch(console.log);  //TODO
    }
  })

  const timeMenuButton = new MessageButton()
    .setCustomId('timeMenu')
    .setStyle('PRIMARY')
    .setLabel(lang("QUIZCONFIG-TIME-BUTTON"))
  const row5 = new MessageActionRow().addComponents(timeMenuButton);
  let timeMsg = await message.channel.send({
    content: lang("QUIZCONFIG-TIME-TITLE")
      .replace("{value}", userConfig.quizConfig.time.toString()),
    components: [row5]
  });
  const timeMsgCollector = timeMsg.createMessageComponentCollector({
    componentType: 'BUTTON', time: 30000
  });
  timeMsgCollector.on('collect', async (i) => {
    if (i.user.id != message.author.id) return;
    await i.update({
      content: lang("QUIZCONFIG-TIME-MESSAGE")
        .replace("{value}", userConfig.quizConfig.time.toString() ?? "30(default)"),
      components: []
    })
    timeConfig(message);
  })
  timeMsgCollector.on('end', async (_, r) => {
    if (r === 'time') {
      timeMsg.delete().catch(console.log);
      //firstMsg.delete().catch(console.log);   // TODO
    }
  })

  return;
}

module.exports = {
  name: [...parseLangArr(commandsKor)("QUIZCONFIG"), ...parseLangArr(commandsEng)("QUIZCONFIG")],
  description: 'quizConfig',
  execute: quizConfig
}