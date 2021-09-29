import { Client, Intents, Collection, Message } from "discord.js";

const client = <any>(
  new Client({
    partials: ["CHANNEL"],
    intents: [
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.DIRECT_MESSAGES,
    ],
  })
);

import { tokenizer } from "./tools/tokenizer";
import fs from "fs";
import { Logger } from "./tools/Logger";
import { downloadDB, postDownload } from "./tools/downloadDB";
import { BlizzardToken } from "./tools/BlizzardToken";
import { updateKoreanBot } from "./tools/koreanbot/updateKoreanBot";
import { permissionChecker } from "./tools/permissionChecker";
import { requestScheduler as RequestScheduler } from "./tools/helpers/RequestScheduler";
import { updateVotePoint } from "./tools/updateVotePoint";

require("dotenv").config();

const prefix = "!";
const exclamationMark = "‼️";
const discordToken = process.env.DISCORD_TOKEN;
const logServerId = process.env.LOG_SERVER;
const logChannelId = process.env.LOG_CHANNEL;
const koreanBotToken = process.env.KOREANBOT_SECRET;
let logChannel, logger;
const masterId = "232098431684837376";

client.commands = new Collection();
// FIXME 하드코딩
let commandFiles;
if (process.argv.includes("--ts-node")) {
  commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".ts"));
} else {
  commandFiles = fs
    .readdirSync("./built/commands")
    .filter((file) => file.endsWith(".js"));
}

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  for (const name of command.name) {
    client.commands.set(name, command);
  }
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`I am in ${client.guilds.cache.size} servers.`);
  client.user.setActivity("Hearthstone", {
    type: "PLAYING",
  });
  logChannel = client.guilds.cache
    .get(logServerId)
    .channels.cache.get(logChannelId);
  logger = new Logger(logChannel);
  if (
    !process.argv.includes("--ts-node") &&
    process.argv.includes("--develop")
  ) {
    updateKoreanBot(client.guilds.cache.size)();
    setInterval(updateKoreanBot(client.guilds.cache.size), 120000);
  }
});

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user.id)) return;
  if (message.mentions.everyone) return;
  if (message.type == "REPLY") return;

  if ((message.channel as any).doingQuiz) {
    message.channel.send("❌  이 채널에서 퀴즈가 실행 중입니다.");
    return;
  }

  // 현재 채널에 permission가지고 있는지 확인
  // 스레드에서는 권한 설정을 따로 안 하기 때문에 ㄱㅊ
  if (!message.channel.isThread()) {
    if (!permissionChecker(message, logger)) return;
  }

  // 메시지 받은것 로깅
  logger.messageLog(message);

  let tokens;
  try {
    tokens = tokenizer(message.content);

    if (tokens.mention != client.user.id) {
      throw Error("MentionShouldGoFirst");
    }
  } catch (e) {
    if (e.message === "MentionShouldGoFirst") {
      message.channel.send(
        "‼️ 멘션이 가장 앞에 있어야 합니다.\n\n**ex)** `@여관주인 !모든 SI:7`"
      );
      return;
    } else if (e.message === "WrongClass") {
      message.channel.send(
        "‼️ 존재하지 않는 직업입니다.\n\n**ex)** 술사, 주술사, 도적, 돚거, 흑마, 흑마법사 등"
      );
      return;
    } else {
      console.log(e);
    }
  }

  try {
    // @여관주인
    if (!tokens.command) {
      if (!tokens.args) {
        await client.commands.get("사용법").execute(message, null);
        return;
      } else {
        await client.commands
          .get("defaultAction")
          .execute(message, tokens.args, { class_: tokens.class_ });
      }
    } else {
      if (!client.commands.has(tokens.command)) {
        await message.channel.send(
          "‼️ 없는 명령어입니다! `!명령어`로 도움말을 확인할 수 있습니다."
        );
        return;
      } else {
        await client.commands
          .get(tokens.command)
          .execute(message, tokens.args, { class_: tokens.class_ });
      }
    }
  } catch (err) {
    console.log(err);
    message.channel.send(
      "‼️ 봇 내부 오류! 개발자 일해라!(개발자에게 알림이 전송되었습니다.)"
    );
    client.users.cache.get(masterId).send("서버 내부 오류 발생");
    client.users.cache.get(masterId).send(err.stack);
  }
});

try {
  (async () => {
    const token = await BlizzardToken.getToken();
    if (process.argv.includes("--downloadDB")) {
      await downloadDB(token);
      console.log("DB load complete");
    }
    postDownload();
    await client.login(discordToken);
    updateVotePoint();

    // setInterval(() => console.log(RequestScheduler.reqRate[0]), 10000)
    // setInterval(() => console.log(RequestScheduler.reqRate[1]), 1000)
  })();
} catch (e) {
  console.log("로그인 실패");
  console.log(e);
}
