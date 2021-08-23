const { Client, Intents, Collection, Permissions } = require("discord.js");

const client = new Client({ intents : [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ] });
const tokenizer = require("./tools/tokenizer");
const fs = require('fs');
const translateClass = require("./tools/translateClass");
const BlizzardToken = require("./tools/BlizzardToken");
const Logger = require("./tools/Logger");
const downloadDB = require("./tools/downloadDB");
let logChannel;

require("dotenv").config()

const prefix = '!';
const exclamationMark = '‼️';
const discordToken = process.env.DISCORD_TOKEN;
const logServerId = process.env.LOG_SERVER;
const logChannelId = process.env.LOG_CHANNEL;
let logger;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles){
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
  console.log(`I am in ${client.guilds.cache.size} servers.`)
  client.user.setActivity("Hearthstone", {
    type: "PLAYING",
  });
  logChannel = client.guilds.cache.get(logServerId).channels.cache.get(logChannelId);
  logger = new Logger(logChannel);
  // 개발시 주석처리할것
  BlizzardToken.getToken()
  .then(token => downloadDB(token))
  .then(logger.serverLog("Server ON"))
})

client.on("messageCreate", async message => {
  if( message.author.bot ) return;
  if( !message.mentions.has(client.user.id) ) return;

  // 현재 채널에 permission가지고 있는지 확인
  const roleChecker = [
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.ATTACH_FILES,
    Permissions.FLAGS.ADD_REACTIONS
  ];
  let hasPermission = false;
  for( const role of message.guild.me.roles.cache.values() ){
    let myRolePermission = role.permissionsIn(message.channel);
    if( myRolePermission.has(roleChecker) ){
      if (role.name != '@everyone'){
        hasPermission = true;
        break;
      } 
    }
  }
  if( !hasPermission ) {
    logger.serverLog(`No permission : ${ message.channel.id }`);
    return;
  }

  // 메시지 받은것 로깅
  logger.messageLog(message);

  let tokens;
  try{
    tokens = tokenizer(message.content, translateClass);

    if (tokens.mention != client.user.id) {
      throw Error("MentionShouldGoFirst");
    }
  } catch(e){
    if (e.message === "MentionShouldGoFirst"){
      message.channel.send("‼️ 멘션이 가장 앞에 있어야 합니다.\n\n**ex)** `@여관주인 !모든 SI:7`");
      return;
    } else if (e.message === "WrongClass"){
      message.channel.send("‼️ 존재하지 않는 직업입니다.\n\n**ex)** 술사, 주술사, 도적, 돚거, 흑마, 흑마법사 등");
      return;
    } else {
      console.log(e);
    }
  }  
  let blizzardToken = await BlizzardToken.getToken();
  try{
    // @여관주인
    if( !tokens.command ) {
      if( !tokens.args ){
        client.commands.get("사용법").execute(message, null);
        return;
      } else {
        client.commands.get("defaultAction").execute(message, tokens.args, blizzardToken, tokens.class_);
      }
    } else {
      if( !client.commands.has(tokens.command) ) {
        message.channel.send("‼️ 없는 명령어입니다!");
        return;
      } else {
        client.commands.get(tokens.command).execute(message, tokens.args, blizzardToken, tokens.class_);
      }
    }
  } catch(err){
    console.log(err);
    message.channel.send("‼️ 서버 내부 오류! 개발자에게 알려주세요!");
  }
})

try {
  client.login(discordToken)
} catch(e){
  console.log("로그인 실패")
}

