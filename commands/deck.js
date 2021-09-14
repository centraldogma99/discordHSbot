const BlizzardToken = require("../tools/BlizzardToken");
const Paginator = require("../tools_ts/Paginator");
const safeAxiosGet = require("../tools/helpers/safeAxiosGet");
const CONSTANTS = require("../constants");
const loadUserConfig = require("../tools/loadUserConfig");
const { MessageEmbed } = require("discord.js");
const RequestScheduler = require("../tools/helpers/RequestScheduler");
const uniqueArray = require("../tools/helpers/uniqueArray");

async function deck(message, args){
  if(!args) {
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let code = args.split('\n').filter(line => line != '').filter(line => !line.startsWith('#'))[0];
  const userConfig = await loadUserConfig(message.author.id);
  const searchingMessage = await message.channel.send("🔍 검색 중입니다...")
  
  const blizzardToken = await BlizzardToken.getToken();
  let deckInfoPromise = () => safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/deck`,
    { params : {
      locale: userConfig.languageMode,
      code: code,
      access_token: blizzardToken
    }})
    .then(res => res.data)
    .catch(e => {
      throw e;
    })
  let deckInfo;
  try{
    deckInfo = await RequestScheduler.getRes(RequestScheduler.addReq(deckInfoPromise));
    if(deckInfo instanceof Error) throw deckInfo;
  } catch (e) {
    console.log(e.response.status);
    if(e.response.status === 400)
      message.channel.send("‼️ 잘못된 덱 코드입니다.");
    else
      message.channel.send("‼️ 오류가 발생했습니다. 다시 시도해 주세요! 문제가 지속되면 개발자에게 문의해 주세요!");
    return;
  }
  let cards = deckInfo.cards.sort((a, b) => a.manaCost - b.manaCost);
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
  // remove redundant cards
  cards = uniqueArray(cards, 'name');
  const pagi = new Paginator(message, cards.map(card => card.image), userConfig.paginateStep)
  let msgs = await pagi.next();
  searchingMessage.delete().catch(console.log);

  while(msgs){
    const [m, reaction] = await msgs.infoPromise;
    await m;
    if( reaction === "next" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete().catch(console.log);
      msgs = await pagi.next();
    } else if( reaction === "prev" ){
      await message.channel.sendTyping();
      await msgs.infoMessage.delete().catch(console.log);
      msgs = await pagi.prev();
    } else if( reaction === "timeout" ){
      msgs.infoMessage.delete().catch(console.log);
      break;
    }
  }
}

module.exports = {
  name: ["덱", "덱리스트", "덱리"],
  description: "decklist",
  execute: deck
};