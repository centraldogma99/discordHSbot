const mongo = require("../db");

async function loadUserConfig(userId){
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

module.exports = loadUserConfig;