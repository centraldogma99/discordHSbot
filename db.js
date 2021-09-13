const mongoose = require('mongoose')
const schema = mongoose.Schema;

const userSchema = schema({
  id: { type: Number, required: true },
  gameMode: { type: String, default: "wild" },
  paginateStep: { type: Number, default: 3 },
  languageMode: { type: String, default: "ko_KR" },
  goldenCardMode: { type: Boolean, default: false },
  quizConfig: {
    gameMode: { type: String, default: "standard" },
    rarity: { type: Number, default: 0 },
    chances: { type: Number, default: 5 },
    difficulty: { type: Number, default: 1 }
  },
  stats: {
    point: { type: Number, default: 0 },
    quiz1: { type: Number, default: 0 },
    quiz2: { type: Number, default: 0 },
    quiz3: { type: Number, default: 0 },
    quiz4: { type: Number, default: 0 },
    quiz5: { type: Number, default: 0 },
    vote: { type: Number, default: 0 }
  },
  gotPointFromVoteRecently: { type: Boolean, default: false }
});

const cardAliasSchema = schema({
  alias: { type: String, required: true, unique: true, dropDups: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  imageGold: { type: String },
  childIds: { type: [Number] },
  rarityId: { type: Number },
  manaCost: { type: Number },
  cardSetId: { type: Number },
  classId: { type: Number },
  cardTypeId: { type: Number },
  health: { type: Number },
  attack: { type: Number },
  durability: { type: Number },
  text: { type: String },
  minionTypeId: { type: Number },
  spellSchoolId: { type: Number },
  multiClassIds: { type: [Number] }
});

const battlegroundCardSchema = schema({
  alias: { type: String, required: true, unique: true, dropDups: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  imageGold: { type: String },
  childIds: { type: [Number] },
  rarityId: { type: Number },
  tier: { type: String },
  classId: { type: Number },
  text: { type: String },
  health: { type: Number },
  attack: { type: Number },
  minionTypeId: { type: Number }
});

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
      this.cardAliasStandardModel = mongoose.model('cardAliasStandards', cardAliasSchema);
      this.cardRealWildModel = mongoose.model('cardRealWilds', cardAliasSchema);
      this.battlegroundsCardModel = mongoose.model('battlegroundsCards', battlegroundCardSchema);
    })
    db.on('disconnected', () => {
      console.log('데이터베이스와 연결 끊어짐, 5초 후 연결 재시도')
      setTimeout(this.connectDB, 5000);
    })
  }
}

module.exports = new Mongo();