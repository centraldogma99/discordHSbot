export interface BattlenetAPICard {
  id: number,
  collectible: number,
  slug: string,
  classId: number,
  multiClassIds: number[],
  spellSchoolId: number,
  cardTypeId: number,
  cardSetId: number,
  rarityId?: number,
  artistName?: string,
  manaCost: number,
  name: string,
  text?: string,
  health?: number,
  attack?: number,
  armor?: number,
  durability?: number,
  minionTypeId?: number,
  image: string,
  imageGold: string,
  flavorText: string,
  cropImage: string,
  childIds: number[],
  keywordIds: number[],
  duels?: {
    relevant: boolean,
    constructed: boolean
  }
  battlegrounds?: {
    tier: number,
    hero: boolean,
    upgradeId: number,
    image: string,
    imageGold: string,
  }
}

export interface BattlenetAPIDeckListRes {
  hero: {
    id: number,
    image: string,
  },
  class: {
    name: string,
    id: number
  },
  cards: BattlenetAPICard[],
}

export interface BattlenetAPIRes {
  cards: [BattlenetAPICard],
  cardCount: number,
  pageCount: number,
  page: number
}