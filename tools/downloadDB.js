const axios = require('axios')
const mongo = require('../db');
const CONSTANTS = require('../constants')
const uniqueArray = require('./uniqueArray')

async function downloadDB(blizzardToken){
  let promises = []
  for(let i = 1;i<=38;i++){
    promises[i-1] = await axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: "ko_KR",
      pageSize: 100,
      page : i,
      access_token: blizzardToken
    }})
    .then(res => res.data.cards)
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
      classId: classIds[i]
    });
  }
  doc = uniqueArray(doc, "alias");
  try{
    await mongo.cardAliasModel.insertMany(doc)
  } catch(e) {
    console.log(e);
  }

  promises = []
  for(let i = 1;i<=10;i++){
    promises[i-1] = await axios.get(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards`, 
    { params: {
      locale: "ko_KR",
      pageSize: 100,
      page : i,
      set: 'standard',
      access_token: blizzardToken
    }})
    .then(res => res.data.cards)
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
      classId: classIds[i]
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