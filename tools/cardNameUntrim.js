/*
  띄어쓰기 안된 카드이름을 받아 카드 이름/카드 정보 반환.
*/
const mongo = require('../db')

async function cardNameUntrim(cardName, gameMode='wild'){
  let db;
  if ( gameMode == 'standard' ) db = mongo.cardAliasStandardModel;
  else if ( gameMode == 'wild' ) db = mongo.cardAliasModel;
  else return;

  let res = await db.findOne({ alias: { $eq : cardName } })
  if ( res ) return {name: res.name, image: res.image, imageGold: res.imageGold, childIds: res.childIds};
  else {
    res = await db.findOne({ name: { $eq : cardName } });
    if (res) return {name: res.name, image: res.image, imageGold: res.imageGold, childIds: res.childIds}
    else return {name : cardName, msg : "noCardData"};
  } 

  // TODO 성능 체크 **5ms**
}

module.exports = cardNameUntrim;