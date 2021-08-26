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
        rarity : 0
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
        rarity: (userConfig.quizConfig.rarity ? userConfig.quizConfig.rarity : "")
      } :
      {
        gameMode: "standard",
        rarity: ""
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