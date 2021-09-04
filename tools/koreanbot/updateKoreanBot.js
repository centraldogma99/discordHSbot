const axios = require('axios')
const koreanBotToken = process.env.KOREANBOT_SECRET;

function updateKoreanBot(num){
  return () => axios.post(`https://koreanbots.dev/api/v2/bots/868188628709425162/stats`,
  {
    "servers": num
  },
  {
    headers: {
      "Authorization": koreanBotToken,
      "Content-Type": "application/json"
    }
  })
  .catch(console.log)
}

module.exports = updateKoreanBot;