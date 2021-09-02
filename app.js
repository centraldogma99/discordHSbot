const { Client, Intents, Collection, Permissions } = require("discord.js");

const client = new Client({ partials: ['CHANNEL'], intents : [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS ] });

const tokenizer = require("./tools/tokenizer");
const fs = require('fs');
const Logger = require("./tools/Logger");
const downloadDB = require("./tools/downloadDB");
const BlizzardToken = require("./tools/BlizzardToken");
const updateKoreanBot = require("./tools/koreanbot/updateKoreanBot");
const checkUserVote = require("./tools/koreanbot/checkUserVote");

require("dotenv").config()

const prefix = '!';
const exclamationMark = '‼️';
const discordToken = process.env.DISCORD_TOKEN;
const logServerId = process.env.LOG_SERVER;
const logChannelId = process.env.LOG_CHANNEL;
const koreanBotToken = process.env.KOREANBOT_SECRET;
let logChannel, logger;


client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
 
for (const file of commandFiles){
  const command = require(`./commands/${file}`);
  for(const name of command.name){
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
  // updateKoreanBot()
  // setInterval(updateKoreanBot, 120000);
})

client.on("messageCreate", async message => {
  if( message.author.bot ) return;
  if( !message.mentions.has(client.user.id) ) return;
  if( message.mentions.everyone ) return;
  if( message.type == 'REPLY') return;
  if( message.channel.isThread() ) {
    try{
      message.channel.send("‼️ 스레드는 아직 지원하지 않습니다.")
    } catch(e) {
      console.log(e);
    }
    return;
  }
  if( message.channel.doingQuiz ) {
    message.channel.send("❌  이 채널에서 퀴즈가 실행 중입니다.");
    return;
  }
  
  // 현재 채널에 permission가지고 있는지 확인
  const roleChecker = [
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.ATTACH_FILES,
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.MANAGE_MESSAGES
  ];
  
  if(message.channel.guild){
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
      message.channel.send("‼️ 현재 채널에 봇이 활동할 권한이 부족합니다.\n'채널 보기', '메시지 보내기', '파일 첨부', '반응 추가하기', '메시지 관리' 중 하나라도 권한이 부족할 경우 이 오류가 발생합니다.")
      .catch(console.log)
      return;
    }
  }
  

  // 메시지 받은것 로깅
  logger.messageLog(message);

  let tokens;
  try{
    tokens = tokenizer(message.content);

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
  
  try{
    // @여관주인
    if( !tokens.command ) {
      if( !tokens.args ){
        client.commands.get("사용법").execute(message, null);
        return;
      } else {
        client.commands.get("defaultAction").execute(message, tokens.args, {class_: tokens.class_});
      }
    } else {
      if( !client.commands.has(tokens.command) ) {
        message.channel.send("‼️ 없는 명령어입니다! `!명령어`로 도움말을 확인할 수 있습니다.");
        return;
      } else {
        client.commands.get(tokens.command).execute(message, tokens.args, {class_ :tokens.class_});
      }
    }
  } catch(err){
    console.log(err);
    message.channel.send("‼️ 서버 내부 오류! 개발자에게 알려주세요!");
  }
})


try {
  //개발시 주석처리할것
  BlizzardToken.getToken()
  // .then(token => downloadDB(token))
  .then(() => client.login(discordToken))
  .then(() => console.log("DB load complete"))
} catch(e){
  console.log("로그인 실패")
  console.log(e);
}

