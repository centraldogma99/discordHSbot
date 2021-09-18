import { loadUserConfig } from "../tools/loadUserConfig";
import mongo from "../db";
import { generateQuiz } from "../tools/generateQuiz";
import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { cho_hangul } from "../tools/helpers/cho_Hangul";
import { giveUserPoint } from "../tools/giveUserPoint";
import { card } from "../types/card";

const quizParticipatePoint = 50;
const quizMultiplier = 2;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomHint(message: Message, card: card, hintUsed: boolean[]){
  // 글자수, 처음/마지막 몇 글자, 텍스트의 절반
  if(hintUsed.reduce((f,s) => f && s)) return;
  let a = getRandomInt(4);
  let promise;
  while(hintUsed[a]){
    a = getRandomInt(4);
  }
  if(a == 0){
    let len = card.alias.length;
    let reslen = Math.floor(len/3) == 0 ? 1 : Math.floor(len/2.5);
    promise = message.channel.send(`💡 이 카드의 이름은 ${card.alias.length}글자이며, 처음 ${reslen}글자는 \`${card.alias.slice(0,reslen)}\`입니다.(띄어쓰기 무시)`);
  } else if(a == 1){
    let len = card.alias.length;
    let reslen = Math.floor(len/3) == 0 ? 1 : Math.floor(len/2.5);
    promise =  message.channel.send(`💡 이 카드의 이름은 ${card.alias.length}글자이며, 마지막 ${reslen}글자는 \`${card.alias.slice(card.alias.length-reslen)}\`입니다.(띄어쓰기 무시)`);
  } else if(a == 2){
    if(!card.text || card.text.length == 0) promise = message.channel.send(`💡 이 카드는 카드 텍스트가 없습니다.`);
    else {
      let len = Math.floor(card.text.length / 2);
      promise = message.channel.send(`💡 **카드 텍스트 힌트**  _${card.text.replace(/<\/?[^>]+(>|$)/g, "").slice(0, len)}..._ (후략)`);
    }
  } else if(a == 3){
    promise = message.channel.send(`💡 이 카드의 초성은 \`${cho_hangul(card.alias)}\` 입니다.`)
  }
  return {
    promise: promise,
    hint: a
  }
}

async function quiz(message: Message){
  let quizAnswerPoint = 400;
  (message.channel as any).doingQuiz = true;
  let hintUsed = new Array(4).fill(false, 0);
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author.id);
  const difficulty = userConfig.quizConfig.difficulty;
  let chances = userConfig.quizConfig.chances;
  let db;

  // 퀴즈를 풀기 시작하면 포인트 지급
  await giveUserPoint(message.author.id, quizParticipatePoint)
  .then(() => message.channel.send(`💰 퀴즈 참여로 ${quizParticipatePoint}포인트 획득!`))
  .catch(console.log)

  if( userConfig.quizConfig.gameMode == 'standard'){
    db = mongo.cardAliasStandardModel;
  } else if( userConfig.quizConfig.gameMode == 'wild'){
    db = mongo.cardAliasModel;
  } else if(userConfig.quizConfig.gameMode == 'realwild'){
    db = mongo.cardRealWildModel;
  }

  let targetCard: card;
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
  await message.channel.send(`ℹ️  \`-포기\` 를 입력하면 퀴즈를 취소할 수 있습니다.\nℹ️  \`-힌트\` 를 입력하면 힌트를 볼 수 있습니다.\n채팅으로 카드의 이름을 맞혀보세요! **시간제한 : 30초**\n채팅 앞에 '-'(빼기)를 붙여야 명령어/답으로 인식됩니다.(예) -영혼이결속된잿빛혓바닥\n💰 **획득 포인트 : ${quizAnswerPoint}**`)
  
  const answerChecker = (content: string) => {
    return targetCard.alias == content.replace(/\s/g, '')
  }
  const filter = m => !m.author.bot;

  const messageCollector = message.channel.createMessageCollector( { filter, time: 30000 })
  messageCollector.on('collect', async m => {
    if(!m.content.startsWith('-')) return;
    const content = m.content.slice(1);
    if ( content == '포기'){
      messageCollector.stop("userAbort");
      return;
    }
    if ( answerChecker(content) ) {
      messageCollector.stop("answered");
      return;
    } else if (content == '힌트'){
      if( hintUsed.reduce((f,s) => f && s) ) { 
        message.channel.send("‼️  힌트를 모두 사용했습니다.");
        return;
      }
      quizAnswerPoint /= quizMultiplier;
      let k = getRandomHint(message, targetCard, hintUsed);
      hintUsed[k.hint] = true;
      k.promise;
      await message.channel.send(`💰 획득 포인트 : ${Math.ceil(quizAnswerPoint)}`)
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
    (message.channel as any).doingQuiz = false;
    await message.channel.sendTyping();
    if ( reason == "answered" ){
      await message.channel.send(`⭕️  <@!${m.last().author.id}>이(가) 정답을 맞췄습니다!`);
      const user = await loadUserConfig(m.last().author.id);
      await giveUserPoint(message.author.id, Math.ceil(quizAnswerPoint))
      .then(() => message.channel.send(`💰 퀴즈 정답으로 ${Math.ceil(quizAnswerPoint)}포인트 획득!`))
      .catch(console.log)
      
      if(user) await user.updateOne({$set: {["stats.quiz1"]: user.stats.quiz1 + 1 }}).exec();
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
      i.update({ content: "☑️  새로운 퀴즈를 가져옵니다...", components: [] })
      .then(() => quiz(message))
      .catch(e => {console.log(e); message.channel.send("퀴즈를 가져오던 중 오류가 발생했슶니다. 잠시 후 다시 시도해 주세요!")})
    })
    buttonCollector.on('end', async (_, r) => {
      if(r == 'time') await lastMsg.delete().catch(console.log);
    })
  })

}

module.exports = {
  name : ['퀴즈', '문제'],
  description : 'quiz',
  execute : quiz
}