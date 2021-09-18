import { Message, MessageEmbed } from "discord.js";
import { giveUserPoint } from "../tools/giveUserPoint";
import { checkUserVote } from "../tools/koreanbot/checkUserVote";
import { loadUserConfig } from "../tools/loadUserConfig";

const heartPoint = 5000;

async function me(message: Message){
  let userConfig = await loadUserConfig(message.author.id);
  const voted = await checkUserVote(message.author.id);
  if(voted) {
    await giveUserPoint(message.author.id, heartPoint);
    userConfig = await loadUserConfig(message.author.id);
  }
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`**${message.author.tag} 의 정보**`)
    .setDescription('퀴즈를 풀거나 하트를 눌러 기여도를 획득할 수 있어요.')
    .setThumbnail(message.author.avatarURL())
    .addFields(
      { name: '\u200B', value: '\u200B' },
      { name: "퀴즈 정답 횟수", value: `${userConfig.stats.quiz1}`, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: "총 기여도", value: `${userConfig.stats.point}`, inline: true },
    )
    .addField("\u200B", "[🔗 한국 디스코드봇 리스트!](https://koreanbots.dev/bots/868188628709425162)")
    .addField("위 링크에서 하트❤️를 누르면 기여도 5000을 받을 수 있어요!", "하트는 12시간마다 누를 수 있으니 많은 성원 부탁드립니다.")
  await message.channel.send({embeds: [embed]});
  return;
}

module.exports = {
  name: ["나", "내정보", "마이페이지", "기여도", "포인트"],
  description: "me",
  execute: me
}