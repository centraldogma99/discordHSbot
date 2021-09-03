const BlizzardToken = require("../tools/BlizzardToken");
const Paginator = require("../tools/Paginator");
const safeAxiosGet = require("../tools/safeAxiosGet");
const CONSTANTS = require("../constants");
const loadUserConfig = require("../tools/loadUserConfig");
const requestWithDelay = require("../tools/requestWithDelay");
const { MessageEmbed } = require("discord.js");

async function deck(message, args){
  if(!args) {
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let code = args.split('\n').filter(line => line != '').filter(line => !line.startsWith('#'))[0];
  const userConfig = await loadUserConfig(message.author.id);
  const searchingMessage = await message.channel.send("🔍 검색 중입니다...")
  
  const blizzardToken = await BlizzardToken.getToken();
  let deckInfo;
  try {
    deckInfo = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/deck`,
    { params : {
      locale: userConfig.languageMode,
      code: code,
      access_token: blizzardToken
    }})
    .then(res => res.data)
    .catch(e => {
      throw e;
    })
  } catch (e) {
    console.log(e.response.status);
    if(e.response.status === 400)
      message.channel.send("‼️ 잘못된 덱 코드입니다.");
    else
      message.channel.send("‼️ 서버 오류가 발생했습니다. 개발자에게 문의해 주세요!");
    return;
  }
  const cards = deckInfo.cards.sort((a, b) => a.manaCost - b.manaCost);
  const promises = requestWithDelay(cards.map(card => Promise.resolve(card)));
  let names = cards.map(card => card.name)
  let costsAndRarities = Object.fromEntries(cards.map(card => [card.name, {cost: card.manaCost, isLegendary: card.rarityId == 5? '⭐' : ''}]))
  let obj = {};
  for(const name of names){
    if(!obj[name]) obj[name] = 1;
    else obj[name] += 1;
  }
  const str = Object.keys(obj).map(
    k => `${obj[k]} x (${costsAndRarities[k].cost}) ${k} ${costsAndRarities[k].isLegendary}`
    ).join('\n')
  // await message.channel.send(`**${deckInfo.class.name} 덱**`);
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`**${deckInfo.class.name} 덱**`)
    .setDescription(str)
    .setThumbnail(deckInfo.hero.image)
  await message.channel.send({embeds: [embed]});

  await message.channel.sendTyping();
  const pagi = new Paginator(message, promises, userConfig.paginateStep, deckInfo.cards.length, c => c,
    {lengthEnabled: false, goldenCardMode: userConfig.goldenCardMode})
  let msgs = await pagi.next();
  searchingMessage.delete();

  while(msgs){
    const [m, reaction] = await msgs.infoPromise;
    await m;
    if( reaction === "next" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete();
      msgs = await pagi.next();
    } else if( reaction === "prev" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete();
      msgs = await pagi.prev();
    } else if( reaction === "timeout" ){
      msgs.infoMessage.delete();
      break;
    }
  }
}

module.exports = {
  name: ["덱", "덱리스트", "덱리"],
  description: "decklist",
  execute: deck
};