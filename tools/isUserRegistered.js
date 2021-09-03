const mongo = require('../db');

async function isUserRegistered(id){
  const user = await mongo.userModel.find({ id: id }).exec()
  if(user) return true;
  else return false;
}

module.exports = isUserRegistered;