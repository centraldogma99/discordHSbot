import { Message, MessageEmbed } from "discord.js";
import { giveUserPoint } from "../tools/giveUserPoint";
import { checkUserVote } from "../tools/koreanbot/checkUserVote";
import { loadUserConfig } from "../tools/loadUserConfig";

const heartPoint = 5000;

async function me(message: Message) {
  let userConfig = await loadUserConfig(message.author);
  const voted = await checkUserVote(message.author.id);
  if (voted) {
    await giveUserPoint(message.author.id, heartPoint);
    userConfig = await loadUserConfig(message.author);
  }
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`**${message.author.tag} 의 정보**`)
    .setDescription('You can earn contribution points by taking quiz.')
    .setThumbnail(message.author.avatarURL())
    .addFields(
      { name: '\u200B', value: '\u200B' },
      { name: "Number of quiz answered", value: `${userConfig.stats.quiz1}`, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: "Total points", value: `${userConfig.stats.point}`, inline: true },
    )
  // .addField("\u200B", "[🔗 한국 디스코드봇 리스트!](https://koreanbots.dev/bots/868188628709425162)")
  // .addField("위 링크에서 하트❤️를 누르면 기여도 5000을 받을 수 있어요!", "하트는 12시간마다 누를 수 있으니 많은 성원 부탁드립니다.")
  await message.channel.send({ embeds: [embed] });
  return;
}

module.exports = {
  name: ["me", "mypage", "point", "contribution"],
  description: "me",
  execute: me
}