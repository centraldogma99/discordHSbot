const { Permissions } = require("discord.js");

function permissionChecker(message, logger){
  const roleChecker = [
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.ATTACH_FILES,
    Permissions.FLAGS.ADD_REACTIONS
  ];

  if(message.channel.guild){
    let hasPermission = false;
    for( const role of message.guild.me.roles.cache.values() ){
      let myRolePermission = role.permissionsIn(message.channel);
      if( myRolePermission.has(roleChecker) ){
        hasPermission = true;
        break;
      }
    }
    if( !hasPermission ) {
      logger.serverLog(`No permission : ${ message.channel.id }`);
      message.channel.send("‼️ 현재 채널에 봇이 활동할 권한이 부족합니다.\n'메시지 보내기', '파일 첨부', '반응 추가하기' 중 하나라도 권한이 부족할 경우 이 오류가 발생합니다.")
      .catch(console.log)
      return false;
    }
    return true;
  } else {
    // DM인 경우
    return true;
  }
}

module.exports = permissionChecker;