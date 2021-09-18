/*
  chlid, defaultAction에서 사용됨
  TODO cardNameInfer과 통합 가능성 있음
*/
const stringSimilarity = require("string-similarity");
import { cardNameInfer } from "./cardNameInfer";
import { cardClass } from "../types/cardClass";
import { gameMode } from "../types/gameMode";
import { card } from "../types/card";

function callBackBuilder(args: string, class_?: cardClass){
  return (cards: card[]) => {
    let res = cards;
    if(class_) res = res.filter(card => card.classId == class_.id)
    let resNames = res.map(res => res.name);
    let ratings = stringSimilarity.findBestMatch(args, resNames);
    return res[ratings.bestMatchIndex];
  }
}

export async function getMostMatchingCard(
  args: string,
  gameMode: gameMode,
  class_: cardClass
){
  const res = await cardNameInfer(args, gameMode);
  return callBackBuilder(args, class_)(res);
}