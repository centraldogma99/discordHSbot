/*
  카드이름의 일부분 또는 전부를 받아 해당하는 카드들의 이름/정보 반환
*/
const mongo = require('../db')

async function cardNameInfer(cardName, gameMode='wild', callback){
  let db;
  if ( gameMode == 'standard' ) db = mongo.cardAliasStandardModel;
  else if ( gameMode == 'wild' ) db = mongo.cardAliasModel;
  else if ( gameMode == 'battlegrounds' ) db = mongo.battlegroundsCardModel;
  else return;

  let temp = cardName.replace(/\s/g, '');

  let res = await db.find({ alias: { $regex : temp } });
  if ( res.length > 0 ) {
    if ( callback ){
      return callback(res);
    } else {
      return res;
    }
  }
  else {
    return;
  }
}

module.exports = cardNameInfer;