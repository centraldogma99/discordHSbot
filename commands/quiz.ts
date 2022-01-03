import { loadUserConfig } from "../tools/loadUserConfig";
import { stdCardModel, stdCardModelEng, allCardModel, allCardModelEng, onlyWildCardModel, onlyWildCardModelEng } from "../db";
import { generateQuiz } from "../tools/generateQuiz";
import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { buildSpacing } from "../tools/helpers/buildSpacing";
import { giveUserPoint } from "../tools/giveUserPoint";
import { Card } from "../types/card";
import kor from "../languages/kor/quiz.json"
import eng from "../languages/eng/quiz.json"
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLang, parseLangArr } from "../languages/parseLang"

const quizParticipatePoint = 50;
const quizMultiplier = 2;
const quizPrefix = '.';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function quiz(message: Message) {
  let quizAnswerPoint = 400;
  (message.channel as any).doingQuiz = true;
  let hintUsed = new Array(4).fill(false, 0);
  await message.channel.sendTyping().catch(console.log);
  const userConfig = await loadUserConfig(message.author);
  const difficulty = userConfig.quizConfig.difficulty;
  let chances = userConfig.quizConfig.chances;

  const lang = userConfig.languageMode === 'ko_KR' ?
    parseLang(kor) : parseLang(eng);

  function getRandomHint(message: Message, card: Card, hintUsed: boolean[]) {
    // 글자수, 처음/마지막 몇 글자, 텍스트의 절반
    if (hintUsed.reduce((f, s) => f && s)) return;
    let a = getRandomInt(4);
    let promise;
    while (hintUsed[a]) {
      a = getRandomInt(4);
    }
    if (a == 0) {
      let len = card.alias.length;
      let reslen = Math.floor(len / 3) == 0 ? 1 : Math.floor(len / 2.5);
      promise = message.channel.send(lang("QUIZ-HINT-1")
        .replace("{letters}", card.alias.length.toString())
        .replace("{length}", reslen.toString())
        .replace("{string}", card.alias.slice(0, reslen).toString())
      );
    } else if (a == 1) {
      let len = card.alias.length;
      let reslen = Math.floor(len / 3) == 0 ? 1 : Math.floor(len / 2.5);
      promise = message.channel.send(lang("QUIZ-HINT-2")
        .replace("{letters}", card.alias.length.toString())
        .replace("{length}", reslen.toString())
        .replace("{string}", card.alias.slice(card.alias.length - reslen))
      );
    } else if (a == 2) {
      if (!card.text || card.text.length == 0)
        promise = message.channel.send(
          lang("QUIZ-HINT-3-NO-TEXT")
        );
      else {
        let len = Math.floor(card.text.length / 2);
        promise = message.channel.send(
          lang("QUIZ-HINT-3").replace("{string}", card.text.replace(/<\/?[^>]+(>|$)/g, "").slice(0, len))
        );
      }
    } else if (a == 3) {
      promise = message.channel.send(
        lang("QUIZ-HINT-4").replace("{string}", buildSpacing(card.name))
      )
    }
    return {
      promise: promise,
      hint: a
    }
  }

  // 퀴즈를 풀기 시작하면 포인트 지급
  await giveUserPoint(message.author.id, quizParticipatePoint)
    .then(() => message.channel.send(
      lang("QUIZ-PARTICIPATE-POINT")
        .replace("{point}", quizParticipatePoint.toString())
    ))
    .catch(console.log)

  let db;
  if (userConfig.quizConfig.gameMode == 'standard') {
    if (userConfig.languageMode == 'ko_KR')
      db = stdCardModel;
    else if (userConfig.languageMode == 'en_US')
      db = stdCardModelEng;
  } else if (userConfig.quizConfig.gameMode == 'wild') {
    if (userConfig.languageMode == 'ko_KR')
      db = allCardModel;
    else if (userConfig.languageMode == 'en_US')
      db = allCardModelEng;
  } else if (userConfig.quizConfig.gameMode == 'realwild') {
    if (userConfig.languageMode == 'ko_KR')
      db = onlyWildCardModel;
    else if (userConfig.languageMode == 'en_US')
      db = onlyWildCardModelEng;
  }

  let targetCard: Card;
  if (userConfig.quizConfig.rarity != 0) {
    targetCard = (await db
      .aggregate([
        { $match: { rarityId: userConfig.quizConfig.rarity } },
        { $sample: { size: 1 } }
      ]))[0];
  } else {
    targetCard = (await db
      .aggregate([
        { $sample: { size: 1 } }
      ]))[0];
  }


  const quizImages = await generateQuiz(targetCard.image, difficulty);
  await message.channel.send({ files: [quizImages.croppedImage] });
  await message.channel.send(
    lang("QUIZ-TIP")
      .replace("{timeLeft}", (userConfig.quizConfig.time ?? 30).toString())
      .replace("{chances}", userConfig.quizConfig.chances.toString())
      .replace("{prize}", quizAnswerPoint.toString())
  )
  const answerChecker = (content: string) => {
    return targetCard.alias == content.replace(/\s/g, '');
  }
  const filter = m => !m.author.bot;

  const messageCollector = message.channel.createMessageCollector({
    filter,
    time: userConfig.quizConfig.time * 1000 ?? 30000
  })

  messageCollector.on('collect', async m => {
    if (!m.content.startsWith('.')) return;
    const content = m.content.slice(quizPrefix.length).toLowerCase();
    if (content === 'quit' || content === '종료') {
      messageCollector.stop("userAbort");
      return;
    }
    if (answerChecker(content)) {
      messageCollector.stop("answered");
      return;
    } else if (content === 'hint' || content === '힌트') {
      if (hintUsed.reduce((f, s) => f && s)) {
        message.channel.send(lang("QUIZ-NO-REMAINING-HINT"));
        return;
      }
      quizAnswerPoint /= quizMultiplier;
      let k = getRandomHint(message, targetCard, hintUsed);
      hintUsed[k.hint] = true;
      k.promise;
      await message.channel.send(
        lang("QUIZ-PRIZE-POINT")
          .replace("{prize}", Math.ceil(quizAnswerPoint).toString())
      )
      return;
    } else {
      chances -= 1;
      if (chances == 0) {
        messageCollector.stop("noChancesLeft");
        return;
      }
      messageCollector.resetTimer();
      m.channel.send(
        lang("QUIZ-INCORRECT")
          .replace("{chances}", chances.toString())
      )
    }
  })

  messageCollector.on('end', async (m, reason) => {
    (message.channel as any).doingQuiz = false;
    await message.channel.sendTyping().catch(console.log);
    if (reason == "answered") {
      await message.channel.send(
        lang("QUIZ-CORRECT")
          .replace("{user}", m.last().author.id)
      );
      const user = await loadUserConfig(m.last().author);
      await giveUserPoint(message.author.id, Math.ceil(quizAnswerPoint))
        .then(() => message.channel.send(
          lang("QUIZ-CORRECT-PRIZE")
            .replace("{prize}", Math.ceil(quizAnswerPoint).toString())
        ))
        .catch(console.log)

      if (user) await user.updateOne({ $set: { ["stats.quiz1"]: user.stats.quiz1 + 1 } });
    } else if (reason == "time") {
      await message.channel.send(lang("QUIZ-TIMEUP"));
    } else if (reason == "noChancesLeft") {
      await message.channel.send(lang("QUIZ-NO-REMAINING-ATTEMPT"));
    } else if (reason == 'userAbort') {
      await message.channel.send(lang("QUIZ-GIVEUP"));
    }
    const btn = new MessageButton()
      .setCustomId('primary')
      .setLabel(lang("QUIZ-NEWQUIZ"))
      .setStyle('PRIMARY');
    const row = new MessageActionRow()
      .addComponents(btn)
    let lastMsg = await message.channel.send({
      content: lang("QUIZ-ANSWER-REVEAL").replace("{answer}", targetCard.name),
      components: [row],
      files: [quizImages.originalImage]
    })

    const buttonCollector = lastMsg.createMessageComponentCollector({
      componentType: 'BUTTON', time: 15000, max: 1
    });
    buttonCollector.on('collect', i => {
      i.update({ content: lang("QUIZ-STARTING-NEW"), components: [] })
        .then(() => quiz(message))
        .catch(e => {
          console.log(e); message.channel.send(
            lang("QUIZ-ERROR-STARTING")
          )
        })
    })
    buttonCollector.on('end', async (_, r) => {
      if (r == 'time') await lastMsg.delete().catch(console.log);
    })
  })

}

module.exports = {
  name: [...parseLangArr(commandsKor)("QUIZ"), ...parseLangArr(commandsEng)("QUIZ")],
  description: 'quiz',
  execute: quiz
}