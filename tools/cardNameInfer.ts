/*
  카드이름의 일부분 또는 전부를 받아 해당하는 카드들의 이름/정보 반환
*/
import { cardAliasModel, cardAliasStandardModel, battlegroundsCardModel } from "../db";
import { Card } from "../types/card";
import { gameMode } from "../types/gameMode";

export default async function cardNameInfer(
  cardName: string,
  gameMode: gameMode = "wild"
): Promise<Card[]> {
  let db;
  if (gameMode === "standard") db = cardAliasStandardModel;
  else if (gameMode === "wild") db = cardAliasModel;
  else if (gameMode === "battlegrounds") db = battlegroundsCardModel;
  else return;

  const temp = cardName.replace(/\s/g, "");

  const res = await db.find({ alias: { $regex: temp } });
  if (res.length > 0) {
    return res;
  } else {
    return [];
  }
}
