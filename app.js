const axios = require("axios");
const Discord = require("discord.js")
const client = new Discord.Client()
const fs = require('fs')

require("dotenv").config()

const prefix = '!';
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
  const msgContentSplit = message.content.split(" ");
  let command = msgContentSplit[1];
  console.log(`${message.author.username}#${message.author.discriminator} : ${message.createdTimestamp} : ${message.content}`)
  
  try{
    if( !command ) {
      client.commands.get("사용법").execute(message, null);
      return;
    }
    if( command.startsWith(prefix) ) {
      command = command.substring(1);
      if( !client.commands.has(command) ) {
        message.channel.send("없는 명령어입니다!");
        return;
      } else {
        const args = msgContentSplit.slice(2, msgContentSplit.length).join(" ")
        client.commands.get(command).execute(message, args, blizzardToken);
      }
    } else {
      const args = msgContentSplit.slice(1, msgContentSplit.length).join(" ")
      client.commands.get("defaultAction").execute(message, args, blizzardToken);
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
