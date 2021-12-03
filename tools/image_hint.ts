import { Message } from "discord.js"
import { Card } from "../types/card"
import cho_hangul from "../tools/helpers/cho_Hangul";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export default function getRandomHint(message: Message, card: Card, hintUsed: boolean[]) {
  // 글자수, 처음/마지막 몇 글자, 텍스트의 절반
  if (hintUsed.reduce((f, s) => f && s)) return;
  let a = getRandomInt(4);
  let promise;
  while (hintUsed[a]) {
    a = getRandomInt(4);
  }
  if (a == 0) {
    const len = card.alias.length;
    const reslen = Math.floor(len / 3) == 0 ? 1 : Math.floor(len / 2.5);
    promise = message.channel.send(
      `💡 이 카드의 이름은 ${card.alias.length
      }글자이며, 처음 ${reslen}글자는 \`${card.alias.slice(
        0,
        reslen
      )}\`입니다.(띄어쓰기 무시)`
    );
  } else if (a == 1) {
    const len = card.alias.length;
    const reslen = Math.floor(len / 3) == 0 ? 1 : Math.floor(len / 2.5);
    promise = message.channel.send(
      `💡 이 카드의 이름은 ${card.alias.length
      }글자이며, 마지막 ${reslen}글자는 \`${card.alias.slice(
        card.alias.length - reslen
      )}\`입니다.(띄어쓰기 무시)`
    );
  } else if (a == 2) {
    if (!card.text || card.text.length == 0)
      promise = message.channel.send(`💡 이 카드는 카드 텍스트가 없습니다.`);
    else {
      const len = Math.floor(card.text.length / 2);
      promise = message.channel.send(
        `💡 **카드 텍스트 힌트**  _${card.text
          .replace(/<\/?[^>]+(>|$)/g, "")
          .slice(0, len)}..._ (후략)`
      );
    }
  } else if (a == 3) {
    promise = message.channel.send(
      `💡 이 카드의 초성은 \`${cho_hangul(card.alias)}\` 입니다.`
    );
  }
  return {
    promise: promise,
    hint: a,
  };
}