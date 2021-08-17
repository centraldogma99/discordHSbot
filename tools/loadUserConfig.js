const mongo = require("../db");

async function loadUserConfig(messageAuthor){
  const userConfig = await mongo.userModel.findOne({name:`${messageAuthor.username}#${messageAuthor.discriminator}`}).exec();
  if( !userConfig ){
    return {
      gameMode : "wild",
      paginateStep : 3,
      goldenCardMode : false,
      languageMode : "ko-KR"
    }
  }
  const gameMode = userConfig.gameMode ? userConfig.gameMode : "wild";
  const paginateStep = userConfig.paginateStep ? userConfig.paginateStep : 3;
  const goldenCardMode = userConfig.goldenCardMode ? userConfig.goldenCardMode : false;
  const languageMode = userConfig.languageMode ? userConfig.languageMode : "ko_KR";
 
  return {
    gameMode : gameMode,
    paginateStep : paginateStep,
    goldenCardMode : goldenCardMode,
    languageMode : languageMode
  }
}

module.exports = loadUserConfig;