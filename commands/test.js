const { default: axios } = require('axios');
const { MessageEmbed } = require('discord.js');
const mongo = require("../db");

async function test(message, args){
  if(`${message.author.username}#${message.author.discriminator}` == "Osol2#7777"){
    mongo.userModel.remove({}).exec();
  } else {
    message.channel.send("안녕!")
  }
}

module.exports = {
  name: ["테스트"],
  description: "test",
  execute: test
}