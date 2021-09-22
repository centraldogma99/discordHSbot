import { Paginator } from "../tools/Paginator";
import { getMostMatchingCard } from "../tools/getMostMatchingCard";
import { loadUserConfig } from "../tools/loadUserConfig";
import { safeAxiosGet } from "../tools/helpers/safeAxiosGet";
import { BlizzardToken } from "../tools/BlizzardToken";
import CONSTANTS from "../constants";
import { Message } from "discord.js";
import { searchInfo } from "../types/searchInfo";
import { Card } from "../types/card";

async function childs(message: Message, args: string, info: searchInfo){
  if(!args){
    await message.channel.send("❌ 검색어를 입력해 주세요.")
    return;
  }
  let resCard: Card, searchingMessage: Message;
  const userConfig = await loadUserConfig(message.author.id);
  if ( !info?.fromDefault ){
    // fromDefault가 false일 경우, 카드 찾기
    searchingMessage = await message.channel.send("🔍 검색 중입니다...");
    await message.channel.sendTyping();

    resCard = await getMostMatchingCard(args, userConfig.gameMode, info?.class_);
    if (!resCard) {
      message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
      return;
    }
    await message.channel.send({files: [resCard.image]})
  } else {
    // fromDefault true일 경우, defaultAction에서 card를 보내줌.
    resCard = info?.card;
  }
  
  await message.channel.sendTyping();
  let promises = [];
  let blizzardToken = await BlizzardToken.getToken();

  if( resCard.childIds.length > 0 ){
    promises = resCard.childIds.map(id => () => safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards/${ id }`,
      { params : {
        locale: userConfig.languageMode,
        access_token: blizzardToken
      }}
    )
    .then(res => res.data.image)
    .catch(e => {throw e}));
    const pagi = new Paginator(message, { value: promises, isPromise: true }, userConfig.paginateStep, 1)
    let msgs = await pagi.next();
    searchingMessage?.delete().catch(console.log);

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
};