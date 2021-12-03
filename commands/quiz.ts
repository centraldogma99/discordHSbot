import loadUserConfig from "../tools/loadUserConfig";
import { cardRealWildModel, cardAliasStandardModel, cardAliasModel } from "../db";
import generateQuiz from "../tools/generateQuiz";
import { Message, MessageActionRow, MessageButton } from "discord.js";
import getRandomHint from "../tools/image_hint";
import giveUserPoint from "../tools/giveUserPoint";
import { Card } from "../types/card";
import mongoose from "mongoose"

const quizParticipatePoint = 50;
const quizMultiplier = 2;

async function quiz(message: Message) {
  let quizAnswerPoint = 400;
  (message.channel as any).doingQuiz = true;
  const hintUsed = new Array(4).fill(false, 0);
  await message.channel.sendTyping().catch(console.log);
  const userConfig = await loadUserConfig(message.author);
  const difficulty = userConfig.quizConfig.difficulty;
  let chances = userConfig.quizConfig.chances;

  // 퀴즈를 풀기 시작하면 포인트 지급
  await giveUserPoint(message.author.id, quizParticipatePoint)
    .then(() =>
      message.channel.send(`💰 퀴즈 참여로 ${quizParticipatePoint}포인트 획득!`)
    )
    .catch(console.log);

  let db: mongoose.Model<Card, any, any>;
  if (userConfig.quizConfig.gameMode == "standard") {
    db = cardAliasStandardModel;
  } else if (userConfig.quizConfig.gameMode == "wild") {
    db = cardAliasModel;
  } else if (userConfig.quizConfig.gameMode == "realwild") {
    db = cardRealWildModel;
  }

  let targetCard: Card;
  if (userConfig.quizConfig.rarity != 0) {
    targetCard = (
      await db.aggregate<Card>([
        { $match: { rarityId: userConfig.quizConfig.rarity } },
        { $sample: { size: 1 } },
      ])
    )[0];
  } else {
    targetCard = (await db.aggregate<Card>([{ $sample: { size: 1 } }]))[0];
  }

  const quizImages = await generateQuiz(targetCard.image, difficulty);
  await message.channel.send({ files: [quizImages.croppedImage] });
  await message.channel.send(
    `ℹ️  \`-포기\` 를 입력하면 퀴즈를 취소할 수 있습니다.\nℹ️  \`-힌트\` 를 입력하면 힌트를 볼 수 있습니다.\n채팅으로 카드의 이름을 맞혀보세요! **시간제한 : ${userConfig.quizConfig.time ?? 30
    }초, 기회: ${userConfig.quizConfig.chances
    }번**\n채팅 앞에 '-'(빼기)를 붙여야 명령어/답으로 인식됩니다.(예) -영혼이결속된잿빛혓바닥\n💰 **획득 포인트 : ${quizAnswerPoint}**`
  );

  const answerChecker = (content: string) => {
    return targetCard.alias === content.replace(/\s/g, "");
  };
  const filter = (m: Message) => !m.author.bot;

  const messageCollector = message.channel.createMessageCollector({
    filter,
    time: userConfig.quizConfig.time * 1000 ?? 30000,
  });
  messageCollector.on("collect", async (m) => {
    if (!m.content.startsWith("-")) return;
    const content = m.content.slice(1);
    if (content == "포기") {
      messageCollector.stop("userAbort");
      return;
    }
    if (answerChecker(content)) {
      messageCollector.stop("answered");
      return;
    } else if (content == "힌트") {
      if (hintUsed.reduce((f, s) => f && s)) {
        message.channel.send("‼️  힌트를 모두 사용했습니다.");
        return;
      }
      quizAnswerPoint /= quizMultiplier;
      const k = getRandomHint(message, targetCard, hintUsed);
      hintUsed[k.hint] = true;
      k.promise;
      await message.channel.send(
        `💰 획득 포인트 : ${Math.ceil(quizAnswerPoint)}`
      );
      return;
    } else {
      chances -= 1;
      if (chances == 0) {
        messageCollector.stop("noChancesLeft");
        return;
      }
      messageCollector.resetTimer();
      m.channel.send(`❌  틀렸습니다! 기회가 ${chances}번 남았습니다.`);
    }
  });

  messageCollector.on("end", async (m, reason) => {
    (message.channel as any).doingQuiz = false;
    await message.channel.sendTyping().catch(console.log);
    if (reason == "answered") {
      await message.channel.send(
        `⭕️  <@!${m.last().author.id}>이(가) 정답을 맞췄습니다!`
      );
      const user = await loadUserConfig(m.last().author);
      await giveUserPoint(message.author.id, Math.ceil(quizAnswerPoint))
        .then(() =>
          message.channel.send(
            `💰 퀴즈 정답으로 ${Math.ceil(quizAnswerPoint)}포인트 획득!`
          )
        )
        .catch(console.log);

      if (user)
        await user
          .updateOne({ $set: { ["stats.quiz1"]: user.stats.quiz1 + 1 } })
          .exec();
    } else if (reason == "time") {
      await message.channel.send(`⏰  시간 종료!`);
    } else if (reason == "noChancesLeft") {
      await message.channel.send("❌  기회를 모두 사용했습니다!");
    } else if (reason == "userAbort") {
      await message.channel.send("❌  퀴즈를 포기했습니다.");
    }
    const btn = new MessageButton()
      .setCustomId("primary")
      .setLabel("새로운 퀴즈!")
      .setStyle("PRIMARY");
    const row = new MessageActionRow().addComponents(btn);
    const lastMsg = await message.channel.send({
      content: `💡 정답은 \`${targetCard.name}\` 입니다!`,
      components: [row],
      files: [quizImages.originalImage],
    });

    const buttonCollector = lastMsg.createMessageComponentCollector({
      componentType: "BUTTON",
      time: 15000,
      max: 1,
    });
    buttonCollector.on("collect", (i) => {
      i.update({ content: "☑️  새로운 퀴즈를 가져옵니다...", components: [] })
        .then(() => quiz(message))
        .catch((e) => {
          console.log(e);
          message.channel.send(
            "퀴즈를 가져오던 중 오류가 발생했슶니다. 잠시 후 다시 시도해 주세요!"
          );
        });
    });
    buttonCollector.on("end", async (_, r) => {
      if (r == "time") await lastMsg.delete().catch(console.log);
    });
  });
}

export = {
  name: ["퀴즈", "문제"],
  description: "quiz",
  execute: quiz,
};
