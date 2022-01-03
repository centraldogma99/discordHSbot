import { User } from './types/user';
import { Card } from './types/card';
import { battlegroundsCard } from './types/battlegroundsCard'
import mongoose from 'mongoose';

const cardLanguage = process.env.CARD_LANGUAGE;

const userSchema = new mongoose.Schema<User>({
  id: { type: Number, required: true },
  tag: { type: String, default: "" },
  gameMode: { type: String, default: "wild" },
  paginateStep: { type: Number, default: 3 },
  languageMode: { type: String, default: "ko_KR" },
  quizConfig: {
    gameMode: { type: String, default: "standard" },
    rarity: { type: Number, default: 0 },
    chances: { type: Number, default: 5 },
    difficulty: { type: Number, default: 1 },
    time: { type: Number, default: 30 }
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

const cardAliasSchema = new mongoose.Schema<Card>({
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

const battlegroundCardSchema = new mongoose.Schema<battlegroundsCard>({
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


export const userModel = mongoose.model("users", userSchema);
export const allCardModel = mongoose.model('allCards', cardAliasSchema);
export const stdCardModel = mongoose.model('stdCards', cardAliasSchema);
export const onlyWildCardModel = mongoose.model('onlyWildCards', cardAliasSchema);
export const battlegroundsCardModel = mongoose.model('battlegroundsCards', battlegroundCardSchema);

export const allCardModelEng = mongoose.model('allCardsEng', cardAliasSchema);
export const stdCardModelEng = mongoose.model('stdCardsEng', cardAliasSchema);
export const onlyWildCardModelEng = mongoose.model('onlyWildCardsEng', cardAliasSchema);
export const battlegroundsCardModelEng = mongoose.model('battlegroundsCards', battlegroundCardSchema);

const connectDB = () => {
  mongoose.connect('mongodb://localhost:27017/test');
  // mongoose.set('useFindAndModify', false);
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error: '));
  db.once('open', () => {
    console.log('데이터베이스 연결 성공')

  })
  db.on('disconnected', () => {
    console.log('데이터베이스와 연결 끊어짐, 5초 후 연결 재시도')
    setTimeout(connectDB, 5000);
  })
}

connectDB();