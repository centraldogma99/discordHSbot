import { User } from "./types/user";
import { Card } from "./types/card";
import { battlegroundsCard } from "./types/battlegroundsCard";
import mongoose from "mongoose";

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
    time: { type: Number, default: 30 },
  },
  stats: {
    point: { type: Number, default: 0 },
    quiz1: { type: Number, default: 0 },
    quiz2: { type: Number, default: 0 },
    quiz3: { type: Number, default: 0 },
    quiz4: { type: Number, default: 0 },
    quiz5: { type: Number, default: 0 },
    vote: { type: Number, default: 0 },
  },
  gotPointFromVoteRecently: { type: Boolean, default: false },
});

const cardAliasSchema = new mongoose.Schema<Card>({
  alias: { type: String, required: true, unique: true, dropDups: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  imageGold: String,
  childIds: [Number],
  rarityId: Number,
  manaCost: Number,
  cardSetId: Number,
  classId: Number,
  cardTypeId: Number,
  health: Number,
  attack: Number,
  durability: Number,
  text: String,
  minionTypeId: Number,
  spellSchoolId: Number,
  multiClassIds: [Number]
});

const battlegroundCardSchema = new mongoose.Schema<battlegroundsCard>({
  alias: { type: String, required: true, unique: true, dropDups: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  imageGold: String,
  childIds: [Number],
  rarityId: Number,
  tier: String,
  classId: Number,
  text: String,
  health: Number,
  attack: Number,
  minionTypeId: Number,
});

mongoose.connect("mongodb://localhost:27017/discordHSbot", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useFindAndModify", false);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
  console.log("데이터베이스 연결 성공");
});

export const userModel = mongoose.model("users", userSchema);
export const cardAliasModel = mongoose.model("cardAliases", cardAliasSchema);
export const cardAliasStandardModel = mongoose.model(
  "cardAliasStandards",
  cardAliasSchema
);
export const cardRealWildModel = mongoose.model("cardRealWilds", cardAliasSchema);
export const battlegroundsCardModel = mongoose.model(
  "battlegroundsCards",
  battlegroundCardSchema
);
