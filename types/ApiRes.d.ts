import { Card } from "./card"

export interface ApiResParent {
  cardCount: number,
  pageCount: number,
  page: number,
}

export default interface ApiRes extends ApiResParent {
  cards: Card[]
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