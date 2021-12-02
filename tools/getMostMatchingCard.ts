/*
  chlid, defaultAction에서 사용됨
  TODO cardNameInfer과 통합 가능성 있음
*/
const stringSimilarity = require("string-similarity");
import cardNameInfer from "./cardNameInfer";
import { cardClass } from "../types/cardClass";
import { gameMode } from "../types/gameMode";
import { Card } from "../types/card";

function callBackBuilder(args: string, class_?: cardClass) {
  return (cards: Card[]) => {
    if (cards.length == 0) return null;
    let res = cards;
    if (class_) res = res.filter((card) => card.classId == class_.id);
    const resNames = res.map((res) => res.name);
    const ratings = stringSimilarity.findBestMatch(args, resNames);
    return res[ratings.bestMatchIndex];
  };
}

export default async function getMostMatchingCard(
  args: string,
  gameMode: gameMode,
  class_: cardClass
): Promise<Card> {
  const res = await cardNameInfer(args, gameMode);
  return callBackBuilder(args, class_)(res);
}
