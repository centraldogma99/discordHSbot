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
      }
    }
  }
  const gameMode = userConfig.gameMode ? userConfig.gameMode : "wild";
  const paginateStep = userConfig.paginateStep ? userConfig.paginateStep : 3;
  const goldenCardMode = userConfig.goldenCardMode ? userConfig.goldenCardMode : false;
  const languageMode = userConfig.languageMode ? userConfig.languageMode : "ko_KR";
  const quizConfig =
    userConfig.quizConfig ? 
      {
        gameMode: (userConfig.quizConfig.gameMode ? userConfig.quizConfig.gameMode : "standard"),
        rarity: (userConfig.quizConfig.rarity ? userConfig.quizConfig.rarity : ""),
        chances: (userConfig.quizConfig.chances) ? userConfig.quizConfig.chances : 5,
        difficulty: (userConfig.quizConfig.difficulty) ? userConfig.quizConfig.difficulty : 1
      } :
      {
        gameMode: "standard",
        rarity: "",
        chances: 5,
        difficulty: 1
      }
 
  return {
    gameMode : gameMode,
    paginateStep : paginateStep,
    goldenCardMode : goldenCardMode,
    languageMode : languageMode,
    quizConfig : quizConfig
  }
}

module.exports = loadUserConfig;