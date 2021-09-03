const mongo = require('../db')

function giveUserPoint(id, point){
  const userQuery = mongo.userModel.findOne({ id: id })
  return userQuery.exec()
  .then( user => {
    return userQuery.updateOne({$set: {["stats.point"]: user.stats.point + point }}).exec()
  })
  .catch(e => {throw e})
}

module.exports = giveUserPoint