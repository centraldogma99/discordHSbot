const axios = require('axios')
const koreanBotToken = process.env.KOREANBOT_SECRET;

function updateKoreanBot(){
  axios.post(`https://koreanbots.dev/api/v2/bots/868188628709425162/stats`,
  {
    "servers": client.guilds.cache.size
  },
  {
    headers: {
      "Authorization": koreanBotToken,
      "Content-Type": "application/json"
    }
  })
  .then(console.log)
  .catch(console.log)
}

module.exports = updateKoreanBot;