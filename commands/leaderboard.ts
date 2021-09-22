import { MessageEmbed } from "discord.js";
import mongo from "../db";

async function leaderboard(message){
  let users = await mongo.userModel.find({}).exec();
  users = users.sort((f, s) => f.stats.point - s.stats.point);
  let embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`**리더보드(KR)**`)
    .setDescription('퀴즈를 풀거나 하트를 눌러 기여도를 획득할 수 있어요.');
  
  let i = 0;
  for(const user of users){
    i++;
    if(i > 25) break;
    embed = embed.addFields(
      { name: '\u200B', value: `${i}.  **${user.tag}**  \`${user.stats.point}\``},
    )
  }
  await message.channel.send({embeds: [embed]});
}

module.exports = {
  name : ['리더보드', '점수표', '순위', '순위표', '랭킹'],
  description : 'leaderboard',
  execute : leaderboard
}