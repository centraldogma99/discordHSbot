const loadUserConfig = require("../tools/loadUserConfig");
const mongo = require("../db");
const { MessageActionRow, MessageButton } = require('discord.js');
const cho_hangul = require("../tools/cho_Hangul");
const giveUserPoint = require("../tools/giveUserPoint");
const generateQuiz = require("../tools/generateQuiz");

const rarity = require("../tools/jsons/rarity.json");
const cardSet = require("../tools/jsons/cardset.json");
const cardType = require("../tools/jsons/cardType.json");
const class_ = require("../tools/jsons/class.json");
const minionType = require("../tools/jsons/minionType.json");
const spellSchool = require("../tools/jsons/spellSchool.json");

const quizParticipatePoint = 50;
const quizTimeLimit = 120000;
const pointMultiplier = 1.5;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function translateToKor(json, id){
  return json.filter(e => e.id === id)[0]?.nameKor;
}

class Hint {
  constructor(message, card){
    this.message = message;
    this.card = card;
    this.level = 0;
    const len = card.alias.length;
    const reslen = Math.floor(len/3) == 0 ? 1 : Math.floor(len/2.5);
    const croppedImage = generateQuiz(card.image, 3)

    this.hints = [[
      `💡 이 카드는 **${translateToKor(rarity, card.rarityId)}** 등급 카드 입니다.`, // 전설/희귀/특급/일반...
      `💡 띄어쓰기는 **${(() => {
        let r = "";
        for(let i=0;i<card.name.length;i++){
          if(card.name[i] != " ") r = r.concat("O");
          else r = r.concat(" ");
        }
        return r;
      })()}** 입니다.`,
      (() => {
        // cardSet json에 고전이 없음.
        const r = translateToKor(cardSet, card.cardSetId);
        if(r){
          return `💡 이 카드는 확장팩 **${r}** 에 출시되었습니다.`;
        } else {
          return `💡 이 카드는 **고전** 카드입니다.`;
        }
      })(),
      (() => {
        if(card.classId){
          console.log(card.classId)
          if(card.classId == 12){
            return `💡 이 카드는 **중립** 카드입니다.`
          }
          
          return `💡 이 카드는 **${translateToKor(class_, card.classId)[0]}** 카드입니다.`
        }
      })(),
      `💡 이 카드는 **${translateToKor(cardType, card.cardTypeId)}** 입니다.` // 주문/하수인/영웅변신/무기
    ],
      (() => {
        if(card.cardTypeId == 4) return [
          `💡 이 카드의 스탯은 **${card.attack}/${card.health}** 입니다.`,
          (() => {
            if(card.minionTypeId) {
              return `💡 이 카드의 종족값은 **${translateToKor(minionType, card.minionTypeId)}** 입니다.`
            } else {
              return `💡 이 카드는 종족값이 없습니다.`
            }
          })()
        ]
        else if(card.cardTypeId == 5) return [
          `💡 이 카드의 주문 속성은 **${translateToKor(spellSchool, card.spellSchoolId) ?? "무속성"}** 입니다.`
        ]
        else if(card.cardTypeId == 7) return [
          `💡 이 카드의 공격력/내구도는 **${card.attack}/${card.durability}** 입니다.`
        ]
      })()
    , [
      `💡 처음 ${reslen}글자는 **\`${card.alias.slice(0,reslen)}\`**입니다.(띄어쓰기 무시)`,
      `💡 마지막 ${reslen}글자는 **\`${card.alias.slice(len-reslen)}\`**입니다.(띄어쓰기 무시)`,
      card.text == "" ? `💡 이 카드는 카드 텍스트가 없습니다.` :
      `💡 **카드 텍스트 힌트**  _${card.text.replace(/<\/?[^>]+(>|$)/g, "").slice(0, Math.floor(card.text.length / 2))}..._ (후략)`,
      {content: `💡 이 카드의 일러스트의 일부분입니다.`, files: croppedImage}
    ]];
  }

