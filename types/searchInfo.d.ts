import { Card } from "./card";
import { cardClass } from "./cardClass";
import Condition from "./condition"

export interface searchInfo {
  conditions?: Condition,
  fromDefault?: boolean,
  card?: Card
}