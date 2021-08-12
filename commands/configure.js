const mongo = require('../db');

async function configure(message, args){
  let userConfig = await mongo.userModel.findOne({name:`${message.author.username}#${message.author.discriminator}`}).exec();
  if(args == '게임모드'){
    let msg = await message.channel.send(
      '게임모드를 설정합니다(기본값 : 야생).\n**자신에게만 적용됩니다.**\n\n\정규는 1번, 야생은 2번을 선택해 주세요!\n\n이모티콘이 모두 표시되는데**(2번까지 있음)** 시간이 약간 걸립니다.\n모두 표시된 후에 선택해주셔야 작동합니다! 양해 부탁드립니다.\n'
    );
    
    message.channel.send(`현재 설정값은 "${ userConfig ? (userConfig.gamemode == 'standard' ? '정규' : '야생') : '야생' }" 입니다.`)
    await msg.react("1️⃣");
    await msg.react("2️⃣");
    let collectedReactions = await msg.awaitReactions(
      (reaction, user) => {
        return ((reaction.emoji.name === "1️⃣" ||
        reaction.emoji.name === "2️⃣")) &&
        user.id == message.author.id;
      },
      { time : 15000, max : 1 }
    )
    if (collectedReactions.size == 0){
      return;
    } else {
      let reaction = collectedReactions.keys().next().value;
      let reactionNumValue;
      let reactionNumValueKor;
      if( reaction === "1️⃣" ){ reactionNumValue = "standard"; reactionNumValueKor = "정규";}
      else if( reaction === "2️⃣" ){ reactionNumValue = "wild"; reactionNumValueKor = "야생";}

      mongo.userModel.findOneAndUpdate(
        { name : `${message.author.username}#${message.author.discriminator}` },
        { gamemode : reactionNumValue },
        { new: true, upsert: true }
      ).exec();
      message.channel.send(`☑️ ${message.author.username}#${message.author.discriminator}님의 게임모드가 "${reactionNumValueKor}"로 설정되었습니다.`)
    }
  } else if(args === '페이지') {
    let msg = await message.channel.send(
      '1페이지당 나오는 이미지 개수를 설정합니다(기본값 : 3개).\n**자신에게만 적용됩니다.**\n\n\원하는 숫자의 이모티콘을 선택해 주세요!\n\n이모티콘이 모두 표시되는데**(9번까지 있음)** 시간이 약간 걸립니다.\n모두 표시된 후에 선택해주셔야 작동합니다! 양해 부탁드립니다.\n'
    );
    message.channel.send(`현재 설정값은 "${ userConfig ? userConfig.paginateStep : 3 }" 입니다.`)
    const numberEmojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"]
    for await(const emoji of numberEmojis){
      await msg.react(emoji);
    }
    let collectedReactions = await msg.awaitReactions(
      (reaction, user) => {
        let emojiCompare = false;
        for(const emoji of numberEmojis){
          emojiCompare = emojiCompare || reaction.emoji.name === emoji
        }
        return emojiCompare && user.id == message.author.id;
      },
      { time : 15000, max : 1 }
    )
    if (collectedReactions.size == 0){
      return;
    } else {
      let reaction = collectedReactions.keys().next().value;
      let reactionNumValue;
      for( let i = 0; i < numberEmojis.length; i++ ){
        if(reaction === numberEmojis[i]) reactionNumValue = i+1;
      }
      mongo.userModel.findOneAndUpdate(
        { name : `${message.author.username}#${message.author.discriminator}` },
        { paginateStep : reactionNumValue },
        { new: true, upsert: true }
      ).exec();

      message.channel.send(`☑️ ${message.author.username}#${message.author.discriminator}님의 페이지당 이미지 수가 "${reactionNumValue}"로 설정되었습니다.`)
    }
  } else if(!args) {
    let userConfig = await mongo.userModel.findOne(
      {name:`${message.author.username}#${message.author.discriminator}`}
      ).exec();
    message.channel.send(`☑️ 현재 설정값은 **게임모드 : "${ userConfig ? (userConfig.gamemode == 'standard' ? '정규' : '야생') : '야생' }", 페이지 : ${ userConfig ? userConfig.paginateStep : 3 }** 입니다.`)
  }
}
module.exports = {
  name: "설정",
  description: "configure",
  execute: configure
}