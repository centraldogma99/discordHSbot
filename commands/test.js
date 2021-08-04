const { default: axios } = require('axios');
const { MessageEmbed } = require('discord.js');
const mongo = require("../db");

async function test(message, args){
  let res = await mongo.userModel.findOne({name:"Osol2#7777"}).exec()
  console.log(res);
}

module.exports = {
  name: "테스트",
  description: "test",
  execute: test
}