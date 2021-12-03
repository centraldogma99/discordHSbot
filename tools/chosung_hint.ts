import { Message } from "discord.js";
import { Card } from "../types/card";
import generateQuiz from "./generateQuiz";
import rarity from "../tools/jsons/rarity.json";
import cardSet from "../tools/jsons/cardset.json";
import class_ from "../tools/jsons/class.json";
import minionType from "../tools/jsons/minionType.json";
import spellSchool from "../tools/jsons/spellSchool.json";
import cardType from "../tools/jsons/cardType.json";

function translateToKor(json: any[], id: number | string) {
  return json.filter((e) => e.id === id)[0]?.nameKor;
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export default class Hint {
  message: Message;
  card: Card;
  level: number;
  hints: any[][];
  constructor(message: Message, card: Card) {
    this.message = message;
    this.card = card;
    this.level = 0;
    const len = card.alias.length;
    const reslen = Math.floor(len / 3) == 0 ? 1 : Math.floor(len / 2.5);
    const croppedImage = generateQuiz(card.image, 3);

    this.hints = [
      [
        `💡 이 카드는 **${translateToKor(
          rarity,
          card.rarityId
        )}** 등급 카드 입니다.`, // 전설/희귀/특급/일반...
        `💡 띄어쓰기는 **${(() => {
          let r = "";
          for (let i = 0; i < card.name.length; i++) {
            if (card.name[i] != " ") r = r.concat("O");
            else r = r.concat(" ");
          }
          return r;
        })()}** 입니다.`,
        (() => {
          const r = translateToKor(cardSet, card.cardSetId);
          if (r) {
            return `💡 이 카드는 **${r}** 카드입니다.`;
          } else {
            return `💡 이 카드는 **고전** 카드입니다.`;
          }
        })(),
        (() => {
          if (card.multiClassIds?.length >= 2) {
            return `💡 이 카드는 **이중 직업** 카드입니다.`;
          }
          if (card.classId) {
            if (card.classId == 12) {
              return `💡 이 카드는 **중립** 카드입니다.`;
            }
            return `💡 이 카드는 **${translateToKor(class_, card.classId)[0]
              }** 카드입니다.`;
          }
        })(),
        `💡 이 카드는 **${translateToKor(cardType, card.cardTypeId)}** 입니다.`, // 주문/하수인/영웅변신/무기
      ],
      (() => {
        if (card.cardTypeId == 4)
          return [
            `💡 이 카드의 스탯은 **${card.manaCost}코스트, ${card.attack}/${card.health}** 입니다.`,
            (() => {
              if (card.minionTypeId) {
                return `💡 이 카드의 종족값은 **${translateToKor(
                  minionType,
                  card.minionTypeId
                )}** 입니다.`;
              } else {
                return `💡 이 카드는 종족값이 없습니다.`;
              }
            })(),
          ];
        else if (card.cardTypeId == 5)
          return [
            `💡 이 카드의 주문 속성은 **${translateToKor(spellSchool, card.spellSchoolId) ?? "무속성"
            }** 입니다.`,
          ];
        else if (card.cardTypeId == 7)
          return [
            `💡 이 카드의 공격력/내구도는 **${card.attack}/${card.durability}** 입니다.`,
          ];
      })(),
      [
        `💡 처음 ${reslen}글자는 **\`${card.alias.slice(
          0,
          reslen
        )}\`**입니다.(띄어쓰기 무시)`,
        `💡 마지막 ${reslen}글자는 **\`${card.alias.slice(
          len - reslen
        )}\`**입니다.(띄어쓰기 무시)`,
        card.text == ""
          ? `💡 이 카드는 카드 텍스트가 없습니다.`
          : `💡 **카드 텍스트 힌트**  _${card.text
            .replace(/<\/?[^>]+(>|$)/g, "")
            .slice(0, Math.floor(card.text.length / 2))}..._ (후략)`,
        {
          content: `💡 이 카드의 일러스트의 일부분입니다.`,
          files: croppedImage,
        },
      ],
    ];
  }

  async getHint() {
    if (this.level === 3) {
      return this.message.channel.send("‼️ 힌트를 모두 사용했습니다.");
    }
    while (this.hints[this.level].length === 0) {
      this.level++;
      if (this.level >= 3) {
        return this.message.channel.send("‼️ 힌트를 모두 사용했습니다.");
      }
    }

    let currentHint = this.hints[this.level];
    if (this.level == 1) {
      for (const [k, v] of currentHint) {
        if (k == this.card.cardTypeId) {
          currentHint = v;
        }
      }
    }
    const i = getRandomInt(currentHint.length);
    const res = currentHint.splice(i, 1)[0];

    if (typeof res === "string") {
      this.message.channel.send(res);
    } else if (typeof res === "object") {
      const files = await res.files;
      this.message.channel.send({
        content: res.content,
        files: [files.croppedImage],
      });
    }
  }
}