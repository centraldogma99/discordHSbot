import { loadUserConfig } from "../tools/loadUserConfig";
import mongo from "../db";
import { generateQuiz } from "../tools/generateQuiz";
import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { buildSpacing } from "../tools/helpers/buildSpacing";
import { giveUserPoint } from "../tools/giveUserPoint";
import { Card } from "../types/card";

const quizParticipatePoint = 50;
const quizMultiplier = 2;
const quizPrefix = '.';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

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
    promise = message.channel.send(`💡 This card has ${card.alias.length} letters, the first ${reslen} letters are \`${card.alias.slice(0, reslen)}\`.(Ignore spacing)`);
  } else if (a == 1) {
    let len = card.alias.length;
    let reslen = Math.floor(len / 3) == 0 ? 1 : Math.floor(len / 2.5);
    promise = message.channel.send(`💡 This card has ${card.alias.length} letters, the last ${reslen} letters are \`${card.alias.slice(card.alias.length - reslen)}\`.(Ignore spacing)`);
  } else if (a == 2) {
    if (!card.text || card.text.length == 0) promise = message.channel.send(`💡 This card has no text.`);
    else {
      let len = Math.floor(card.text.length / 2);
      promise = message.channel.send(`💡 **Card text hint**  _${card.text.replace(/<\/?[^>]+(>|$)/g, "").slice(0, len)}..._ (omission)`);
    }
  } else if (a == 3) {
    promise = message.channel.send(`💡 This card have spacing: \`${buildSpacing(card.name)}\`.`)
  }
  return {
    promise: promise,
    hint: a
  }
}

async function quiz(message: Message) {
  let quizAnswerPoint = 400;
  (message.channel as any).doingQuiz = true;
  let hintUsed = new Array(4).fill(false, 0);
  await message.channel.sendTyping().catch(console.log);
  const userConfig = await loadUserConfig(message.author);
  const difficulty = userConfig.quizConfig.difficulty;
  let chances = userConfig.quizConfig.chances;
  let db;

  // 퀴즈를 풀기 시작하면 포인트 지급
  await giveUserPoint(message.author.id, quizParticipatePoint)
    .then(() => message.channel.send(`💰 You received ${quizParticipatePoint} points for taking quiz!`))
    .catch(console.log)

  if (userConfig.quizConfig.gameMode == 'standard') {
    db = mongo.cardAliasStandardModel;
  } else if (userConfig.quizConfig.gameMode == 'wild') {
    db = mongo.cardAliasModel;
  } else if (userConfig.quizConfig.gameMode == 'realwild') {
    db = mongo.cardRealWildModel;
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
  await message.channel.send(`ℹ️  Type \`-quit\` to cancel the quiz.\nℹ️  Type \`-hint\` to receive a hint.\nGuess the card's name! **${userConfig.quizConfig.time ?? 30} seconds left, ${userConfig.quizConfig.chances} attempts remaining**\nUsing the prefix '.' while typing commands and answers. (e.g.) -soulboundashtongue\n💰 **Points earned : ${quizAnswerPoint}**`)

  const answerChecker = (content: string) => {
    return targetCard.alias == content.replace(/\s/g, '');
  }
  const filter = m => !m.author.bot;

  const messageCollector = message.channel.createMessageCollector({ filter, time: userConfig.quizConfig.time * 1000 ?? 30000 })
  messageCollector.on('collect', async m => {
    if (!m.content.startsWith('.')) return;
    const content = m.content.slice(quizPrefix.length).toLowerCase();
    if (content == 'quit') {
      messageCollector.stop("userAbort");
      return;
    }
    if (answerChecker(content)) {
      messageCollector.stop("answered");
      return;
    } else if (content == 'hint') {
      if (hintUsed.reduce((f, s) => f && s)) {
        message.channel.send("‼️  All hints were used.");
        return;
      }
      quizAnswerPoint /= quizMultiplier;
      let k = getRandomHint(message, targetCard, hintUsed);
      hintUsed[k.hint] = true;
      k.promise;
      await message.channel.send(`💰 Point earned : ${Math.ceil(quizAnswerPoint)}`)
      return;
    } else {
      chances -= 1;
      if (chances == 0) {
        messageCollector.stop("noChancesLeft");
        return;
      }
      messageCollector.resetTimer();
      m.channel.send(`❌  Incorrect! ${chances} attempts remaining.`)
    }
  })

  messageCollector.on('end', async (m, reason) => {
    (message.channel as any).doingQuiz = false;
    await message.channel.sendTyping().catch(console.log);
    if (reason == "answered") {
      await message.channel.send(`⭕️  <@!${m.last().author.id}> guessed it right!`);
      const user = await loadUserConfig(m.last().author);
      await giveUserPoint(message.author.id, Math.ceil(quizAnswerPoint))
        .then(() => message.channel.send(`💰 You received ${Math.ceil(quizAnswerPoint)} points for the correct guess!`))
        .catch(console.log)

      if (user) await user.updateOne({ $set: { ["stats.quiz1"]: user.stats.quiz1 + 1 } }).exec();
    } else if (reason == "time") {
      await message.channel.send(`⏰  Time's up!`);
    } else if (reason == "noChancesLeft") {
      await message.channel.send("❌  You have no attempts left.");
    } else if (reason == 'userAbort') {
      await message.channel.send("❌  You gave up the quiz.");
    }
    const btn = new MessageButton()
      .setCustomId('primary')
      .setLabel('New quiz!')
      .setStyle('PRIMARY');
    const row = new MessageActionRow()
      .addComponents(btn)
    let lastMsg = await message.channel.send({ content: `💡 The answer is: \`${targetCard.name}\`!`, components: [row], files: [quizImages.originalImage] })

    const buttonCollector = lastMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 15000, max: 1 });
    buttonCollector.on('collect', i => {
      i.update({ content: "☑️  Starting a new quiz...", components: [] })
        .then(() => quiz(message))
        .catch(e => { console.log(e); message.channel.send("An error occured while starting the quiz. Try again later!") })
    })
    buttonCollector.on('end', async (_, r) => {
      if (r == 'time') await lastMsg.delete().catch(console.log);
    })
  })

}

module.exports = {
  name: ['quiz'],
  description: 'quiz',
  execute: quiz
}