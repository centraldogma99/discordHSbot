import { Card } from "./card"

export default interface ApiRes {
  cards: Card[],
  cardCount: number,
  pageCount: number,
  page: number
}

export interface ApiResDeckCode {
  deckCode: string,
  hero: {
    image: string,
  },
  class: {
    slug: string,
    id: number,
    name: string
  },
  cards: Card[],
  cardCount: number
}