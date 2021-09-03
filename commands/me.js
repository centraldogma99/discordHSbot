const { MessageEmbed } = require("discord.js");
const loadUserConfig = require("../tools/loadUserConfig")

async function me(message){
  const userConfig = await loadUserConfig(message.author.id);
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`**${message.author.tag} 의 정보**`)
    .setThumbnail(message.author.avatarURL())
    .addFields(
      { name: "1단계 퀴즈 정답 횟수", value: `${userConfig.stats.quiz1}` },
      { name: "2단계 퀴즈 정답 횟수", value: `${userConfig.stats.quiz2}` },
      { name: "3단계 퀴즈 정답 횟수", value: `${userConfig.stats.quiz3}` },
      { name: "4단계 퀴즈 정답 횟수", value: `${userConfig.stats.quiz4}` },
      { name: "5단계 퀴즈 정답 횟수", value: `${userConfig.stats.quiz5}` },
      { name: "총 기여도", value: `${userConfig.stats.point}` },
    )
  await message.channel.send({embeds: [embed]});
  return;
}

module.exports = {
  name: ["나"],
  description: "me",
  execute: me
}