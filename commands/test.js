const { default: axios } = require('axios');
const { MessageEmbed } = require('discord.js');
const mongo = require("../db");

async function test(message, args){
  mongo.userModel.remove({}).exec();
}

module.exports = {
  name: "테스트",
  description: "test",
  execute: test
}