const Discord = require("discord.js")
const client = new Discord.Client()
const axios = require("axios")
require("dotenv").config()

const blizzardToken = process.env.BLIZZARD_TOKEN;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", async msg => {
  if(msg.author.bot) return
  try{
    const res = await axios({
      method: "GET",
      url: "https://kr.api.blizzard.com/hearthstone/cards?locale=ko_KR&textFilter=" + encodeURI(msg.content) + "&access_token=" + blizzardToken
    })
    let rescard = res.data.cards[0];
    let resimg = rescard.imageGold ? rescard.imageGold : rescard.image;
    await msg.channel.send({files: [resimg]});
    if(rescard.childIds != null){
      for await(const id of rescard.childIds){
        const rescard = await axios({
          method : "GET",
          url : "https://kr.api.blizzard.com/hearthstone/cards/"+id+"?locale=ko_KR&access_token="+blizzardToken
        })
        const resimg = rescard.data.imageGold ? rescard.data.imageGold : rescard.data.image;
        msg.channel.send({files: [resimg]});
      }
    }
  } catch(err){
    console.log(err);
    msg.reply("error")
  }
})
const mySecret = "ODY4MTg4NjI4NzA5NDI1MTYy.YPsBqw.PwNDv67-515AbsJzUet4qt6U2OM"
client.login(mySecret)