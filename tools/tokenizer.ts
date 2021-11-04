import { conditionObj } from '../types/condition';
import translateClass from './jsons/class.json';



function isCondition(contentSplit: string) {
  if (!contentSplit) return false;
  return ((contentSplit.startsWith('"') || contentSplit.startsWith('“') || contentSplit.startsWith('”') || contentSplit.startsWith("'"))
    && (contentSplit.endsWith('"') || contentSplit.endsWith('“') || contentSplit.endsWith('”') || contentSplit.endsWith("'")))
}

function parseConditions(conditions: string[]): conditionObj {
  let ret: conditionObj = {};

  function isValidClass(condition: string) {
    if (translateClass.map(class_ => class_.name).includes(condition)) return true;
    else return false;
  }
  // 추후의 class 외의 조건을 판단할 함수를 이곳에 추가할 수 있다.

  for (let condition of conditions) {
    condition = condition.toLowerCase();
    if (isValidClass(condition)) {
      const retcls = translateClass.filter(cls => cls.name === condition)[0];
      if (!retcls) throw Error("WrongClass")
      ret.class_ = retcls;
    }
    // 추후에 class 외의 조건을 이곳에 추가할 수 있다.
    // else if (isMana(condition)){ ... }
  }
  return ret;
}

function tokenizerRecursive(
  msgContentSplit: string[],
  status: { conditions: conditionObj, command: string }
) {
  let ret = [];
  // guaranteed to have non-null @msgContentSplit
  if (isCondition(msgContentSplit[0])) {
    if (!status.conditions) {
      let rawConditions = msgContentSplit[0].slice(1, msgContentSplit[0].length - 1);
      const conditions = parseConditions(rawConditions.split(/ +|\t+/));
      return tokenizerRecursive(msgContentSplit.slice(1), { conditions: conditions, command: status.command });
    } else {
      throw Error("MultipleConditions")
    }
  } else {
    if (!status.command) {
      return tokenizerRecursive(msgContentSplit.slice(1), { conditions: status.conditions, command: msgContentSplit[0] })
    } else {
      return { conditions: status.conditions, command: status.command }
    }
  }
}

export function tokenizer(msgContent: string): { conditions?: conditionObj, command?: string, arg: string } {
  if (!msgContent) throw Error("NoContent");

  let content = msgContent.trim();
  let rawConditions: string[];

  // defaultAction
  if (content.startsWith('..')) return { arg: content.slice(2) };

  content = content.slice(1).trim();
  const conditionRegex = /^["“”']/;
  const conditionRegex2 = /["“”']/;
  let quoteClosed = false, quoteClosedIndex = 0;
  if (conditionRegex.test(content)) {
    for (let i = 1; i < content.length; i++) {
      if (conditionRegex2.test(content[i])) {
        quoteClosed = true;
        quoteClosedIndex = i;
        break;
      }
    }
    rawConditions = content.slice(1, quoteClosedIndex).split(/ +|\t+/);
    content = content.slice(quoteClosedIndex).trim()
  }
  const parsedConditions = parseConditions(rawConditions);
  let idx = / |\t/.exec(content).index;
  const command = content.slice(0, idx);
  content = content.slice(idx).trim();
  idx = / |\t/.exec(content).index;
  const arg = content.slice(/ /.exec(content).index)
  const tokens = tokenizerRecursive(msgContentSplit, { conditions: null, command: null });

  const arg = content.slice(match.index);

  return { conditions: tokens.conditions, command: tokens.command, arg: arg }
}