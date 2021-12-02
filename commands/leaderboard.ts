import { MessageEmbed } from "discord.js";
import { userModel } from "../db";

const numOfRanks = 15;

async function leaderboard(message) {
  let users = await userModel.find({}).exec();
  users = users.sort((f, s) => s.stats.point - f.stats.point);
  let embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(`**여관주인 리더보드(KR)**`)
    .setDescription(
      "퀴즈를 풀거나 아래 링크에서 하트를 눌러 기여도를 획득할 수 있어요.\n배틀태그가 표시되지 않는다면 `@여관주인 !나`를 사용한 후에 다시 시도해 주세요.\n[🔗 한국 디스코드봇 리스트!](https://koreanbots.dev/bots/868188628709425162)"
    );

  let i = 0;
  let str = "";
  for (const user of users) {
    i++;
    str += `${i}. **${user.tag === "" ? "돌붕이" : user.tag}** \`${user.stats.point
      }\`\n`;
    if (i === numOfRanks) break;
  }
  embed = embed.addFields({ name: "\u200B", value: str });
  await message.channel.send({ embeds: [embed] });
}

export = {
  name: ["리더보드", "점수표", "순위", "순위표", "랭킹"],
  description: "leaderboard",
  execute: leaderboard,
};
