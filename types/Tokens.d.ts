import Condition from "./condition"

export default interface Tokens {
  condition?: Condition,
  command?: string,
  args?: string[]
}