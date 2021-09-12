const { MessageActionRow, MessageButton } = require('discord.js');
const mongo = require("../db");
const loadUserConfig = require('../tools/loadUserConfig');

async function addQuizConfig(messageAuthorId, fieldName, value){
  // @value should be typechecked before given as parameter
  let query = mongo.userModel.findOne({ id : messageAuthorId });
  try {
    const user = await query.exec();
    if (!user.quizConfig.gameMode && !user.quizConfig.rarity && !user.quizConfig.difficulty && !user.quizConfig.chances) {
      return query.updateOne({ quizConfig: { [fieldName]: value } }).exec();
    } else {
      return query.updateOne({ $set: { [`quizConfig.${fieldName}`]: value } }).exec();
    }
  } catch (e) {
    return await mongo.userModel.insertMany([{
      id: messageAuthorId,
      quizConfig: { [fieldName]: value }
    }]);
  }
}

async function quizConfig(message){
  async function chanceConfig(message){
    const messageCollector = message.channel.createMessageCollector({ time: 30000 });
    messageCollector.on('collect', async m => {
      if(isNaN(m.content) || parseInt(m.content) < 3 || parseInt(m.content) > 9) {
        messageCollector.stop("wrongValue");
        return;
      } else {
        await addQuizConfig(message.author.id, "chances", parseInt(m.content))
        messageCollector.stop("answered");
        return;
      }
    })
    messageCollector.on('end', async (m, r) => {
      if(r == 'answered') {
        await message.channel.send(`☑️ \`기회 횟수\`가 \`${m.first().content}\` (으)로 설정되었습니다.`)
      } else if(r == 'time'){
        message.channel.send(`？ 입력 시간이 초과되었습니다.`)
      } else if(r == 'wrongValue'){
        message.channel.send("‼️ 잘못된 값이 입력되었습니다.");
      }
    })
  }

  let userConfig = await loadUserConfig(message.author.id);
  let stdBtn = new MessageButton()
    .setCustomId('standard')
    .setLabel('정규')
    .setStyle('SECONDARY')
  let wildBtn = new MessageButton()
    .setCustomId('wild')
    .setLabel('야생')
    .setStyle('SECONDARY')
  if (userConfig.quizConfig.gameMode == 'standard'){
    stdBtn.setDisabled(true);
    stdBtn.setStyle('PRIMARY');
  } else if (userConfig.quizConfig.gameMode == 'wild'){
    wildBtn.setDisabled(true);
    wildBtn.setStyle('PRIMARY');
  }

  const row1 = new MessageActionRow().addComponents([stdBtn, wildBtn]);
  const firstMsg = await message.channel.send(`**${message.author.username}#${message.author.discriminator}가 퀴즈 설정 중...**`)
  let gameModeMsg = await message.channel.send({ content: `**⚙️ 퀴즈 게임 모드**`, components: [row1] });
  const gameModeMsgCollector = gameModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  gameModeMsgCollector.on('collect', async i => {
    userConfig = await loadUserConfig(message.author.id);
    if (i.user.id != message.author.id) return;
    if(i.component.customId == 'standard')
      if (userConfig.quizConfig.rarity == 2) {
        await i.update({ content: "❌  `정규` 게임모드와 `기본` 등급을 함께 선택할 수 없습니다(정규에는 기본카드가 없음).", components: [] });
        gameModeMsgCollector.stop("error")
        return;
      }
    await addQuizConfig(message.author.id, "gameMode", i.component.customId);
    
    let val = i.component.label;
    await i.update({ content : `☑️ 퀴즈 게임 모드가 \`${val}\`(으)로 설정되었습니다.`, components: [] })
    gameModeMsgCollector.stop("done")
  })
  gameModeMsgCollector.on('end', async (i, r) => {
    if(r == 'time') await gameModeMsg.delete().catch(console.log);
  })


  let rarityButtons = [
    new MessageButton()
      .setCustomId('5')
      .setLabel('전설')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('4')
      .setLabel('특급')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('3')
      .setLabel('희귀')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('1')
      .setLabel('일반')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('2')
      .setLabel('기본')
      .setStyle('SECONDARY')
  ]
  let userRarity = userConfig.quizConfig.rarity;
  if (userRarity){
    for (const button of rarityButtons){
      if (button.customId == userRarity){
        button.setStyle("PRIMARY");
        break;
      }
    }
  }

  const row2 = new MessageActionRow().addComponents(rarityButtons)
  let rarityMsg = await message.channel.send({ content: "**⚙️ 퀴즈 카드 등급**   *파란 버튼을 누르면 카드등급 필터링을 해제할 수 있습니다.*", components: [row2] });
  const rarityMsgCollector = rarityMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  rarityMsgCollector.on('collect', async i => {
    // 방금 위에서 바뀌었을 경우를 위해 refresh
    userConfig = await loadUserConfig(message.author);
    if (i.user.id != message.author.id) return;
    if ( i.component.style != "PRIMARY" ) {
      if(userConfig.quizConfig.gameMode == 'standard')
        if (i.component.customId == 2) {
          await i.update({ content: "❌  `정규` 게임모드에서는 `기본` 등급을 선택할 수 없습니다(정규에는 기본카드가 없음).", components: [] });
          rarityMsgCollector.stop("error")
          return;
        }
      await addQuizConfig(message.author.id, "rarity", parseInt(i.component.customId));
      await i.update({ content: `☑️ 퀴즈 카드등급 필터링이 \`${i.component.label}\`(으)로 설정되었습니다.`, components: [] });
      rarityMsgCollector.stop("done");
      return;
    } else {
      // It's guaranteed there is user config data, don't have to call addQuizConfig()
      await mongo.userModel.updateOne({ id : message.author.id }, { $set: {"quizConfig.rarity": 0} }).exec()
      await i.update({ content: `☑️ 퀴즈 카드등급 필터링을 해제했습니다.`, components: [] });
      rarityMsgCollector.stop("done");
      return;
    }
  })
  rarityMsgCollector.on('end', async (_, r) => {
    if(r == 'time') await rarityMsg.delete().catch(console.log);
  })

  let difficultyButtons = [
    new MessageButton()
      .setCustomId('1')
      .setLabel('1단계')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('2')
      .setLabel('2단계')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('3')
      .setLabel('3단계')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('4')
      .setLabel('4단계')
      .setStyle('SECONDARY'),
    new MessageButton()
      .setCustomId('5')
      .setLabel('5단계')
      .setStyle('SECONDARY')
  ]
  let userDifficulty = userConfig.quizConfig.difficulty;
  if (userDifficulty){
    for (const button of difficultyButtons){
      if (button.customId == userDifficulty){
        button.setStyle("PRIMARY");
        break;
      }
    }
  }
  const row3 = new MessageActionRow().addComponents(difficultyButtons);
  let difficultyMsg = await message.channel.send({ content: "**⚙️ 퀴즈 난이도**   *숫자가 클수록 난이도가 높습니다.*", components: [row3] });
  const difficultyMsgCollector = difficultyMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  difficultyMsgCollector.on('collect', async i => {
    if (i.user.id != message.author.id) return;
    await addQuizConfig(message.author.id, "difficulty", parseInt(i.component.customId))
    
    await i.update({ content: `☑️ \`난이도\`가 \`${i.component.label}\`(으)로 설정되었습니다.`, components: [] });
    difficultyMsgCollector.stop("done");
  })
  difficultyMsgCollector.on('end', async (_, r) => {
    if(r === 'time') await difficultyMsg.delete().catch(console.log);
  })

  const chancesMenuButton = new MessageButton()
    .setCustomId('chancesMenu')
    .setStyle('PRIMARY')
    .setLabel('퀴즈 기회 횟수 설정')
  const row4 = new MessageActionRow().addComponents(chancesMenuButton);
  let chancesMsg = await message.channel.send({ content: `**⚙️ 퀴즈 기회 횟수 설정**  현재 설정 : \`${userConfig.quizConfig.chances}\``, components: [row4] });
  const chancesMsgCollector = chancesMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  chancesMsgCollector.on('collect', async (i) => {
    if (i.user.id != message.author.id) return;
    await i.update({content: `⚙️ 설정할 \`기회 횟수\`를 채팅으로 입력해 주세요(3 ~ 9). 현재 설정 : \`${userConfig.quizConfig.chances}\``, components: []})
    
    chanceConfig(message);
  })
  chancesMsgCollector.on('end', async (_, r) => {
    if(r === 'time') {
      chancesMsg.delete().catch(console.log);
      firstMsg.delete().catch(console.log);
    }
  })

  return;
}

module.exports = {
  name : ['퀴즈설정'],
  description : 'quizConfig',
  execute : quizConfig
}