/*
  return user config if it exists
  or, initialize user config(register)
*/

import { User } from "discord.js";
import { userModel } from "../db";

export default async function loadUserConfig(user: User) {
  let userInDb = await userModel.findOne({ id: user.id }).exec();
  if (!userInDb) {
    await userModel.insertMany([
      {
        id: user.id,
        tag: user.tag,
      },
    ]);
    return userModel.findOne({ id: user.id }).exec();
  } else {
    // 유저 태그가 변경된 경우
    if (userInDb.tag != user.tag || userInDb.tag === undefined) {
      userInDb.tag = user.tag;
      userInDb = await userInDb.save();
    }
    return userInDb;
  }
}
