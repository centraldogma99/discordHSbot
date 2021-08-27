const axios = require("axios")
const Paginator = require("../tools/Paginator");
const getMostMatchingCard = require("../tools/getMostMatchingCard");
const loadUserConfig = require("../tools/loadUserConfig")
const CONSTANTS = require('../constants')
const BlizzardToken = require('../tools/BlizzardToken')

function preProcess(cards){
  return cards;
}

async function childs(message, args, info){
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let fromDefault = info ? info.fromDefault : undefined;
  let blizzardToken = await BlizzardToken.getToken();
  const searchingMessage = await message.channel.send("🔍 검색 중입니다...");
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);

  const resCard = await getMostMatchingCard(args, userConfig.gameMode);
  if (!resCard) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }
  // @여관주인 [카드명] 했을때 원본카드 이미지 출력 안하기
  if( !fromDefault ){ await message.channel.send({files: [resCard.image]}) }
  await message.channel.sendTyping();
  let promises = [];

  if( resCard.childIds.length > 0 ){
    promises = resCard.childIds.map( id => 
      axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards/${ id }`,
      { params : {
        locale: userConfig.languageMode,
        access_token: blizzardToken
      }})
      .then(res => res.data)
      .catch((e) =>{
        console.log(e);
        return message.channel.send("‼️ 카드 정보를 가져오던 중 오류가 발생했습니다. 다시 시도해 주세요!")
      })
    )

    let pagi = new Paginator(message, [Promise.all(promises)], userConfig.paginateStep, resCard.childIds.length, preProcess, false, userConfig.goldenCardMode);
    let msgs = await pagi.next();
    await msgs.infoMessage;
    searchingMessage.delete()

    while(msgs){
      if( await msgs.reaction === "next" ){
        await message.channel.sendTyping();
        msgs = await pagi.next();
      } else if( await msgs.reaction === "prev" ){
        await message.channel.sendTyping();
        msgs = await pagi.prev();
      }
    }
    return;
  } else {
    message.channel.send("‼️ 해당 카드의 관련 카드가 없습니다!");
    return;
  }
}

module.exports = {
  name : ['관련', '토큰'],
  description : 'childs',
  execute : childs
}