const { MessageActionRow, MessageButton } = require('discord.js');
const mongo = require('../db');
const loadUserConfig = require('../tools/loadUserConfig');

async function configure(message, args){
  let userConfig = await mongo.userModel.findOne({ id: message.author.id }).exec();
  if(args == '게임모드'){
    let gameModeButtons = [
      new MessageButton()
        .setCustomId('standard')
        .setLabel('정규')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('wild')
        .setLabel('야생')
        .setStyle('SECONDARY'),
    ];
    let userGameMode = userConfig ? (userConfig.gameMode ? userConfig.gameMode : "wild") : "wild";
    for (const button of gameModeButtons){
      if (button.customId == userGameMode){
        button.setStyle("PRIMARY");
        button.setDisabled(true);
        break;
      }
    }

    const row = new MessageActionRow()
      .addComponents(gameModeButtons)
    let gameModeMsg = await message.channel.send({
      content: '⚙️ 게임모드 설정 (`정규`로 설정시 야생 카드는 검색되지 않습니다.)',
      components: [row]
    });
    let gameModeMsgCollector = gameModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
    gameModeMsgCollector.on('collect', i => {
      if ( i.user.id != message.author.id ) return;
      if ( userConfig ){
        userConfig.updateOne(
          { gameMode : i.component.customId }
        ).exec();
      } else {
        mongo.userModel.insertMany([{
          id: message.author.id,
          gameMode : i.component.customId
        }])
      }
      i.update({ content: `☑️ ${message.author.username}#${message.author.discriminator}님의 게임모드가 "${i.component.label}"로 설정되었습니다.`, components: [] })
    })
  } else if(args === '페이지') {
    let msg = await message.channel.send(
      '1페이지당 나오는 이미지 개수를 설정합니다(기본값 : 3개).\n**자신에게만 적용됩니다.**\n\n\원하는 숫자의 이모티콘을 선택해 주세요!\n\n이모티콘이 모두 표시되는데**(9번까지 있음)** 시간이 약간 걸립니다.\n모두 표시된 후에 선택해주셔야 작동합니다! 양해 부탁드립니다.\n'
    );
    message.channel.send(`현재 설정값은 "${ userConfig ? (userConfig.paginateStep ? userConfig.paginateStep : 3) : 3 }" 입니다.`)
    const numberEmojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"]
    for await(const emoji of numberEmojis){
      await msg.react(emoji);
    }
    let collectedReactions = await msg.awaitReactions(
      {
        filter: (reaction, user) => {
          let emojiCompare = false;
          for(const emoji of numberEmojis){
            emojiCompare = emojiCompare || reaction.emoji.name === emoji
          }
          return emojiCompare && user.id == message.author.id;
        },
        time : 15000,
        max : 1
      }
    )
    if (collectedReactions.size == 0){
      return;
    } else {
      let reaction = collectedReactions.keys().next().value;
      let reactionNumValue;
      for( let i = 0; i < numberEmojis.length; i++ ){
        if(reaction === numberEmojis[i]) reactionNumValue = i+1;
      }
      if ( userConfig ){
        userConfig.updateOne(
          { paginateStep : reactionNumValue }
        ).exec();
      } else {
        mongo.userModel.insertMany([{
          id: message.author.id,
          paginateStep : reactionNumValue
        }])
      }

      message.channel.send(`☑️ ${message.author.username}#${message.author.discriminator}님의 페이지당 이미지 수가 "${reactionNumValue}"로 설정되었습니다.`)
    }
  } else if(args === '황금' || args === '황금카드'){
    let goldenCardModeButtons = [
      new MessageButton()
        .setCustomId('false')
        .setLabel('일반')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('true')
        .setLabel('황금')
        .setStyle('SECONDARY'),
    ];
    let userGoldenCardMode = userConfig ? (userConfig.goldenCardMode ? userConfig.goldenCardMode : false) : false;
    for (const button of goldenCardModeButtons){
      if (button.customId == userGoldenCardMode.toString()){
        button.setStyle("PRIMARY");
        button.setDisabled(true);
        break;
      }
    }

    const row = new MessageActionRow()
      .addComponents(goldenCardModeButtons);
    let goldenCardModeMsg = await message.channel.send({
      content: '⚙️ 황금카드 설정(황금카드 이미지가 없으면 일반 카드로 검색됩니다.)',
      components: [row]
    });
    let goldenCardModeMsgCollector = goldenCardModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
    goldenCardModeMsgCollector.on('collect', i => {
      if ( i.user.id != message.author.id ) return;
      if ( userConfig ){
        userConfig.updateOne(
          { goldenCardMode : i.component.customId }
        ).exec();
      } else {
        mongo.userModel.insertMany([{
          id: message.author.id,
          goldenCardMode : i.component.customId
        }])
      }
      i.update({ content: `☑️ ${message.author.username}#${message.author.discriminator}님의 황금카드모드가 "${i.component.label}"로 설정되었습니다.`, components: [] })
    })
  } 
  // else if(args === '언어'){
  //   let msg = await message.channel.send(
  //     '카드의 언어를 설정합니다(기본값 : 한국어).\n**자신에게만 적용됩니다.**\n\n\한국어는 1번, 영어는 2번을 선택해 주세요!\n\n이모티콘이 모두 표시되는데**(2번까지 있음)** 시간이 약간 걸립니다.\n모두 표시된 후에 선택해주셔야 작동합니다! 양해 부탁드립니다.\n'
  //   );
    
  //   message.channel.send(`현재 설정값은 "${ userConfig ? (userConfig.languageMode == 'ko_KR' ? '한국어' : '영어') : '한국어' }" 입니다.`)
  //   await msg.react("1️⃣");
  //   await msg.react("2️⃣");
  //   let collectedReactions = await msg.awaitReactions(
  //     {filter: (reaction, user) => {
    //       return ((reaction.emoji.name === "1️⃣" ||
    //       reaction.emoji.name === "2️⃣")) &&
    //       user.id == message.author.id;
    //     },
    //     time : 15000, max : 1
      // }
  //   )
  //   if (collectedReactions.size == 0){
  //     return;
  //   } else {
  //     let reaction = collectedReactions.keys().next().value;
  //     let reactionNumValue;
  //     let reactionNumValueKor;
  //     if( reaction === "1️⃣" ){ reactionNumValue = "ko_KR"; reactionNumValueKor = "한국어";}
  //     else if( reaction === "2️⃣" ){ reactionNumValue = "en_US"; reactionNumValueKor = "영어";}

  //     mongo.userModel.findOneAndUpdate(
  //       { name : `${message.author.username}#${message.author.discriminator}` },
  //       { languageMode : reactionNumValue },
  //       { new: true, upsert: true }
  //     ).exec();
  //     message.channel.send(`☑️ ${message.author.username}#${message.author.discriminator}님의 언어가 "${reactionNumValueKor}"로 설정되었습니다.`)
  //   }
  // }
  else if(!args) {
    let userConfig = await loadUserConfig(message.author);
    message.channel.send(`☑️ 현재 설정값\n\n\
**게임모드** : \`${ userConfig.gameMode == 'standard' ? '정규' : '야생' }\`\n\
**페이지** : \`${ userConfig.paginateStep }\`\n\
**황금카드** : \`${ userConfig.goldenCardMode ? 'Yes' : 'No' }\``)
  } else {
    message.channel.send("‼️ 없는 명령어입니다.")
  }
}
module.exports = {
  name: "설정",
  description: "configure",
  execute: configure
}