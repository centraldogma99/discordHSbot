import { Card } from "./card";
import { cardClass } from "./cardClass";

export interface searchInfo {
  class_?: cardClass,
  tier?: string | number,
  fromDefault?: boolean,
  card?: Card
}