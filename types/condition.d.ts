import { cardClass } from "./cardClass"
import { cardMana, cardTier } from "./cardSpecs"
type condition = cardClass | cardMana;
// could be expanded like
// type condition = cardClass | cardMana | ...

export default interface Condition {
  class_?: cardClass,
  mana?: cardMana,
  tier?: cardTier
}

