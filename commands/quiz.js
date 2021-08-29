const loadUserConfig = require("../tools/loadUserConfig");
const mongo = require("../db");
const generateQuiz = require("../tools/generateQuiz");
const { MessageActionRow, MessageButton } = require('discord.js');
const cho_hangul = require("../tools/cho_Hangul");

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomHint(message, card, hintUsed){
  // 글자수, 처음/마지막 몇 글자, 텍스트의 절반
  if(hintUsed.reduce((f,s) => f && s)) return;
  let a = getRandomInt(4);
  let promise;
  while(hintUsed[a]){
    a = getRandomInt(5);
  }
  if( a == 0 ){
    promise = message.channel.send(`💡 이 카드의 이름은 ${card.alias.length}글자 입니다.`);
  } else if(a == 1){
    let len = card.alias.length;
    let reslen = Math.floor(len/3) == 0 ? 1 : Math.floor(len/2.5);
    promise = message.channel.send(`💡 이 카드의 처음 ${reslen}글자는 \`${card.alias.slice(0,reslen)}\`입니다.(띄어쓰기 무시)`);
  } else if(a == 2){
    let len = card.alias.length;
    let reslen = Math.floor(len/3) == 0 ? 1 : Math.floor(len/2.5);
    promise =  message.channel.send(`💡 이 카드의 마지막 ${reslen}글자는 \`${card.alias.slice(card.alias.length-reslen)}\`입니다.(띄어쓰기 무시)`);
  } else if(a == 3){
    if(!card.text || card.text.length == 0) return message.channel.send(`💡 이 카드는 카드 텍스트가 없습니다.`);
    else {
      let len = Math.floor(card.text.length / 2);
      promise = message.channel.send(`💡 **카드 텍스트 힌트**  _${card.text.replace(/<\/?[^>]+(>|$)/g, "").slice(0, len)}..._ (후략)`);
    }
  } else if(a == 4){
    promise = message.channel.send(`💡 이 카드의 초성은 \`${cho_hangul(card.alias)}\` 입니다.`)
  }
  return {
    promise: promise,
    hint: a
  }
}

async function quiz(message, args){
  let hintUsed = new Array(5).fill(false, 0);
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author);
  const difficulty = userConfig.quizConfig.difficulty;
  let chances = userConfig.quizConfig.chances;
  let db;

  if( userConfig.quizConfig.gameMode == 'standard'){
    db = mongo.cardAliasStandardModel;
  } else if( userConfig.quizConfig.gameMode == 'wild'){
    db = mongo.cardAliasModel;
  }

  let targetCard;
  if ( userConfig.quizConfig.rarity != 0 ){
    targetCard = (await db
      .aggregate([
        { $match : { rarityId: userConfig.quizConfig.rarity } },
        { $sample : { size : 1 } }
      ]))[0];
  } else {
    targetCard = (await db
      .aggregate([
        { $sample : { size : 1 } }
      ]))[0];
  }
  

  const quizImages = await generateQuiz(targetCard.image, difficulty);
  await message.channel.send({files: [quizImages.croppedImage]});
  await message.channel.send("ℹ️  `포기` 를 입력하면 퀴즈를 취소할 수 있습니다.\nℹ️  `힌트` 를 입력하면 힌트를 볼 수 있습니다.\n채팅으로 카드의 이름을 맞혀보세요! **시간제한 : 30초, 기회 5번**")
  
  const answerChecker = (ans) => {
    return targetCard.alias == ans.content.replace(/\s/g, '')
  }
  const filter = m => !m.author.bot;

  const messageCollector = message.channel.createMessageCollector( { filter, time: 30000 })
  messageCollector.on('collect', m => {
    if ( m.content == '포기'){
      messageCollector.stop("userAbort");
      return;
    }
    if ( answerChecker(m) ) {
      messageCollector.stop("answered");
      return;
    } else if (m.content == '힌트'){
      if( hintUsed.reduce((f,s) => f && s) ) { 
        message.channel.send("‼️  힌트를 모두 사용했습니다.");
        return;
      }
      k = getRandomHint(message, targetCard, hintUsed);
      hintUsed[k.hint] = true;
      k.promise;
      return;
    } else {
      chances -= 1;
      if ( chances == 0 ){
        messageCollector.stop("noChancesLeft");
        return;
      }
      messageCollector.resetTimer();
      m.channel.send(`❌  틀렸습니다! 기회가 ${chances}번 남았습니다.`)
    }
  })
  messageCollector.on('end', async (m, reason) => {
    await message.channel.sendTyping();
    if ( reason == "answered" ){
      await message.channel.send(`⭕️  <@!${m.last().author.id}>이(가) 정답을 맞췄습니다!`);
    } else if ( reason == "time" ){
      await message.channel.send(`⏰  시간 종료!`)
    } else if ( reason == "noChancesLeft" ){
      await message.channel.send("❌  기회를 모두 사용했습니다!");
    } else if ( reason == 'userAbort' ){
      await message.channel.send("❌  퀴즈를 포기했습니다.")
    }
    const btn = new MessageButton()
      .setCustomId('primary')
      .setLabel('새로운 퀴즈!')
      .setStyle('PRIMARY');
    const row = new MessageActionRow()
			.addComponents(btn)
    let lastMsg = await message.channel.send({ content: `💡 정답은 \`${targetCard.name}\` 입니다!`, components: [row], files: [quizImages.originalImage]})
    
    const buttonCollector = lastMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000, max: 1 });
    buttonCollector.on('collect', i => {
      try{
        i.update({ content: "☑️  새로운 퀴즈를 가져옵니다...", components: [] })
        .then(() => quiz(message));
      } catch(e) {
        console.log(e)
      }
    })
    buttonCollector.on('end', async (i, r) => {
      if(r == 'time') await lastMsg.delete();
    })
  })
}

module.exports = {
  name : ['퀴즈', '문제'],
  description : 'quiz',
  execute : quiz
}