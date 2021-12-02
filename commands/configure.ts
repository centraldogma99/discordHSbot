import {
  Message,
  MessageActionRow,
  MessageActionRowComponent,
  MessageButton,
  User,
} from "discord.js";
import { userModel } from "../db";
import loadUserConfig from "../tools/loadUserConfig";

async function addConfig(messageAuthor: User, fieldName: string, value: any) {
  const query = userModel.findOne({ id: messageAuthor.id });
  try {
    const user = await query.exec();
    return user.updateOne({ [fieldName]: value }).exec();
  } catch (e) {
    return await userModel.insertMany([
      {
        id: messageAuthor.id,
        tag: messageAuthor.tag,
        [fieldName]: value,
      },
    ]);
  }
}

async function configure(message: Message) {
  const userConfig = await loadUserConfig(message.author);

  // 게임모드 설정 시작
  const gameModeButtons = [
    new MessageButton()
      .setCustomId("standard")
      .setLabel("정규")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setCustomId("wild")
      .setLabel("야생")
      .setStyle("SECONDARY"),
    new MessageButton()
      .setCustomId("battlegrounds")
      .setLabel("전장")
      .setStyle("SECONDARY"),
  ];
  for (const button of gameModeButtons) {
    if (button.customId == userConfig.gameMode) {
      button.setStyle("PRIMARY");
      button.setDisabled(true);
      break;
    }
  }
  await message.channel.send(
    `**${message.author.username}#${message.author.discriminator}가 설정 중...**`
  );
  const row1 = new MessageActionRow().addComponents(gameModeButtons);
  const gameModeMsg = await message.channel.send({
    content: `**⚙️ 게임모드 설정**  *\`정규\`로 설정시 야생 카드는 검색되지 않습니다.*`,
    components: [row1],
  });
  const gameModeMsgCollector = gameModeMsg.createMessageComponentCollector({
    componentType: "BUTTON",
    time: 30000,
  });
  gameModeMsgCollector.on("collect", async (i) => {
    if (i.user.id != message.author.id) return;
    await addConfig(
      message.author,
      "gameMode",
      (i.component as MessageActionRowComponent).customId
    );
    await i.update({
      content: `☑️ ${message.author.username}#${message.author.discriminator
        }님의 게임모드가 "${(i.component as any).label}"(으)로 설정되었습니다.`,
      components: [],
    });
    gameModeMsgCollector.stop("done");
  });
  gameModeMsgCollector.on("end", async (_, r) => {
    if (r == "time") await gameModeMsg.delete().catch(console.log);
  });
  // 게임모드 설정 끝

  // 황금 설정 시작
  // let goldenCardModeButtons = [
  //   new MessageButton()
  //     .setCustomId('false')
  //     .setLabel('일반')
  //     .setStyle('SECONDARY'),
  //   new MessageButton()
  //     .setCustomId('true')
  //     .setLabel('황금')
  //     .setStyle('SECONDARY'),
  // ];
  // for (const button of goldenCardModeButtons){
  //   if ((button.customId === 'true') == userConfig.goldenCardMode){
  //     button.setStyle("PRIMARY");
  //     button.setDisabled(true);
  //     break;
  //   }
  // }

  // const row3 = new MessageActionRow().addComponents(goldenCardModeButtons);
  // let goldenCardModeMsg = await message.channel.send({
  //   content: '⚙️ 황금카드 설정(황금카드 이미지가 없으면 일반 카드로 검색됩니다.)',
  //   components: [row3]
  // });
  // let goldenCardModeMsgCollector = goldenCardModeMsg.createMessageComponentCollector({ componentType: 'BUTTON', time: 30000 });
  // goldenCardModeMsgCollector.on('collect', async i => {
  //   if ( i.user.id != message.author.id ) return;
  //   await addConfig(message.author.id, "goldenCardMode", (i.component as MessageActionRowComponent).customId === 'true')
  //   await i.update({ content: `☑️ ${message.author.username}#${message.author.discriminator}님의 황금카드모드가 "${(i.component as any).label}"으로 설정되었습니다.`, components: [] })
  //   goldenCardModeMsgCollector.stop("done");
  // })
  // goldenCardModeMsgCollector.on('end', (_, r) => {
  //   if(r == 'time') {
  //     goldenCardModeMsg.delete().catch(console.log);
  //     firstMsg.delete().catch(console.log);
  //   }
  // })
  // 황금 설정 끝

  // 페이지 설정 시작
  const pageMenuButton = new MessageButton()
    .setCustomId("pageMenu")
    .setStyle("PRIMARY")
    .setLabel("페이지 설정");
  const row2 = new MessageActionRow().addComponents(pageMenuButton);
  const pageMsg = await message.channel.send({
    content: `**⚙️ 페이지 설정**  *한 페이지당 표시되는 카드 수를 설정합니다(1 ~ 9).*\n현재 설정 : \`${userConfig.paginateStep}\``,
    components: [row2],
  });
  const pageMsgCollector = pageMsg.createMessageComponentCollector({
    componentType: "BUTTON",
    time: 30000,
  });
  pageMsgCollector.on("collect", async (i) => {
    if (i.user.id != message.author.id) return;
    await i.update({
      content: `⚙️ 설정할 \`페이지\`를 채팅으로 입력해 주세요(1 ~ 9).  현재 설정 : \`${userConfig.paginateStep}\``,
      components: [],
    });
    const messageCollector = message.channel.createMessageCollector({
      time: 30000,
    });
    messageCollector.on("collect", async (m) => {
      if (
        isNaN(m.content as any) ||
        parseInt(m.content) < 1 ||
        parseInt(m.content) > 9
      ) {
        messageCollector.stop("wrongValue");
        return;
      } else {
        await addConfig(message.author, "paginateStep", parseInt(m.content));
        messageCollector.stop("answered");
        return;
      }
    });
    messageCollector.on("end", async (m, r) => {
      if (r == "answered") {
        await message.channel.send(
          `☑️ ${message.author.username}#${message.author.discriminator
          }님의 \`페이지\`가 \`${m.first().content}\` (으)로 설정되었습니다.`
        );
        pageMsg.delete().catch(console.log);
      } else if (r == "time") {
        message.channel.send(`？ 입력 시간이 초과되었습니다.`);
      } else if (r == "wrongValue") {
        message.channel.send("‼️ 잘못된 값이 입력되었습니다.");
      }
    });
  });
  pageMsgCollector.on("end", async (_, r) => {
    if (r == "time") await pageMsg.delete().catch(console.log);
  });
  // 페이지 설정 끝
}
export = {
  name: ["설정"],
  description: "configure",
  execute: configure,
};
