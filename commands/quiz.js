const loadUserConfig = require("../tools/loadUserConfig");
const mongo = require("../db");
const generateQuiz = require("../tools/generateQuiz");

async function quiz(message){
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);
  let targetCard;
  const difficulty = 1;

  if( userConfig.gameMode == 'standard'){
    targetCard = (await mongo.cardAliasStandardModel.aggregate([{ $sample : { size : 1 } }]))[0];
  } else if( userConfig.gameMode == 'wild'){
    targetCard = (await mongo.cardAliasModel.aggregate([{ $sample : { size : 1 } }]))[0];
  }

  const quiz = await generateQuiz(targetCard.image, difficulty);
  await message.channel.send({files: [quiz.croppedImage]});
  await message.channel.send("ℹ️  `포기` 를 입력하면 퀴즈를 취소할 수 있습니다.")
  await message.channel.send("채팅으로 카드의 이름을 맞혀보세요! **시간제한 : 30초, 기회 5번**")
  
  const answerChecker = (ans) => {
    return targetCard.name == ans.content || targetCard.name.replace(/\s/g, '') == ans.content
  }
  const filter = m => !m.author.bot;

  let chances = 5;
  const messageCollector = message.channel.createMessageCollector( { filter, time: 30000, max: chances })
  messageCollector.on('collect', m => {
    if ( m.content == '포기'){
      messageCollector.stop("userAbort");
      return;
    }
    if ( answerChecker(m) ) {
      messageCollector.stop("answered");
      return;
    } else {
      chances -= 1;
      if ( chances == 0 ){
        messageCollector.stop("noChancesLeft");
        return;
      }
      messageCollector.resetTimer();
      m.channel.send(`❌ 틀렸습니다! 기회가 ${chances}번 남았습니다.`)
    }
  })
  messageCollector.on('end', (m, reason) => {
    message.channel.sendTyping();
    let temp;
    if ( reason == "answered" ){
      temp = message.channel.send(`⭕️ ${m.last().author.username}이(가) 정답을 맞췄습니다!`);
    } else if ( reason == "time" ){
      temp = message.channel.send(`⏰ 시간 종료!`)
    } else if ( reason == "noChancesLeft" ){
      temp = message.channel.send("❌ 기회를 모두 사용했습니다!");
    } else if ( reason == 'userAbort' ){
      temp = message.channel.send("❌ 퀴즈를 취소했습니다.")
    }
    temp.then(() => message.channel.send(`정답은 \`${targetCard.name}\` 입니다!`))
    .then(() => message.channel.send({files: [targetCard.image]}))
  })
}

module.exports = {
  name : '퀴즈',
  description : 'quiz',
  execute : quiz
}