/*
  카드이름의 일부분 또는 전부를 받아 해당하는 카드들의 이름/정보 반환
*/
import { allCardModel, stdCardModelEng, stdCardModel, allCardModelEng } from '../db';
import { Card } from "../types/card"

export async function cardNameInfer(
  cardName: string,
  gameMode = 'wild',
  locale: string
): Promise<Card[]> {
  let db;
  if (gameMode == 'standard') {
    if (locale === 'ko_KR') db = stdCardModel;
    else if (locale === 'en_US') db = stdCardModelEng;
  } else if (gameMode == 'wild') {
    if (locale === 'ko_KR') db = allCardModel;
    else if (locale === 'en_US') db = allCardModelEng;
  } else return;

  let temp = cardName.replace(/\s/g, '').toLowerCase();

  let res = await db.find({ alias: { $regex: temp } });
  if (res.length > 0) {
    return res;
  }
  else {
    return [];
  }
}