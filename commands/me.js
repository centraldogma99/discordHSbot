const { MessageEmbed } = require("discord.js");
const giveUserPoint = require("../tools/giveUserPoint");
const isUserRegistered = require("../tools/isUserRegistered");
const checkUserVote = require("../tools/koreanbot/checkUserVote");
const loadUserConfig = require("../tools/loadUserConfig")

async function me(message){
  const userConfig = await loadUserConfig(message.author.id);
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`**${message.author.tag} 의 정보**`)
    .setDescription('퀴즈 횟수와 기여도')
    .setThumbnail(message.author.avatarURL())
    .addFields(
      { name: '\u200B', value: '\u200B' },
      { name: "퀴즈 정답 횟수", value: `${userConfig.stats.quiz5}`, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: "총 기여도", value: `${userConfig.stats.point}`, inline: true },
    )
  await message.channel.send({embeds: [embed]});
  return;
}

module.exports = {
  name: ["나"],
  description: "me",
  execute: me
}