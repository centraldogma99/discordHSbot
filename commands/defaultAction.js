const childs = require("./childs")
const getMostMatchingCard = require("../tools/getMostMatchingCard");
const loadUserConfig = require("../tools/loadUserConfig");
const { MessageActionRow, MessageButton } = require('discord.js');

async function defaultAction(message, args, info){
  let searchingMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();
  let userConfig = await loadUserConfig(message.author);

  const resCard = await getMostMatchingCard( args, userConfig.gameMode, info?.class_ );
  if (!resCard) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }

  const targetImage = userConfig.goldenCardMode ?
    (resCard.imageGold ? resCard.imageGold : resCard.image) : resCard.image;
  
  msgObj = {files: [targetImage]}
  searchingMessage.delete();

  if( resCard.childIds.length > 0 ){
    const btn = new MessageButton()
      .setCustomId('primary')
      .setLabel('관련 카드 보기')
      .setStyle('PRIMARY');
    const row = new MessageActionRow()
			.addComponents(btn)
    msgObj.components = [row];
    const msg = await message.channel.send(msgObj);
    const buttonCollector = msg.createMessageComponentCollector({ componentType: 'BUTTON', time: 20000, max: 1 });
    buttonCollector.on('collect', async i => {
      await i.update({ content: "☑️  관련 카드를 가져옵니다...", components: [] })
      await childs.execute(message, args, { fromDefault: true, card: resCard });
    })
    buttonCollector.on('end', async (i, r) => {
      if(r == 'time') await msg.delete();
    })
  } else {
    await message.channel.send(msgObj);
  }
  
}

module.exports = {
  name : ['defaultAction'],
  description : 'defaultAction',
  execute : defaultAction
}