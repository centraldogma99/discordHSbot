const { Permissions } = require("discord.js");

function messageChecker(message, logger, clientId){
  if( message.author.bot ) return;
  if( !message.mentions.has(clientId) ) return;
  if( message.mentions.everyone ) return;
  if( message.type == 'REPLY') return;
  if( message.channel.isThread() ) {
    try{
      message.channel.send("‼️ 스레드는 아직 지원하지 않습니다.")
    } catch(e) {
      console.log(e);
    }
    return;
  }
  if( message.channel.doingQuiz ) {
    message.channel.send("❌  이 채널에서 퀴즈가 실행 중입니다.");
    return;
  }
  
  // 현재 채널에 permission가지고 있는지 확인
  const roleChecker = [
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.ATTACH_FILES,
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.MANAGE_MESSAGES
  ];
  
  if(message.channel.guild){
    let hasPermission = false;
    for( const role of message.guild.me.roles.cache.values() ){
      let myRolePermission = role.permissionsIn(message.channel);
      if( myRolePermission.has(roleChecker) ){
        if (role.name != '@everyone'){
          hasPermission = true;
          break;
        } 
      }
    }
    if( !hasPermission ) {
      logger.serverLog(`No permission : ${ message.channel.id }`);
      message.channel.send("‼️ 현재 채널에 봇이 활동할 권한이 부족합니다.\n'채널 보기', '메시지 보내기', '파일 첨부', '반응 추가하기', '메시지 관리' 중 하나라도 권한이 부족할 경우 이 오류가 발생합니다.")
      .catch(console.log)
      return;
    }
  }
  return true;
}

module.exports = messageChecker;