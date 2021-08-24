const translateClass = require('./translateClass.json');

function tokenizer(msgContent){
    const prefix = '!';
    
    if( !msgContent ) throw Error("NoContent");
    let ret = {}
    let msgContentSplit = msgContent.trim().split(/\s+/);
    let mention;

    if (msgContentSplit[0].startsWith('<@') && msgContentSplit[0].endsWith('>')){
      mention = msgContentSplit[0].slice(2, -1)
      if (mention.startsWith('!')) {mention = mention.slice(1);}
    }

    ret["mention"] = mention;
  
    msgContentSplit = msgContentSplit.slice(1);
    let resClass;
    let command;
    let args;
    
    if ( msgContentSplit.length == 0 ){
      return ret;
    }
    if( (msgContentSplit[0].startsWith('"') || msgContentSplit[0].startsWith('“') || msgContentSplit[0].startsWith('”') || msgContentSplit[0].startsWith("'"))
    && (msgContentSplit[0].endsWith('"') || msgContent[0].endsWith('“')) || msgContentSplit[0].endsWith('”') || msgContentSplit[0].endsWith("'")) {
      let korClass = msgContentSplit[0].substring(1, msgContentSplit[0].length-1);
      
      for (const cls of translateClass){
        if (cls.aliases.includes(korClass)) resClass = cls;
      }
      if( !resClass ) throw Error("WrongClass");
      ret['class_'] = resClass;
      msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
    }
    if ( msgContentSplit.length == 0 ){
      return ret;
    }
    if( msgContentSplit[0].startsWith(prefix) ) {
      command = msgContentSplit[0].substring(1);
      msgContentSplit = msgContentSplit.slice(1, msgContentSplit.length);
    }
    ret['command'] = command;
    if ( msgContentSplit.length == 0 ){
      return ret;
    }
    args = msgContentSplit.join(" ")
    ret['args'] = args
    return ret;
  }

  module.exports = tokenizer;