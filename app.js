const axios = require("axios");
const Discord = require("discord.js")
const client = new Discord.Client()
const fs = require('fs')
const translateClass = require("./tools/translateClass")

require("dotenv").config()

const prefix = '!';
const exclamationMark = '‼️';
const discordToken = process.env.DISCORD_TOKEN;
const blizzardID = process.env.BLIZZARD_ID;
const blizzardSecret = process.env.BLIZZARD_SECRET;


client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

let blizzardToken;
axios({
  url : "https://us.battle.net/oauth/token",
  method : "post",
  auth: {
    username : blizzardID,
    password : blizzardSecret
  },
  data: new URLSearchParams({
    grant_type: 'client_credentials'
  })
})
.then(res => {blizzardToken = res.data.access_token;})
.catch(e => console.log("블리자드 API오류"))

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
})

client.on("message", async message => {
  console.log(message.content);
  if( message.author.bot ) return
  if( !message.mentions.has(client.user.id) ) return

  console.log(`${message.author.username}#${message.author.discriminator} : ${message.createdTimestamp} : ${message.content}`)

  let token;
  try{
    token = tokenizer(message.content, translateClass);
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
    if( !token.command ) {
      if( !token.args ){
        client.commands.get("사용법").execute(message, null);
        return;
      } else {
        client.commands.get("defaultAction").execute(message, token.args, blizzardToken, token.class_);
      }
    } else {
      if( !client.commands.has(token.command) ) {
        message.channel.send("없는 명령어입니다!");
        return;
      } else {
        client.commands.get(token.command).execute(message, token.args, blizzardToken, token.class_);
      }
    }
  } catch(err){
    console.log(err);
    message.channel.send("서버 내부 오류! 개발자에게 알려주세요!");
  }
})

try {
  client.login(discordToken)
} catch(e){
  console.log("로그인 실패")
}

function tokenizer(msgContent, translateClass){
  if( !msgContent ) throw Error("NoContent");
  let msgContentSplit = msgContent.trim().split(/\s+/);
  let mention;
  if (msgContentSplit[0].startsWith('<@') && msgContentSplit[0].endsWith('>')){
    mention = msgContentSplit[0].slice(2, -1)
    if (mention.startsWith('!')) {mention = mention.slice(1);}
  }
  if (mention != client.user.id) {
    throw Error("MentionShouldGoFirst");
  }

  msgContentSplit = msgContentSplit.slice(1);
  let class_;
  let command;
  let args;
  let ret = {}
  if ( msgContentSplit.length == 0 ){
    return ret;
  }
  if( msgContentSplit[0].startsWith('"') && msgContentSplit[0].endsWith('"') ) {
    let korClass = msgContentSplit[0].substring(1, msgContentSplit[0].length-1);
    
    if ( !(korClass in translateClass) ) {
      throw Error("WrongClass");
    }
    class_ = translateClass[korClass];
    ret['class_'] = class_
    msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
  }
  if ( msgContentSplit.length == 0 ){
    return ret;
  }
  if( msgContentSplit[0].startsWith(prefix) ) {
    command = msgContentSplit[0].substring(1);
    msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
  }
  ret['command'] = command;
  if ( msgContentSplit.length == 0 ){
    return ret;
  }
  args = msgContentSplit.join(" ")
  ret['args'] = args
  return ret;
}