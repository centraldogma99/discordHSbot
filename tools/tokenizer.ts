import Condition from '../types/condition';
import translateClass from '../languages/kor/class.json';
import client from '../app';
import Tokens from "../types/Tokens"


// 따옴표로 둘러싸여 있는가?
function isCondition(contentSplit: string) {
  if (!contentSplit) return false;
  return ((contentSplit.startsWith('"') || contentSplit.startsWith('“') || contentSplit.startsWith('”') || contentSplit.startsWith("'"))
    && (contentSplit.endsWith('"') || contentSplit.endsWith('“') || contentSplit.endsWith('”') || contentSplit.endsWith("'")))
}

// string 조각들을 받아서 Condition[] 오브젝트로 변환
function parseConditions(conditions: string[]): Condition {
  // 지금은 직업 조건만 parse하도록 되어 있음.
  let ret: Condition = {};

  function isValidClass(condition: string) {
    if (translateClass.map(c => c.name).includes(condition)) return true;
    else return false;
  }
  // 추후의 class 외의 조건을 판단할 함수를 이곳에 추가할 수 있다.

  conditions.forEach(condition => {
    condition = condition.toLowerCase();
    if (isValidClass(condition)) {
      const retcls = translateClass.filter(cls => cls.name === condition)[0];
      if (!retcls) throw Error("WrongClass")
      ret.class_ = retcls;
    }
    // 추후에 class 외의 조건을 이곳에 추가할 수 있다.
    // else if (isMana(condition)){ ... }
  })

  return ret;
}


// 조건이 있는 경우
// ."사제" 나자크
// ."전사" 이름 밀쳐내기
// .이름 "전사" 밀쳐내기
// .이름 방패 "전사" 밀쳐내기 (X) .... 4
// .이름 방패 밀쳐내기 "전사" (O)
//
// 조건이 없는 경우
// .나자크
// .모든 라그나로스
export function tokenizerRecursive(
  msgContentSplit: string[],
  status: { condition?: Condition, command?: string, args?: string[] },
  prev: string
): Tokens {
  // 4번 구문 무시
  // if (status.condition && status.command && status.args) return status;
  // status가 꽉 차지 않았어도 분석을 마쳤다면 종료
  if (msgContentSplit.length === 0) return status;

  let ret = [];
  // guaranteed to have non-null @msgContentSplit
  if (isCondition(msgContentSplit[0])) {
    if (!status.condition) {
      let rawConditions = msgContentSplit[0].slice(1, msgContentSplit[0].length - 1);
      const condition = parseConditions(rawConditions.split(/ +|\t+/));
      return tokenizerRecursive(msgContentSplit.slice(1), { ...status, condition: condition }, 'condition');
    } else {
      throw Error("MultipleConditions")
    }
  } else {
    if (!status.command) {
      // 존재하는 command인지?
      if (!client.commands.has(msgContentSplit[0])) {
        // 명령어 없음(카드 이름만 있음)
        if (prev != 'arg' && status.args && status.args.length > 0) throw Error("WrongUsage") // arg가 흩뿌려져 있는 경우.
        return tokenizerRecursive(msgContentSplit.slice(1),
          { ...status, command: "", args: status.args ? [...status.args, msgContentSplit[0]] : [msgContentSplit[0]] },
          'arg')
      } else {
        // 명령어 있음
        return tokenizerRecursive(msgContentSplit.slice(1),
          { ...status, command: msgContentSplit[0] },
          'command')
      }
    } else {
      if (prev != 'arg' && status.args && status.args.length > 0) throw Error("WrongUsage")
      // 일반 argument 인 경우
      return tokenizerRecursive(
        msgContentSplit.slice(1),
        { ...status, args: status.args ? [...status.args, msgContentSplit[0]] : [msgContentSplit[0]] },
        'arg'
      )
    }
  }
}

export function tokenizer(msgContent: string): Tokens {
  const msgContentSplit = msgContent.trim().slice(1).trim().split(/\s+/);
  return tokenizerRecursive(msgContentSplit, {}, '')
}