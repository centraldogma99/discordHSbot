class Logger {
  constructor(logChannel){
    this.logChannel = logChannel;
  }

  messageLog(message){
    const d = new Date(new Date( message.createdTimestamp ).getTime()+3600000*9);  // 9시간 추가
    const date = `${ d.getFullYear() }-${ (d.getMonth()+1).toString().padStart(2, "0") }-${ d.getDate().toString().padStart(2, "0") }, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
  
    this.logChannel.send(`**${message.author.username}#${message.author.discriminator}** : ${date} : \`${message.content}\``)
  }

  serverLog(str){
    const d = new Date(new Date().getTime()+3600000*9);  // 9시간 추가
    const date = `${ d.getFullYear() }-${ (d.getMonth()+1).toString().padStart(2, "0") }-${ d.getDate().toString().padStart(2, "0") }, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
    
    this.logChannel.send(`**Server** : ${date} : \`${str}\``)
  }
}

module.exports = Logger;