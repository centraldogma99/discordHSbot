import mongo from '../db';
import CONSTANTS from '../constants';
import { uniqueArray } from './helpers/uniqueArray';
import { safeAxiosGet } from './helpers/safeAxiosGet';

export function postDownload(){
  // after download ended
  mongo.cardAliasModel.updateOne({"name":"가시가 돋친 탈것"}, {$set: {"image":"https://imgur.com/WpA3ScQ.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"긴급 소집"}, {$set: {"image":"https://imgur.com/9D1Zoun.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"신의 은총"}, {$set: {"image":"https://imgur.com/L5sKKHC.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"에메랄드 하늘발톱"}, {$set: {"image":"https://imgur.com/CE2Yjdd.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"정신 분열"}, {$set: {"image":"https://imgur.com/0C9dblX.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"책상 임프"}, {$set: {"image":"https://imgur.com/8W1fDQ8.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"천상의 정신"}, {$set: {"image":"https://imgur.com/TgGvDDE.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"사령술사 스랄"}, {$set: {"image":"https://imgur.com/FXgROec.png"}}).exec();
  mongo.cardAliasModel.updateOne({"name":"리치 여왕 제이나"}, {$set: {"image":"https://imgur.com/AqHdNDe.png"}}).exec();
}

export async function downloadDB(blizzardToken: number | string){
  const pageSize = 100;
  let promises = [];
  let cards;
  let doc = [];
  const wildCardCount = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
  { params: {
    locale: "ko_KR",
    pageSize: 1,
    page : 1,
    access_token: blizzardToken
  }})
  .then(res => res.data.cardCount)
  .catch(console.log)
  for(let i = 1;i<=Math.ceil(wildCardCount/pageSize);i++){
    promises[i-1] = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: "ko_KR",
      pageSize: pageSize,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards)
    .catch((e) =>{
      console.log(e);
    })
  }
  cards = (await Promise.all(promises)).reduce((first, second) => first.concat(second));
  let wilddoc = cards.map(card => {return {
    alias: card.name.replace(/\s/g, ''),
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
  }})
  wilddoc = uniqueArray(wilddoc, "alias");
  try{
    await mongo.cardAliasModel.insertMany(wilddoc)
  } catch(e) {
    console.log(e);
  }

  promises = []
  const stdCardCount = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
  { params: {
    locale: "ko_KR",
    pageSize: 1,
    page : 1,
    set: 'standard',
    access_token: blizzardToken
  }})
  .then(res => res.data.cardCount)
  .catch(console.log)

  for(let i = 1;i<=Math.ceil(stdCardCount/pageSize);i++){
    promises[i-1] = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: "ko_KR",
      pageSize: pageSize,
      page : i,
      set: 'standard',
      access_token: blizzardToken
    }})
    .then(res => res.data.cards)
    .catch((e) =>{
      console.log(e);
    })
  }
  cards = (await Promise.all(promises)).reduce((first, second) => first.concat(second));
  let stddoc = cards.map(card => {return {
    alias: card.name.replace(/\s/g, ''),
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
  }})
  stddoc = uniqueArray(stddoc, "alias");
  try{
    await mongo.cardAliasStandardModel.insertMany(stddoc)
  } catch(e) {
    console.log(e);
  }

  let realwilddoc = wilddoc.filter(card => !(stddoc.map(card => card.name).includes(card.name)));
  try{
    await mongo.cardRealWildModel.insertMany(realwilddoc);
  } catch(e) {
    console.log(e);
  }

  promises = []
  const battlegroundsCardCount = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
  { params: {
    locale: "ko_KR",
    gameMode: "battlegrounds",
    pageSize: 1,
    page : 1,
    access_token: blizzardToken
  }})
  .then(res => res.data.cardCount)
  .catch(console.log)
  for(let i = 1;i<=Math.ceil(battlegroundsCardCount/pageSize);i++){
    promises[i-1] = await safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: "ko_KR",
      gameMode: "battlegrounds",
      pageSize: pageSize,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards)
    .catch(console.log)
  }
  cards = (await Promise.all(promises)).reduce((first, second) => first.concat(second));
  doc = cards.map(card => {return {
    alias: card.name.replace(/\s/g, ''),
    name: card.name,
    image: card.image,
    imageGold: card.imageGold,
    childIds: card.childIds,
    rarityId: card.rarityId,
    tier: card.battlegrounds ? (card.battlegrounds.tier ?? "hero") : null,
    classId: card.classId,
    text: card.text,
    health: card.health,
    attack: card.attack,
    minionTypeId: card.minionTypeId
  }})
  doc = uniqueArray(doc, "alias");
  try{
    await mongo.battlegroundsCardModel.insertMany(doc)
  } catch(e) {
    console.log(e);
  }
  // mongo.cardAliasModel.find().then(console.log)
  // mongo.cardAliasStandardModel.find().then(console.log)
}