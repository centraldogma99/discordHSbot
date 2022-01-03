import { allCardModel, allCardModelEng, stdCardModelEng, stdCardModel, onlyWildCardModelEng, onlyWildCardModel, battlegroundsCardModel, battlegroundsCardModelEng } from '../db';
import CONSTANTS from '../constants';
import { uniqueArray } from './helpers/uniqueArray';
import safeAxios from './helpers/safeAxiosGet';
import ApiRes, { ApiResParent } from '../types/ApiRes';
import { Card } from '../types/card';

const axios = safeAxios();

export function postDownload() {
  // after download ended
  allCardModel.updateOne({ "name": "가시가 돋친 탈것" }, { $set: { "image": "https://imgur.com/WpA3ScQ.png" } }).exec();
  allCardModel.updateOne({ "name": "긴급 소집" }, { $set: { "image": "https://imgur.com/9D1Zoun.png" } }).exec();
  allCardModel.updateOne({ "name": "신의 은총" }, { $set: { "image": "https://imgur.com/L5sKKHC.png" } }).exec();
  allCardModel.updateOne({ "name": "에메랄드 하늘발톱" }, { $set: { "image": "https://imgur.com/CE2Yjdd.png" } }).exec();
  allCardModel.updateOne({ "name": "정신 분열" }, { $set: { "image": "https://imgur.com/0C9dblX.png" } }).exec();
  allCardModel.updateOne({ "name": "책상 임프" }, { $set: { "image": "https://imgur.com/8W1fDQ8.png" } }).exec();
  allCardModel.updateOne({ "name": "천상의 정신" }, { $set: { "image": "https://imgur.com/TgGvDDE.png" } }).exec();
  allCardModel.updateOne({ "name": "사령술사 스랄" }, { $set: { "image": "https://imgur.com/FXgROec.png" } }).exec();
  allCardModel.updateOne({ "name": "리치 여왕 제이나" }, { $set: { "image": "https://imgur.com/AqHdNDe.png" } }).exec();

  stdCardModel.updateOne({ "name": "가시가 돋친 탈것" }, { $set: { "image": "https://imgur.com/WpA3ScQ.png" } }).exec();
  stdCardModel.updateOne({ "name": "긴급 소집" }, { $set: { "image": "https://imgur.com/9D1Zoun.png" } }).exec();
  stdCardModel.updateOne({ "name": "신의 은총" }, { $set: { "image": "https://imgur.com/L5sKKHC.png" } }).exec();
  stdCardModel.updateOne({ "name": "에메랄드 하늘발톱" }, { $set: { "image": "https://imgur.com/CE2Yjdd.png" } }).exec();
  stdCardModel.updateOne({ "name": "정신 분열" }, { $set: { "image": "https://imgur.com/0C9dblX.png" } }).exec();
  stdCardModel.updateOne({ "name": "책상 임프" }, { $set: { "image": "https://imgur.com/8W1fDQ8.png" } }).exec();
  stdCardModel.updateOne({ "name": "천상의 정신" }, { $set: { "image": "https://imgur.com/TgGvDDE.png" } }).exec();
  stdCardModel.updateOne({ "name": "사령술사 스랄" }, { $set: { "image": "https://imgur.com/FXgROec.png" } }).exec();
  stdCardModel.updateOne({ "name": "리치 여왕 제이나" }, { $set: { "image": "https://imgur.com/AqHdNDe.png" } }).exec();

  onlyWildCardModel.updateOne({ "name": "가시가 돋친 탈것" }, { $set: { "image": "https://imgur.com/WpA3ScQ.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "긴급 소집" }, { $set: { "image": "https://imgur.com/9D1Zoun.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "신의 은총" }, { $set: { "image": "https://imgur.com/L5sKKHC.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "에메랄드 하늘발톱" }, { $set: { "image": "https://imgur.com/CE2Yjdd.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "정신 분열" }, { $set: { "image": "https://imgur.com/0C9dblX.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "책상 임프" }, { $set: { "image": "https://imgur.com/8W1fDQ8.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "천상의 정신" }, { $set: { "image": "https://imgur.com/TgGvDDE.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "사령술사 스랄" }, { $set: { "image": "https://imgur.com/FXgROec.png" } }).exec();
  onlyWildCardModel.updateOne({ "name": "리치 여왕 제이나" }, { $set: { "image": "https://imgur.com/AqHdNDe.png" } }).exec();
}

export async function downloadDB(blizzardToken: number | string) {
  const pageSize = 100;

  const getCardsCount = (set?: string) => {
    return axios.get<ApiResParent>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: "ko_KR",
          pageSize: 1,
          page: 1,
          access_token: blizzardToken,
          set: set
        }
      })
      .then(res => res.data.cardCount)
  }

  const getCards = (page: number, locale: string, set?: string) => {
    return axios.get<ApiRes>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: locale,
          pageSize: pageSize,
          page: page,
          access_token: blizzardToken,
          set: set
        }
      })
      .then(res => res.data.cards)
  }

  const parseCard = (card: Card) => {
    return {
      alias: card.name.replace(/\s/g, '').toLowerCase(),
      name: card.name,
      image: card.image,
      imageGold: card.imageGold,
      childIds: card.childIds,
      rarityId: card.rarityId,
      manaCost: card.manaCost,
      cardSetId: card.cardSetId,
      classId: card.classId,
      text: card.text,
      cardTypeId: card.cardTypeId,
      health: card.health,
      attack: card.attack,
      durability: card.durability,
      minionTypeId: card.minionTypeId,
      spellSchoolId: card.spellSchoolId,
      multiClassIds: card.multiClassIds
    }
  }

  const saveCards = async (set?: string) => {
    const cardCount = await getCardsCount(set);
    const promiseSize = Math.ceil(cardCount / pageSize)

    const promises = Array(promiseSize)
      .fill(0)
      .map((_, i) => getCards(i, "ko_KR", set))
    const promisesEng = Array(promiseSize)
      .fill(0)
      .map((_, i) => getCards(i, "en_US", set))

    const cards = uniqueArray(
      (await Promise.all(promises))
        .reduce((f, s) => { return [...f, ...s] })
        .map(parseCard),
      "alias");
    const cardsEng = uniqueArray(
      (await Promise.all(promisesEng))
        .reduce((f, s) => [...f, ...s])
        .map(parseCard),
      "alias");

    let db, dbEng;
    if (!set) { db = allCardModel; dbEng = allCardModelEng; }
    else if (set === 'standard') { db = stdCardModel; dbEng = stdCardModelEng; }

    try {
      await db.insertMany(cards);
      await dbEng.insertMany(cardsEng);
    } catch (e) {
      console.log(e);
    }

    return { cards, cardsEng }
  }

  const allCards = await saveCards();
  const stdCards = await saveCards("standard");
  const onlyWildCardsKor = allCards.cards.filter(card =>
    !stdCards.cards.map(card => card.name).includes(card.name)
  )
  const onlyWildCardsEng = allCards.cardsEng.filter(card =>
    !stdCards.cardsEng.map(card => card.name).includes(card.name)
  )

  try {
    await onlyWildCardModel.insertMany(onlyWildCardsKor);
    await onlyWildCardModelEng.insertMany(onlyWildCardsEng);
  } catch (e) {
    console.log(e);
  }
}