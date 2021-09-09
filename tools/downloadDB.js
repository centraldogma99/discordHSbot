const mongo = require('../db');
const CONSTANTS = require('../constants')
const uniqueArray = require('./uniqueArray');
const safeAxiosGet = require('./safeAxiosGet');

function postDownload(){
  // after download ended
  mongo.cardAliasModel.updateOne({"name":"가시가 돋친 탈것"}, {$set: {"image":"https://imgur.com/WpA3ScQ.png"}}).exec();
}

async function downloadDB(blizzardToken){
  const pageSize = 100;
  let promises = []
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
  names = cards.map(card => card.name);
  namesNoSpace = names.map(name => name.replace(/\s/g, ''));
  images = cards.map(card => card.image);
  imageGolds = cards.map(card => card.imageGold)
  childIds = cards.map(card => card.childIds)
  rarityIds = cards.map(card => card.rarityId)
  manaCosts = cards.map(card => card.manaCost)
  cardSetIds = cards.map(card => card.cardSetId)
  classIds = cards.map(card => card.classId)
  texts = cards.map(card => card.text)
  cardTypeIds = cards.map(card => card.cardTypeId)
  healths = cards.map(card => card.health)
  attacks = cards.map(card => card.attack)
  durabilities = cards.map(card => card.durability)
  minionTypeIds = cards.map(card => card.minionTypeId)
  spellSchoolIds = cards.map(card => card.spellSchoolId)
  doc = [];
  for(let i = 0;i<names.length;i++){
    doc = doc.concat({ 
      alias: namesNoSpace[i],
      name: names[i],
      image: images[i],
      imageGold: imageGolds[i],
      childIds: childIds[i],
      rarityId: rarityIds[i],
      manaCost: manaCosts[i],
      cardSetId: cardSetIds[i],
      classId: classIds[i],
      text: texts[i],
      cardTypeId: cardTypeIds[i],
      health: healths[i],
      attack: attacks[i],
      durability: durabilities[i],
      minionTypeId: minionTypeIds[i],
      spellSchoolId: spellSchoolIds[i]
    });
  }
  doc = uniqueArray(doc, "alias");
  try{
    await mongo.cardAliasModel.insertMany(doc)
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
  names = cards.map(card => card.name);
  namesNoSpace = names.map(name => name.replace(/\s/g, ''));
  images = cards.map(card => card.image);
  imageGolds = cards.map(card => card.imageGold)
  childIds = cards.map(card => card.childIds)
  rarityIds = cards.map(card => card.rarityId)
  manaCosts = cards.map(card => card.manaCost)
  cardSetIds = cards.map(card => card.cardSetId)
  classIds = cards.map(card => card.classId)
  texts = cards.map(card => card.text)
  cardTypeIds = cards.map(card => card.cardTypeId)
  healths = cards.map(card => card.health)
  attacks = cards.map(card => card.attack)
  durabilities = cards.map(card => card.durability)
  minionTypeIds = cards.map(card => card.minionTypeId)
  spellSchoolIds = cards.map(card => card.spellSchoolId)
  doc = [];
  for(let i = 0;i<names.length;i++){
    doc = doc.concat({ 
      alias: namesNoSpace[i],
      name: names[i],
      image: images[i],
      imageGold: imageGolds[i],
      childIds: childIds[i],
      rarityId: rarityIds[i],
      manaCost: manaCosts[i],
      cardSetId: cardSetIds[i],
      classId: classIds[i],
      text: texts[i],
      cardTypeId: cardTypeIds[i],
      health: healths[i],
      attack: attacks[i],
      durability: durabilities[i],
      minionTypeId: minionTypeIds[i],
      spellSchoolId: spellSchoolIds[i]
    });
  }
  doc = uniqueArray(doc, "alias");
  try{
    await mongo.cardAliasStandardModel.insertMany(doc)
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
  names = cards.map(card => card.name);
  namesNoSpace = names.map(name => name.replace(/\s/g, ''));
  images = cards.map(card => card.image);
  imageGolds = cards.map(card => card.imageGold)
  childIds = cards.map(card => card.childIds)
  rarityIds = cards.map(card => card.rarityId)
  healths = cards.map(card => card.health)
  attacks = cards.map(card => card.attack)
  tiers = cards.map(card => {
    if(!card.battlegrounds) return;
    else return card.battlegrounds.tier?? "hero"
  })
  classIds = cards.map(card => card.classId)
  texts = cards.map(card => card.text)
  minionTypeIds = cards.map(card => card.minionTypeId);
  doc = [];
  for(let i = 0;i<names.length;i++){
    doc = doc.concat({ 
      alias: namesNoSpace[i],
      name: names[i],
      image: images[i],
      imageGold: imageGolds[i],
      childIds: childIds[i],
      rarityId: rarityIds[i],
      tier: tiers[i],
      classId: classIds[i],
      text: texts[i],
      health: healths[i],
      attack: attacks[i],
      minionTypeId: minionTypeIds[i]
    });
  }
  doc = uniqueArray(doc, "alias");
  try{
    await mongo.battlegroundsCardModel.insertMany(doc)
  } catch(e) {
    console.log(e);
  }
  // mongo.cardAliasModel.find().then(console.log)
  // mongo.cardAliasStandardModel.find().then(console.log)
}


module.exports = {
  downloadDB: downloadDB,
  postDownload: postDownload
}