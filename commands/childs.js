/*
  TODO : preProcess 함수 구현 및 paginator 생성자 인자로 넘기기
*/

const axios = require("axios")
const paginator = require("../tools/paginator");
const mongo = require("../db");
const getMostMatchingCard = require("../tools/getMostMatchingCard");

function preProcess(cards){
  return cards;
}

async function childs(message, args, blizzardToken){
  if ( !args ){ await message.channel.send("찾을 카드명을 입력해 주세요."); return; }
  let infoMessage = await message.channel.send("🔍 검색 중입니다...")

  const userConfig = await mongo.userModel.findOne({name:`${message.author.username}#${message.author.discriminator}`}).exec();
  const gamemode = userConfig ? userConfig.gamemode : "wild";
  const paginateStep = userConfig ? userConfig.paginateStep : 3;

  const resCard = await getMostMatchingCard(message, args, gamemode, blizzardToken);
  if (!resCard) return;

  let promises = [];

  if(resCard.childIds != null){
    for (const id of resCard.childIds){
      const promise = axios.get(`https://us.api.blizzard.com/hearthstone/cards/${ id }`,
      { params : {
        locale: "ko_KR",
        access_token: blizzardToken
      }})
      .then(res => res.data);
      promises = promises.concat(promise);
    }

    pagi = new paginator(message, [Promise.all(promises)], paginateStep, resCard.childIds.length, preProcess, true);
    let msgs = await pagi.next();
    infoMessage.delete()

    while(msgs && msgs["reaction"]){
      msgs["targetMessages"].map(msg => msg.delete());
      msgs["infoMessage"].delete();
      if( msgs["reaction"] === "➡️" ){
        msgs = await pagi.next();
      } else if( msgs["reaction"] === "⬅️" ){
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
  name : '관련',
  description : 'childs',
  execute : childs
}