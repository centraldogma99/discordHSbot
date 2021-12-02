import checkUserVote from "./koreanbot/checkUserVote";
import { userModel } from "../db";
import giveUserPoint from "./giveUserPoint";

async function checkAndGivePoint(userId: number) {
  let voted: boolean;
  try {
    voted = await checkUserVote(userId);
  } catch (e) {
    console.log(e);
  }
  if (voted) {
    try {
      giveUserPoint(userId, 5000);
    } catch (e) {
      console.log(e);
    }
  }
}

export default async function updateVotePoint() {
  const users = await userModel.find({}).exec();
  for (const user of users) {
    checkAndGivePoint(user.id);
    setInterval(() => {
      checkAndGivePoint(user.id);
    }, 60000 * 5);
  }
}
