export interface CardParent {
  alias: string,
  name: string,
  image: string,
  imageGold?: string,
  childIds?: number[],
  rarityId: number,
  classId: number,
  text: string,
  health: number,
  attack: number,
  minionTypeId: number
}

export interface Card extends CardParent {
  manaCost: number,
  cardSetId: number,
  cardTypeId: number,
  durability?: number,
  spellSchoolId?: number,
  multiClassIds: number[]
}