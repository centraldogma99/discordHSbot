const mongoose = require('mongoose')
const schema = mongoose.Schema;

const userSchema = schema({
  name: { type: String, required: true },
  gameMode: { type: String },
  paginateStep: { type: Number },
  languageMode: { type: String },
  goldenCardMode: { type: Boolean }
})

const cardAliasSchema = schema({
  alias: { type: String, required: true, unique: true, dropDups: true },
  name: { type: String, required: true },
  cardImage: { type: String, required: true },
  cardImageGold: { type: String }
})

class Mongo{
  constructor(){
    this.connectDB();
  }

  connectDB(){
    mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true});
    mongoose.set('useFindAndModify', false);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error: '));
    db.once('open', () => {
      console.log('데이터베이스 연결 성공')
      this.userModel = mongoose.model("users", userSchema);
      this.cardAliasModel = mongoose.model('cardAliases', cardAliasSchema);
      this.cardAliasStandardModel = mongoose.model('cardAliasStandards', cardAliasSchema)
    })
    db.on('disconnected', () => {
      console.log('데이터베이스와 연결 끊어짐, 5초 후 연결 재시도')
      setTimeout(this.connectDB, 5000);
    })
  }
}

module.exports = new Mongo();