import { MessageEmbed } from "discord.js";
import { userModel } from "../db";
import kor from "../languages/kor/leaderboard.json"
import eng from "../languages/eng/leaderboard.json"
import { loadUserConfig } from "../tools/loadUserConfig";
import commandsKor from "../languages/kor/commands.json"
import commandsEng from "../languages/eng/commands.json"
import { parseLang, parseLangArr } from "../languages/parseLang"

const numOfRanks = 15;

async function leaderboard(message) {
  const userConfig = await loadUserConfig(message.author);
  const lang = userConfig.languageMode === 'ko_KR' ? parseLang(kor) : parseLang(eng);

  let users = await userModel.find({}).exec();
  users = users.sort((f, s) => s.stats.point - f.stats.point);
  let embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(lang("LEADERBOARD-TITLE"))
    .setDescription(lang("LEADERBOARD-DESC"));

  let i = 0;
  let str = "";
  for (const user of users) {
    i++;
    str += `${i}. **${user.tag === "" ? lang("LEADERBOARD-UNKNOWN-BATTLETAG") : user.tag}** \`${user.stats.point}\`\n`
    if (i === numOfRanks) break;
  }
  embed = embed.addFields({ name: '\u200B', value: str });
  await message.channel.send({ embeds: [embed] });
}

module.exports = {
  name: [...parseLangArr(commandsKor)("LEADERBOARD"), ...parseLangArr(commandsEng)("LEADERBOARD")],
  description: 'leaderboard',
  execute: leaderboard
}