import { cardClass } from "../types/cardClass";
import translateClass from "./jsons/class.json";

export function tokenizer(msgContent: string) {
  const prefix = "!";

  if (!msgContent) throw Error("NoContent");
  const ret: {
    mention?: string;
    class_?: cardClass;
    command?: string;
    args?: string;
  } = {};
  let msgContentSplit = msgContent.trim().split(/ +|\t+/);
  let mention: string;

  if (msgContentSplit[0].startsWith("<@") && msgContentSplit[0].endsWith(">")) {
    mention = msgContentSplit[0].slice(2, -1);
    if (mention.startsWith("!")) {
      mention = mention.slice(1);
    }
  }

  ret["mention"] = mention;

  msgContentSplit = msgContentSplit.slice(1);
  let resClass: cardClass;
  let command: string;
  if (msgContentSplit.length == 0) {
    return ret;
  }
  if (
    ((msgContentSplit[0].startsWith('"') ||
      msgContentSplit[0].startsWith("“") ||
      msgContentSplit[0].startsWith("”") ||
      msgContentSplit[0].startsWith("'")) &&
      (msgContentSplit[0].endsWith('"') || msgContent[0].endsWith("“"))) ||
    msgContentSplit[0].endsWith("”") ||
    msgContentSplit[0].endsWith("'")
  ) {
    const korClass = msgContentSplit[0].substring(
      1,
      msgContentSplit[0].length - 1
    );

    for (const cls of translateClass) {
      if (cls.nameKor.includes(korClass)) resClass = cls;
    }
    if (!resClass) throw Error("WrongClass");
    ret["class_"] = resClass;
    msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
  }
  if (msgContentSplit.length == 0) {
    return ret;
  }
  if (msgContentSplit[0].startsWith(prefix)) {
    command = msgContentSplit[0].substring(1);
    msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
  }
  ret["command"] = command;
  if (msgContentSplit.length == 0) {
    return ret;
  }
  const args = msgContentSplit.join(" ");
  ret["args"] = args;
  return ret;
}
