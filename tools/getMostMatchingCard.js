/*
  chlid, defaultAction에서 사용됨
  TODO cardNameInfer과 통합 가능성 있음
*/
const stringSimilarity = require("string-similarity")
const cardNameInfer = require("./cardNameInfer");

function callBackBuilder(args, class_){
  return (cards) => {
    let res = cards;
    if(class_) res = res.filter(card => card.classId == class_.id)
    let resNames = res.map(res => res.name);
    let ratings = stringSimilarity.findBestMatch(args, resNames);
    return res[ratings.bestMatchIndex];
  }
}

async function getMostMatchingCard(args, gameMode, class_){
  return cardNameInfer(args, gameMode, callBackBuilder(args, class_));
}

module.exports = getMostMatchingCard;