import childs from "./childs";
import getMostMatchingCard from "../tools/getMostMatchingCard";
import loadUserConfig from "../tools/loadUserConfig";
import { Message, MessageActionRow, MessageButton } from "discord.js";
import { searchInfo } from "../types/searchInfo";

async function defaultAction(message: Message, args: string, info: searchInfo) {
  const searchingMessage = await message.channel.send("๐ ๊ฒ์ ์ค์๋๋ค...");
  await message.channel.sendTyping().catch(console.log);
  const userConfig = await loadUserConfig(message.author);

  const resCard = await getMostMatchingCard(
    args,
    userConfig.gameMode,
    info?.class_
  );
  if (!resCard) {
    message.channel.send(
      "โผ๏ธ ๊ฒ์ ๊ฒฐ๊ณผ๊ฐ ์์ต๋๋ค! ์คํ, ๋์ด์ฐ๊ธฐ๋ฅผ ๋ค์ ํ์ธํด ์ฃผ์ธ์."
    );
    return;
  }

  const targetImage = resCard.image;

  const msgObj: { files: string[]; components?: MessageActionRow[] } = {
    files: [targetImage],
  };
  searchingMessage.delete().catch(console.log);

  if (resCard.childIds.length > 0) {
    const btn = new MessageButton()
      .setCustomId("primary")
      .setLabel("๊ด๋ จ ์นด๋ ๋ณด๊ธฐ")
      .setStyle("PRIMARY");
    const row = new MessageActionRow().addComponents(btn);
    msgObj.components = [row];
    const msg = await message.channel.send(msgObj);
    const buttonCollector = msg.createMessageComponentCollector({
      componentType: "BUTTON",
      time: 20000,
      max: 1,
    });
    buttonCollector.on("collect", async (i) => {
      await i.update({
        content: "โ๏ธ  ๊ด๋ จ ์นด๋๋ฅผ ๊ฐ์ ธ์ต๋๋ค...",
        components: [],
      });
      await childs.execute(message, args, { fromDefault: true, card: resCard });
    });
    buttonCollector.on("end", async (_, r) => {
      if (r == "time") await msg.delete().catch(console.log);
    });
  } else {
    await message.channel.send(msgObj);
  }
}

export = {
  name: ["defaultAction"],
  description: "defaultAction",
  execute: defaultAction,
};
