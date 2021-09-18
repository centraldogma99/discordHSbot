import mongo from "../db";

export async function loadUserConfig(userId: number | string){
  const user = await mongo.userModel.findOne({ id: userId }).exec();
  if(!user){
    await mongo.userModel.insertMany([{
      id: userId
    }])
    return mongo.userModel.findOne({ id: userId }).exec();
  } else {
    return user;
  }
}