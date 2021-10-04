import { Client, Intents, Collection, Message } from "discord.js";

const client = <any>new Client({ partials: ['CHANNEL'], intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES] });

import { tokenizer } from "./tools/tokenizer";
import fs from 'fs';
import { Logger } from "./tools/Logger";
import { downloadDB, postDownload } from "./tools/downloadDB";
import { BlizzardToken } from "./tools/BlizzardToken";
import { updateKoreanBot } from "./tools/koreanbot/updateKoreanBot";
import { permissionChecker } from "./tools/permissionChecker";
import { requestScheduler as RequestScheduler } from "./tools/helpers/RequestScheduler";
import { updateVotePoint } from "./tools/updateVotePoint";

require("dotenv").config()

const prefix = '.';
const exclamationMark = '‼️';
const discordToken = process.env.DISCORD_TOKEN;
const logServerId = process.env.LOG_SERVER;
const logChannelId = process.env.LOG_CHANNEL;
const koreanBotToken = process.env.KOREANBOT_SECRET;
let logChannel, logger;
const masterId = '232098431684837376'

const argv = process.argv.slice(2);

client.commands = new Collection();
// FIXME 하드코딩
let commandFiles;
if (argv.includes('--ts-node')) {
  commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));
} else {
  commandFiles = fs.readdirSync('./built/commands').filter(file => file.endsWith('.js'));
}


for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  for (const name of command.name) {
    client.commands.set(name, command);
  }
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  console.log(`I am in ${client.guilds.cache.size} servers.`)
  client.user.setActivity("Hearthstone", {
    type: "PLAYING",
  });
  logChannel = client.guilds.cache.get(logServerId).channels.cache.get(logChannelId);
  logger = new Logger(logChannel);
  if (!argv.includes('--ts-node') && argv.includes('--develop')) {
    updateKoreanBot(client.guilds.cache.size)()
    setInterval(updateKoreanBot(client.guilds.cache.size), 120000);
  }
})

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;
  if (message.type == 'REPLY') return;
  if (!message.content.startsWith(prefix)) return;

  if ((message.channel as any).doingQuiz) {
    message.channel.send("❌  Someone is doing quiz in this channel.");
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
  } catch (e) {
    if (e.message === "WrongClass") {
      message.channel.send("‼️ Invalid class.");
      return;
    } else {
      console.log(e);
    }
  }

  try {
    // @여관주인
    if (!tokens.command) {
      if (!tokens.args) {
        await client.commands.get("howto").execute(message, null);
        return;
      }
    } else {
      if (!client.commands.has(tokens.command)) {
        await client.commands.get("defaultAction").execute(message, tokens.command, { class_: tokens.class_ });
        return;
      } else {
        await client.commands.get(tokens.command).execute(message, tokens.args, { class_: tokens.class_ });
      }
    }
  } catch (err) {
    console.log(err);
    message.channel.send("‼️ Internal error! Sent an error report to the developer.");
    client.users.cache.get(masterId).send("서버 내부 오류 발생");
    client.users.cache.get(masterId).send(err.stack);
  }
})


try {
  (async () => {
    const token = await BlizzardToken.getToken()
    if (argv.includes('--downloadDB')) {
      await downloadDB(token);
      console.log("DB load complete");
    }
    //postDownload();
    await client.login(discordToken)
    updateVotePoint();

    // setInterval(() => console.log(RequestScheduler.reqRate[0]), 10000)
    // setInterval(() => console.log(RequestScheduler.reqRate[1]), 1000)
  })();
} catch (e) {
  console.log("로그인 실패")
  console.log(e);
}

