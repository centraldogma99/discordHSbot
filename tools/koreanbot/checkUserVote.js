const axios = require('axios')
const koreanBotToken = process.env.KOREANBOT_SECRET;

function checkUserVote(userId){
  return axios.get(`https://koreanbots.dev/api/v2/bots/868188628709425162/vote`,
  {
    params: {
      "userID": userId
    },
    headers: {
      "Authorization": koreanBotToken,
    }
  })
  .then(res => res.data.voted)
  .catch(e => {throw e})
}

module.exports = checkUserVote