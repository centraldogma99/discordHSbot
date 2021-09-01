const mongo = require('../db');
const CONSTANTS = require('../constants')
const uniqueArray = require('./uniqueArray');
const safeAxiosGet = require('./safeAxiosGet');

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
      text: texts[i]
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
      text: texts[i]
    });
  }
  doc = uniqueArray(doc, "alias");
  try{
    await mongo.cardAliasStandardModel.insertMany(doc)
  } catch(e) {
    console.log(e);
  }

  // mongo.cardAliasModel.find().then(console.log)
  // mongo.cardAliasStandardModel.find().then(console.log)
}


module.exports = downloadDB;