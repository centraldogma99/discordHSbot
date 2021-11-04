import { Message } from "discord.js";

function howto(message: Message) {
  const str =
    'ℹ️ Innkeeper is a discord bot that provides card search and quiz function.\n\
Developer : Osol2#7777\n\
\n\
🔍 **You can use commands after our prefix .(dot)**\n\
\n\
🔍 Search commands\n\
`.[keyword]`              Search a card with a name that most matches with the keyword.\n\
`name [keyword]`     Search all cards that have [keyword] in its **name**.\n\
`token [keyword]`     Search token cards of a card that matches [keyword].\n\
`all [keyword]`     Search all cards [검색어]가 들어간 모든 카드를 검색합니다(카드 텍스트 포함).\n\
`deck [deck code]`       Search card list of [deck code].\n\
\n\
⏳ Quiz commands\n\
`quiz`                Take quiz(with card image).\n\
`quizconfig`          Config pool(e.g. standard/wild, legendary/epic/rare)/difficulty of cards in quiz.\n\
\n\
⚙️ Personal config commands\n\
`me`                Check my contribution points.\n\
`config`                Confirm and change my configs(game mode/page).\n\
`ranking`                Check contribution point leaderboard.\n\
\n\
💡 You can add **class** condition right after prefix, like below.\n\
**ex)** `."priest" all battlecry`    `."전사" 갈라크론드`\n\
\n\
💡 `@여관주인`과 `!<명령어>` 사이에는 대부분 자동으로 띄어쓰기가 들어가지만 오류가 날 경우 확인해주시면 좋습니다.\n\
**ex)** `@여관주인!관련 이세라` (❌)    `@여관주인 !관련 이세라` (⭕️)'
  message.channel.send(str);
}

module.exports = {
  name: ['help', 'howto', 'commands', '?'],
  description: 'howto',
  execute: howto
}