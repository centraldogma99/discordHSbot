export interface Card {
  alias: string,
  name: string,
  image: string,
  imageGold?: string,
  childIds?: number[],
  rarityId: number,
  manaCost: number,
  cardSetId: number,
  classId: number,
  cardTypeId: number,
  health?: number,
  attack?: number,
  durability?: number,
  text: string,
  minionTypeId?: number,
  spellSchoolId?: number,
  multiClassIds: number[]
}

