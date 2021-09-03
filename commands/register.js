const mongo = require('../db')

async function register(message){
  await mongo.userModel.findOne({id: message.author.id }).exec()
  .then( async user => {
    if(user) message.channel.send("？ 이미 등록되어 있습니다!");
    else {
      await mongo.userModel.insertMany([{
        id: message.author.id
      }])
      message.channel.send("☑️ 등록 완료!")
    }
  })
  .catch(e => {throw e})
}

module.exports = {
  name : ['등록'],
  description : 'register',
  execute : register
}