  async getHint(){
    if(this.level === 3){
      return this.message.channel.send("‼️ 힌트를 모두 사용했습니다.");
    }
    while(this.hints[this.level].length === 0){
      this.level++;
      if(this.level >= 3){
        return this.message.channel.send("‼️ 힌트를 모두 사용했습니다.");
      }
    }
    
    let currentHint = this.hints[this.level];
    if (this.level == 1) {
      for(let [k, v] of currentHint){
        if(k == this.card.cardTypeId){
          currentHint = v
        }
      }
    }
    const i = getRandomInt(currentHint.length);
    const res = currentHint.splice(i, 1)[0];
    
    if(typeof res === 'string'){
      this.message.channel.send(res);
    } else if (typeof res === 'object'){
      const files = await res.files;
      this.message.channel.send({content: res.content, files: [files.croppedImage]})
    }
  }
}

async function quiz_chosung(message){
  message.channel.doingQuiz = true;
  let quizAnswerPoint = 1500;
  await message.channel.sendTyping();
  const userConfig = await loadUserConfig(message.author.id);
  let chances = userConfig.quizConfig.chances;
  let db;

  // 퀴즈를 풀기 시작하면 100포인트 지급
  await giveUserPoint(message.author.id, Math.floor(quizParticipatePoint))
  .then(() => message.channel.send(`💰 퀴즈 참여로 ${Math.floor(quizParticipatePoint)}포인트 획득!`))
  .catch(console.log)

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
  

  const quizChosung = cho_hangul(targetCard.name);
  const hint = new Hint(message, targetCard);
  await message.channel.send(`이 카드는 무엇일까요?\n\n**${quizChosung.replace(/\s/g, '')}**\n\nℹ️  \`포기\` 를 입력하면 퀴즈를 취소할 수 있습니다.\nℹ️  \`힌트\` 를 입력하면 힌트를 볼 수 있습니다.\n채팅으로 카드의 이름을 맞혀보세요! **시간제한 : 120초**\n💰 **획득 포인트 : ${quizAnswerPoint}**`)
  
  const answerChecker = (ans) => {
    return targetCard.alias == ans.content.replace(/\s/g, '')
  }
  const filter = m => !m.author.bot;

  const messageCollector = message.channel.createMessageCollector( { filter, time: quizTimeLimit })
  messageCollector.on('collect', async m => {
    if(m.content.startsWith('-')) return;
    if ( m.content == '포기'){
      messageCollector.stop("userAbort");
      return;
    }
    if ( answerChecker(m) ) {
      messageCollector.stop("answered");
      return;
    } else if (m.content == '힌트'){
      await hint.getHint();
      if(hint.level < 3) {
        quizAnswerPoint /= pointMultiplier
        await message.channel.send(`💰 획득 포인트 : ${Math.ceil(quizAnswerPoint)}`)
      }
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
    message.channel.doingQuiz = false;
    await message.channel.sendTyping();
    if ( reason == "answered" ){
      await message.channel.send(`⭕️  <@!${m.last().author.id}>이(가) 정답을 맞췄습니다!`);
      await giveUserPoint(message.author.id, Math.ceil(quizAnswerPoint))
      .then(() => message.channel.send(`💰 퀴즈 정답으로 ${Math.ceil(quizAnswerPoint)}포인트 획득!`))
      .catch(console.log)
      
      const user = await mongo.userModel.findOne({ id: m.last().author.id }).exec()
      if(user) await user.updateOne({$set: {["stats.quiz1"]: user.stats.quiz1 + 1 }}).exec()
      else {message.channel.send("뭔가 잘못됐군요... 일해라 개발자!")}
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
    let lastMsg = await message.channel.send({ content: `💡 정답은 \`${targetCard.name}\` 입니다!`, components: [row], files: [targetCard.image]})
    
    const buttonCollector = lastMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000, max: 1 });
    buttonCollector.on('collect', i => {
      i.update({ content: "☑️  새로운 퀴즈를 가져옵니다...", components: [] })
      .then(() => quiz_chosung(message))
      .catch(e => {console.log(e); message.channel.send("퀴즈를 가져오던 중 오류가 발생했슶니다. 잠시 후 다시 시도해 주세요!")})
    })
    buttonCollector.on('end', async (_, r) => {
      if(r == 'time') await lastMsg.delete();
    })
  })
}

module.exports = {
  name : ['초성퀴즈', '초성문제', '초성'],
  description : 'quiz_chosung',
  execute : quiz_chosung
}