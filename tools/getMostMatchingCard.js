const axios = require("axios")
const stringSimilarity = require("string-similarity")
const uniqueArray = require('./uniqueArray')
const range = require('../tools/range');
const CONSTANTS = require('../constants')
const mongo = require('../db');

async function getMostMatchingCard(message, args, gameMode){

  let db;
  if ( gameMode == 'standard' ) db = mongo.cardAliasStandardModel;
  else if ( gameMode == 'wild' ) db = mongo.cardAliasModel;
  else return;
  
  let chosenCards = await db.find({"name": {$regex : args}});
  let chosenCardNames;
  if ( chosenCards.length > 0 ){
    chosenCardNames = chosenCards.map(card => card.name);
  } else {
    chosenCards = await db.find({"alias": {$regex : args}});
    if(chosenCards.length > 0){
      chosenCardNames = chosenCards.map(card => card.name);
    } else {
      message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
      return;
    }
  }
  let ratings = stringSimilarity.findBestMatch(args, chosenCardNames);
  let resCard = chosenCards[ratings.bestMatchIndex];

  return resCard;
}

module.exports = getMostMatchingCard;