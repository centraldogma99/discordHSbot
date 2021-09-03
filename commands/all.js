/*
  로컬 DB화 미루기 - 서치 성능 이슈(확인 안됨)
*/

const Paginator = require("../tools/Paginator");
const loadUserConfig = require("../tools/loadUserConfig")
const uniqueArray = require('../tools/uniqueArray')
const range = require('../tools/range')
const CONSTANTS = require('../constants')
const BlizzardToken = require("../tools/BlizzardToken");
const safeAxiosGet = require("../tools/safeAxiosGet");
const requestWithDelay = require("../tools/requestWithDelay");

async function all(message, args, info){
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }

  const blizzardToken = await BlizzardToken.getToken();
  const userConfig = await loadUserConfig(message.author.id);

  function axiosShort(page){
    return safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: userConfig.languageMode,
      textFilter: encodeURI(args),
      gameMode: userConfig.gameMode == 'battlegrounds' ? 'battlegrounds' : 'constructed',
      tier: info?.tier ?? null,
      class: info?.class_?.name,
      set: userConfig.gameMode == 'battlegrounds' ? null : userConfig.gameMode,
      pageSize: CONSTANTS.pageSize,
      page: page,
      access_token: blizzardToken
    }})
  }
  
  const searchingMessage = await message.channel.send("🔍 검색 중입니다...")
  await message.channel.sendTyping();

  let cardCount;
  let temp;
  try{
    temp = await axiosShort(1)
    .catch((e) =>{
      console.log(e);
      throw e;
    });
  } catch(e) {
    message.channel.send("‼️ 카드 정보를 가져오던 중 오류가 발생했습니다. 다시 시도해 주세요!");
    return;
  }

  cardCount = temp.data.cardCount;
  if ( cardCount == 0 ){
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }
  // if ( cardCount > CONSTANTS.cardCountLimit ){
  //   message.channel.send("‼️ 검색 결과가 너무 많습니다! 좀더 구체적인 검색어를 입력해 주세요.");
  //   return;
  // }
  let promises;
  if( Math.ceil(cardCount / CONSTANTS.pageSize) > 1 ){
    promises = range( Math.ceil(cardCount / CONSTANTS.pageSize), 2).map(i => 
      axiosShort(i)
      .then(res => res.data.cards)
      .catch(e => {throw e})
    )
    promises = [Promise.resolve(temp.data.cards), ...promises]
  } else {
    promises = [Promise.resolve(temp.data.cards)]
  }
  
  const pagi = new Paginator(message, requestWithDelay(promises, {delayBetweenChunks: 3000, chunkUnit: 1}), userConfig.paginateStep, cardCount,
    cardsArray => uniqueArray(cardsArray.reduce((f,s) => f.concat(s)), "name"),
    {lengthEnabled: true, goldenCardMode: userConfig.goldenCardMode});
  let msgs = await pagi.next();
  searchingMessage.delete();

  while(msgs){
    [m, reaction] = await msgs.infoPromise;
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

  return;
}

module.exports = {
  name : ['모든'],
  description : 'all',
  execute : all
}