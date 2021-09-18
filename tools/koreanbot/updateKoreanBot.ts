import axios from 'axios';
const koreanBotToken = process.env.KOREANBOT_SECRET;

export function updateKoreanBot(num: number){
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