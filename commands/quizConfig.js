const { MessageActionRow, MessageButton } = require('discord.js');
const mongo = require("../db");
const loadUserConfig = require('../tools/loadUserConfig');
const rarity = require('../tools/rarity.json')

async function quizConfig(message){
  const userConfig = await loadUserConfig(message.author);
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

  const row1 = new MessageActionRow()
    .addComponents([stdBtn, wildBtn]);
  
  let gameModeMsg = await message.channel.send({ content: "**⚙️ 퀴즈 게임 모드**", components: [row1] });
  const gameModeMsgCollector = gameModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  gameModeMsgCollector.on('collect', async i => {
    if (i.user.id != message.author.id) return;
    let query = mongo.userModel.findOne({ id : message.author.id })
    let user = await query.exec()
    if( user ){
      if(!user.quizConfig.gameMode && !user.quizConfig.rarity){
        query.updateOne({$set: {"quizConfig": {"gameMode": i.component.customId}}}).exec()
      } else {
        query.updateOne({$set: {"quizConfig.gameMode": i.component.customId}}).exec()
      }
    } else {
      mongo.userModel.insertMany([{
        id: message.author.id,
        quizConfig: {"gameMode":i.component.customId}
      }])
    }
    
    let val = i.component.label;
    // if(val == '정규'){
    //   stdBtn.setStyle('PRIMARY').setDisabled(true);
    //   wildBtn.setStyle('SECONDARY').setDisabled(false);
    // } else {
    //   stdBtn.setStyle('SECONDARY').setDisabled(false);
    //   wildBtn.setStyle('PRIMARY').setDisabled(true);
    // }
    // await i.update({ components: [new MessageActionRow().addComponents([stdBtn, wildBtn])]})
    await i.update({ content : `☑️ 퀴즈 게임 모드가 \`${val}\`(으)로 설정되었습니다.`, components: [] })
  })

  const row2 = new MessageActionRow()
    .addComponents(rarityButtons)
  let rarityMsg = await message.channel.send({ content: "**⚙️ 퀴즈 카드 등급**", components: [row2] });
  const rarityMsgCollector = rarityMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  rarityMsgCollector.on('collect', async (i) => {
    if (i.user.id != message.author.id) return;
    let val;
    let query = mongo.userModel.findOne({ id : message.author.id })
    let user = await query.exec()
    if ( i.component.style != "PRIMARY" ) {
      if((await loadUserConfig(message.author)).quizConfig.gameMode == 'standard')
        if (i.component.customId == 2) {
          i.update({ content: "❌  정규 게임모드에서는 `기본` 등급을 선택할 수 없습니다(정규에는 기본카드가 없음).", components: [] });
          return;
        }
          
      val = i.component.customId;
      if( user ){
        if(!user.quizConfig.gameMode && !user.quizConfig.rarity){
          query.updateOne({quizConfig: {rarity: val}}).exec()
        } else {
          query.updateOne({$set: {"quizConfig.rarity": val}}).exec()
        }
      } else {
        mongo.userModel.insertMany([{
          id: message.author.id,
          quizConfig: {rarity: val}
        }])
      }
    } else {
      val = 0;
      query.updateOne({ $set: {"quizConfig.rarity": 0} }).exec()
    }
    if( val ) {
      i.update({ content: `☑️ 퀴즈 카드등급 필터링이 \`${i.component.label}\`(으)로 설정되었습니다.`, components: [] });
    } else {
      i.update({ content: `☑️ 퀴즈 카드등급 필터링을 해제했습니다.`, components: [] });
    }
  })

  return;
}

module.exports = {
  name : '퀴즈설정',
  description : 'quizConfig',
  execute : quizConfig
}