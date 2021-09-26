import { cardClass } from '../types/cardClass';
import translateClass from './jsons/class.json';

export function tokenizer(msgContent: string){
    const prefix = '!';
    
    if( !msgContent ) throw Error("NoContent");
    let ret: {
      class_?: cardClass,
      command?: string,
      args?: string
    } = {};
    let msgContentSplit = msgContent.trim().slice(1).split(/ +|\t+/);
  
    let resClass: cardClass;
    let command: string;
    let args: string;
    
    if ( msgContentSplit.length == 0 ){
      return ret;
    }
    if( (msgContentSplit[0].startsWith('"') || msgContentSplit[0].startsWith('“') || msgContentSplit[0].startsWith('”') || msgContentSplit[0].startsWith("'"))
    && (msgContentSplit[0].endsWith('"') || msgContent[0].endsWith('“')) || msgContentSplit[0].endsWith('”') || msgContentSplit[0].endsWith("'")) {
      let rawClass = msgContentSplit[0].substring(1, msgContentSplit[0].length-1);
      
      for (const cls of translateClass){
        if (cls.name === rawClass.toLowerCase()) resClass = cls;
        // if (cls.nameRaw.includes(rawClass)) resClass = cls;
      }
      if( !resClass ) throw Error("WrongClass");
      ret['class_'] = resClass;
      msgContentSplit = msgContentSplit.slice(1);
    }
    if ( msgContentSplit.length == 0 ){
      return ret;
    }

    ret['command'] = msgContentSplit[0].toLowerCase();
    msgContentSplit = msgContentSplit.slice(1);
    if ( msgContentSplit.length == 0 ){
      return ret;
    }

    args = msgContentSplit.join(" ")
    ret['args'] = args

    return ret;
  }