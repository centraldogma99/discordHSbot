import { cardAliasModel, cardRealWildModel, cardAliasStandardModel, battlegroundsCardModel } from "../db";
import CONSTANTS from "../constants";
import uniqueArray from "./helpers/uniqueArray";
import safeAxiosGet from "./helpers/safeAxiosGet";
import { Card } from "../types/card";
import { BattlenetAPIRes, BattlenetAPICard } from "../types/CardAPI";
import { battlegroundsCard } from "../types/battlegroundsCard";

export function postDownload(): void {
  // after download ended
  cardAliasModel.updateOne(
    { name: "가시가 돋친 탈것" },
    { $set: { image: "https://imgur.com/WpA3ScQ.png" } }
  )
  cardAliasModel.updateOne(
    { name: "긴급 소집" },
    { $set: { image: "https://imgur.com/9D1Zoun.png" } }
  )
  cardAliasModel.updateOne(
    { name: "신의 은총" },
    { $set: { image: "https://imgur.com/L5sKKHC.png" } }
  )
  cardAliasModel.updateOne(
    { name: "에메랄드 하늘발톱" },
    { $set: { image: "https://imgur.com/CE2Yjdd.png" } }
  )
  cardAliasModel.updateOne(
    { name: "정신 분열" },
    { $set: { image: "https://imgur.com/0C9dblX.png" } }
  )
  cardAliasModel.updateOne(
    { name: "책상 임프" },
    { $set: { image: "https://imgur.com/8W1fDQ8.png" } }
  )
  cardAliasModel.updateOne(
    { name: "천상의 정신" },
    { $set: { image: "https://imgur.com/TgGvDDE.png" } }
  )
  cardAliasModel.updateOne(
    { name: "사령술사 스랄" },
    { $set: { image: "https://imgur.com/FXgROec.png" } }
  )
  cardAliasModel.updateOne(
    { name: "리치 여왕 제이나" },
    { $set: { image: "https://imgur.com/AqHdNDe.png" } }
  )
}

export default async function downloadDB(blizzardToken: number | string): Promise<void> {
  // battle.net API 한번에 가져오는 사이즈
  const pageSize = 100;
  // 처리할 promise들을 저장하는 변수
  let promises: Promise<BattlenetAPICard[]>[] = [];
  const wildCardCount = await safeAxiosGet<BattlenetAPIRes>(
    `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
    {
      params: {
        locale: "ko_KR",
        pageSize: 1,
        page: 1,
        access_token: blizzardToken,
      },
    }
  )
    .then((res) => res.data.cardCount)
    .catch(e => { throw e; });

  for (let i = 1; i <= Math.ceil(wildCardCount / pageSize); i++) {
    promises[i - 1] = safeAxiosGet<BattlenetAPIRes>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: "ko_KR",
          pageSize: pageSize,
          page: i,
          access_token: blizzardToken,
        },
      }
    )
      .then((res) => res.data.cards)
      .catch((e) => { throw e; });
  }

  let cards = (await Promise.all(promises)).reduce((first, second) =>
    first.concat(second)
  );

  const wilddoc = uniqueArray<Card>(
    cards.map((card) => {
      return {
        alias: card.name.replace(/\s/g, ""),
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
    }), "alias");
  try {
    await cardAliasModel.insertMany(wilddoc);
  } catch (e) {
    throw e;
  }

  promises = [];
  const stdCardCount = await safeAxiosGet<BattlenetAPIRes>(
    `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
    {
      params: {
        locale: "ko_KR",
        pageSize: 1,
        page: 1,
        set: "standard",
        access_token: blizzardToken,
      },
    }
  )
    .then((res) => res.data.cardCount)
    .catch(e => { throw e; });

  for (let i = 1; i <= Math.ceil(stdCardCount / pageSize); i++) {
    promises[i - 1] = safeAxiosGet<BattlenetAPIRes>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: "ko_KR",
          pageSize: pageSize,
          page: i,
          set: "standard",
          access_token: blizzardToken,
        },
      }
    )
      .then((res) => res.data.cards)
      .catch((e) => { throw e; });
  }

  cards = (await Promise.all(promises)).reduce((first, second) =>
    first.concat(second)
  );

  const stddoc = uniqueArray<Card>(cards.map((card) => {
    return {
      alias: card.name.replace(/\s/g, ""),
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
      multiClassIds: card.multiClassIds,
    };
  }), "alias");
  try {
    await cardAliasStandardModel.insertMany(stddoc);
  } catch (e) {
    throw e;
  }

  const realwilddoc = wilddoc.filter(
    (card) => !stddoc.map((card) => card.name).includes(card.name)
  );
  try {
    await cardRealWildModel.insertMany(realwilddoc);
  } catch (e) {
    throw e;
  }

  promises = [];
  const battlegroundsCardCount = await safeAxiosGet<BattlenetAPIRes>(
    `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
    {
      params: {
        locale: "ko_KR",
        gameMode: "battlegrounds",
        pageSize: 1,
        page: 1,
        access_token: blizzardToken,
      },
    }
  )
    .then((res) => res.data.cardCount)
    .catch(e => { throw e; });

  for (let i = 1; i <= Math.ceil(battlegroundsCardCount / pageSize); i++) {
    promises[i - 1] = safeAxiosGet<BattlenetAPIRes>(
      `https://${CONSTANTS.apiRequestRegion}.api.blizzard.com/hearthstone/cards`,
      {
        params: {
          locale: "ko_KR",
          gameMode: "battlegrounds",
          pageSize: pageSize,
          page: i,
          access_token: blizzardToken,
        },
      }
    )
      .then((res) => res.data.cards)
      .catch(e => { throw e; });
  }
  cards = (await Promise.all(promises)).reduce((first, second) =>
    first.concat(second)
  );
  const doc: battlegroundsCard[] = uniqueArray(cards.map((card) => {
    return {
      alias: card.name.replace(/\s/g, ""),
      name: card.name,
      image: card.image,
      imageGold: card.imageGold,
      childIds: card.childIds,
      rarityId: card.rarityId,
      tier: card.battlegrounds ? card.battlegrounds.tier ?? "hero" : null,
      classId: card.classId,
      text: card.text,
      health: card.health,
      attack: card.attack,
      minionTypeId: card.minionTypeId,
    };
  }), "alias");

  try {
    await battlegroundsCardModel.insertMany(doc);
  } catch (e) {
    throw e;
  }
}
