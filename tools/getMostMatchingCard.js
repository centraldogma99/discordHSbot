/*
  chlid, defaultAction에서 사용됨
  TODO cardNameInfer과 통합 가능성 있음
*/
const stringSimilarity = require("string-similarity")
const cardNameInfer = require("./cardNameInfer");

function callBackBuilder(args){
  return (res) => {
    let resNames = res.map(res => res.name);
    let ratings = stringSimilarity.findBestMatch(args, resNames);
    return res[ratings.bestMatchIndex];
  }
}

async function getMostMatchingCard(args, gameMode){
  return cardNameInfer(args, gameMode, callBackBuilder(args));
}

module.exports = getMostMatchingCard;