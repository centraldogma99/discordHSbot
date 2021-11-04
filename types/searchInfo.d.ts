import { Card } from "./card";
import { cardClass } from "./cardClass";
import { conditionObj } from "./condition"

export interface searchInfo {
  conditions?: conditionObj,
  fromDefault?: boolean,
  card?: Card
}