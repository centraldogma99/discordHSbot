import { gameMode, quizGameMode } from "./gameMode";

export interface User {
  id: number | string,
  gameMode: gameMode,
  paginateStep: number,
  languageMode: string,
  quizConfig: {
    gameMode: quizGameMode,
    rarity: number,
    chances: number,
    difficulty: number
  },
  stats: {
    point: number,
    quiz1: number,
    quiz2: number,
    quiz3: number,
    quiz4: number,
    quiz5: number,
    vote: number
  },
  gotPointFromVoteRecently: boolean
}