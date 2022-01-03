import axios from 'axios';
import { userModel } from '../../db';

const koreanBotToken = process.env.KOREANBOT_SECRET;

export async function checkUserVote(userId: number | string) {
  // userID is guaranteed to exist
  const user = userModel.findOne({ id: userId })
  let data = await axios.get(`https://koreanbots.dev/api/v2/bots/868188628709425162/vote`,
    {
      params: {
        "userID": userId
      },
      headers: {
        "Authorization": koreanBotToken,
      }
    })
    .then(res => res.data.data)
    .catch(e => { throw e })

  const targetUser = await user.select('gotPointFromVoteRecently').exec();
  if (data.voted && !targetUser.gotPointFromVoteRecently) {
    await user.updateOne({ gotPointFromVoteRecently: true }).exec();
    setTimeout(() => {
      user.updateOne({ gotPointFromVoteRecently: false }).exec();
    }, new Date().getTime() - data.lastVote);
    return true;
  }
  return false;
}