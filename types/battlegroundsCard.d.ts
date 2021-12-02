export interface battlegroundsCard {
  alias: string;
  name: string;
  image: string;
  imageGold: string;
  childIds: number[];
  rarityId: number;
  tier: number | string;
  classId: number;
  text: string;
  health: number;
  attack: number;
  minionTypeId: number;
}
