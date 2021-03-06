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
        `π‘ μ΄ μΉ΄λλ **${translateToKor(
          rarity,
          card.rarityId
        )}** λ±κΈ μΉ΄λ μλλ€.`, // μ μ€/ν¬κ·/νΉκΈ/μΌλ°...
        `π‘ λμ΄μ°κΈ°λ **${(() => {
          let r = "";
          for (let i = 0; i < card.name.length; i++) {
            if (card.name[i] != " ") r = r.concat("O");
            else r = r.concat(" ");
          }
          return r;
        })()}** μλλ€.`,
        (() => {
          const r = translateToKor(cardSet, card.cardSetId);
          if (r) {
            return `π‘ μ΄ μΉ΄λλ **${r}** μΉ΄λμλλ€.`;
          } else {
            return `π‘ μ΄ μΉ΄λλ **κ³ μ ** μΉ΄λμλλ€.`;
          }
        })(),
        (() => {
          if (card.multiClassIds?.length >= 2) {
            return `π‘ μ΄ μΉ΄λλ **μ΄μ€ μ§μ** μΉ΄λμλλ€.`;
          }
          if (card.classId) {
            if (card.classId == 12) {
              return `π‘ μ΄ μΉ΄λλ **μ€λ¦½** μΉ΄λμλλ€.`;
            }
            return `π‘ μ΄ μΉ΄λλ **${translateToKor(class_, card.classId)[0]
              }** μΉ΄λμλλ€.`;
          }
        })(),
        `π‘ μ΄ μΉ΄λλ **${translateToKor(cardType, card.cardTypeId)}** μλλ€.`, // μ£Όλ¬Έ/νμμΈ/μμλ³μ /λ¬΄κΈ°
      ],
      (() => {
        if (card.cardTypeId == 4)
          return [
            `π‘ μ΄ μΉ΄λμ μ€ν―μ **${card.manaCost}μ½μ€νΈ, ${card.attack}/${card.health}** μλλ€.`,
            (() => {
              if (card.minionTypeId) {
                return `π‘ μ΄ μΉ΄λμ μ’μ‘±κ°μ **${translateToKor(
                  minionType,
                  card.minionTypeId
                )}** μλλ€.`;
              } else {
                return `π‘ μ΄ μΉ΄λλ μ’μ‘±κ°μ΄ μμ΅λλ€.`;
              }
            })(),
          ];
        else if (card.cardTypeId == 5)
          return [
            `π‘ μ΄ μΉ΄λμ μ£Όλ¬Έ μμ±μ **${translateToKor(spellSchool, card.spellSchoolId) ?? "λ¬΄μμ±"
            }** μλλ€.`,
          ];
        else if (card.cardTypeId == 7)
          return [
            `π‘ μ΄ μΉ΄λμ κ³΅κ²©λ ₯/λ΄κ΅¬λλ **${card.attack}/${card.durability}** μλλ€.`,
          ];
      })(),
      [
        `π‘ μ²μ ${reslen}κΈμλ **\`${card.alias.slice(
          0,
          reslen
        )}\`**μλλ€.(λμ΄μ°κΈ° λ¬΄μ)`,
        `π‘ λ§μ§λ§ ${reslen}κΈμλ **\`${card.alias.slice(
          len - reslen
        )}\`**μλλ€.(λμ΄μ°κΈ° λ¬΄μ)`,
        card.text == ""
          ? `π‘ μ΄ μΉ΄λλ μΉ΄λ νμ€νΈκ° μμ΅λλ€.`
          : `π‘ **μΉ΄λ νμ€νΈ ννΈ**  _${card.text
            .replace(/<\/?[^>]+(>|$)/g, "")
            .slice(0, Math.floor(card.text.length / 2))}..._ (νλ΅)`,
        {
          content: `π‘ μ΄ μΉ΄λμ μΌλ¬μ€νΈμ μΌλΆλΆμλλ€.`,
          files: croppedImage,
        },
      ],
    ];
  }

  async getHint() {
    if (this.level === 3) {
      return this.message.channel.send("βΌοΈ ννΈλ₯Ό λͺ¨λ μ¬μ©νμ΅λλ€.");
    }
    while (this.hints[this.level].length === 0) {
      this.level++;
      if (this.level >= 3) {
        return this.message.channel.send("βΌοΈ ννΈλ₯Ό λͺ¨λ μ¬μ©νμ΅λλ€.");
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