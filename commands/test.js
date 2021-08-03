const { default: axios } = require('axios');
const { MessageEmbed } = require('discord.js');

async function test(message, args, b){
  message.channel.send("hello, world!")
}

module.exports = {
  name: "테스트",
  description: "test",
  execute: test
}