const mongo = require("../db");

async function loadUserConfig(messageAuthor){
  const userConfig = await mongo.userModel.findOne({ id: messageAuthor.id }).exec();
  if( !userConfig ){
    return {
      gameMode : "wild",
      paginateStep : 3,
      goldenCardMode : false,
      languageMode : "ko-KR",
      quizConfig : {
        gameMode : "standard",
        rarity : 0,
        chances: 5,
        difficulty: 1
      },
      stats: {
        point: 0,
        quiz1: 0,
        quiz2: 0,
        quiz3: 0,
        quiz4: 0,
        quiz5: 0,
        vote: 0
      }
    }
  }
  const quizConfig =
    userConfig.quizConfig ? 
      {
        gameMode: userConfig.quizConfig.gameMode ?? "standard",
        rarity: userConfig.quizConfig.rarity ?? 0,
        chances: userConfig.quizConfig.chances ?? 5,
        difficulty: userConfig.quizConfig.difficulty ?? 1
      } :
      {
        gameMode: "standard",
        rarity: "",
        chances: 5,
        difficulty: 1
      }

  const stats = {
    point: 0,
    quiz1: 0,
    quiz2: 0,
    quiz3: 0,
    quiz4: 0,
    quiz5: 0,
    vote: 0
  }
 
  return {
    gameMode : userConfig.gameMode ?? "wild",
    paginateStep : userConfig.paginateStep ?? 3,
    goldenCardMode : userConfig.goldenCardMode ?? false,
    languageMode : userConfig.languageMode ?? "ko_KR",
    quizConfig : quizConfig,
    stats : stats
  }
}

module.exports = loadUserConfig;