const axios = require("axios");
const Discord = require("discord.js")
const client = new Discord.Client()
const fs = require('fs')

require("dotenv").config()

const prefix = '!';
const discordToken = process.env.DISCORD_TOKEN;
const blizzardID = process.env.BLIZZARD_ID;
const blizzardSecret = process.env.BLIZZARD_SECRET;

const translateClass = {
  "사제" : "priest",
  "좆제" : "priest",
  "전사" : "warrior",
  "도적" : "rogue",
  "돚거" : "rogue",
  "흑마법사" : "warlock",
  "흑마" : "warlock",
  "악마사냥꾼" : "demonhunter",
  "악사" : "demonhunter",
  "드루이드" : "druid",
  "드루" : "druid",
  "마법사" : "mage",
  "법사" : "mage",
  "성기사" : "paladin",
  "기사" : "paladin",
  "주술사" : "shaman",
  "술사" : "shaman",
  "사냥꾼" : "hunter",
  "냥꾼" : "hunter"
}


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
.then(res => {blizzardToken = res.data.access_token})
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
  if( message.author.bot ) return
  if( !message.mentions.has(client.user.id) ) return

  let msgContentSplit = message.content.split(" ")
  msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
  let class_;
  let command;
  let args;
  if ( msgContentSplit != undefined ){
    try {
      if( msgContentSplit[0].startsWith('"') ) {
        class_ = translateClass[msgContentSplit[0].substring(1, msgContentSplit[0].length - 1)];
        msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
      }
      if( msgContentSplit[0].startsWith(prefix) ) {
        command = msgContentSplit[0].substring(1);
        msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
      }
      args = msgContentSplit.join(" ")
    } catch {e => {
      if(msgContentSplit != undefined) {
        message.channel.send("명령 처리 중 오류가 발생했습니다.");
        console.log(e);
      }
    }}
  }
  

  // logging
  console.log(`${message.author.username}#${message.author.discriminator} : ${message.createdTimestamp} : ${message.content}`)

  try{
    // @여관주인
    if( !command ) {
      if( !args ){
        client.commands.get("사용법").execute(message, null);
        return;
      } else {
        client.commands.get("defaultAction").execute(message, args, blizzardToken, class_);
      }
    } else {
      if( !client.commands.has(command) ) {
        message.channel.send("없는 명령어입니다!");
        return;
      } else {
        client.commands.get(command).execute(message, args, blizzardToken, class_);
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

