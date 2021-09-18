import { GuildChannelResolvable, Message, Permissions } from "discord.js";
import { Logger } from "./Logger";

export function permissionChecker(message: Message, logger: Logger){
  const roleChecker = [
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.ATTACH_FILES
  ];

  if(message.guild){
    const hasPermission = message.guild.me.permissionsIn(message.channel as GuildChannelResolvable).has(roleChecker);
    
    if( !hasPermission ) {
      logger.serverLog(`No permission : ${ message.channel.id }`);
      message.channel.send("‼️ 현재 채널에 봇이 활동할 권한이 부족합니다.\n'메시지 보내기', '파일 첨부' 중 하나라도 권한이 부족할 경우 이 오류가 발생합니다.")
      .catch(console.log)
      return false;
    }
    return true;
  } else {
    // DM인 경우
    return true;
  }
}