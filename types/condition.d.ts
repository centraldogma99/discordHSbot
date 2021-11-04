import { cardClass } from "./cardClass"
import { cardMana, cardTier } from "./cardSpecs"
type condition = cardClass | cardMana;
// could be expanded like
// type condition = cardClass | cardMana | ...

interface conditionObj {
  class_?: cardClass,
  mana?: cardMana,
  tier?: cardTier
}

