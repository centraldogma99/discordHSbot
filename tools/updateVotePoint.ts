import { checkUserVote } from "./koreanbot/checkUserVote";
import mongo from "../db";
import { giveUserPoint } from "./giveUserPoint";

async function checkAndGivePoint(userId: number){
  if(await checkUserVote(userId)){
    try {
      giveUserPoint(userId, 5000);
    } catch(e) {
      console.log(e);
    }
  }
}

export async function updateVotePoint(){
  const users = await mongo.userModel.find({}).exec();
  for(const user of users){
    checkAndGivePoint(user.id);
    setInterval(() => {checkAndGivePoint(user.id)}, 60000 * 5)
  }
}