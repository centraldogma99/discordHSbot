const axios = require("axios")
const stringSimilarity = require("string-similarity")
const uniqueArrayByName = require('../tools/uniqueArrayByName')
const range = require('../tools/range');

async function getMostMatchingCard(message, args, gameMode, blizzardToken){
  const cardCountLimit = 1500;
  const pageSize = 50;

  let temp = await axios.get("https://us.api.blizzard.com/hearthstone/cards", 
    { params: {
      locale: "ko_KR",
      textFilter: encodeURI(args),
      set: gameMode,
      pageSize: 1,
      access_token: blizzardToken
    }}
  );
  let cardCount = temp.data.cardCount;
  if( cardCount == 0 ) {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  } else if ( cardCount > cardCountLimit ){
    message.channel.send("‼️ 검색 결과가 너무 많습니다. 좀더 구체적인 검색어를 입력해 주세요.");
    return;
  }

  const pageCount = Math.ceil(cardCount / pageSize);
  let promises = range(pageCount, 1).map(i => {
    return axios.get("https://us.api.blizzard.com/hearthstone/cards", 
      { params: {
        locale: "ko_KR",
        textFilter: encodeURI(args),
        set: gameMode,
        pageSize: pageSize,
        page: i,
        access_token: blizzardToken
      }}
    )
    .then(res => {
      let cards = res.data.cards;
      cards = uniqueArrayByName(cards);
      let names = cards.map(card => card.name)
      let ratings = stringSimilarity.findBestMatch(args, names);
      return cards[ratings.bestMatchIndex];
    })
  });

  let resCard;
  let chosenCards = await Promise.all(promises);
  if ( chosenCards.length > 0 ){
    let chosenCardNames = chosenCards.map(card => card.name);
    let ratings = stringSimilarity.findBestMatch(args, chosenCardNames);
    resCard = chosenCards[ratings.bestMatchIndex];
  } else {
    message.channel.send("‼️ 검색 결과가 없습니다! 오타, 띄어쓰기를 다시 확인해 주세요.");
    return;
  }

  return resCard;
}

module.exports = getMostMatchingCard;