class paginator {
  constructor(message, objects, step, length){
    if(step < 1) throw new Error('a step must be a integer bigger than 0');
    this.message = message;
    this.objects = objects;
    this.step = step;
    this.cursor = -step;
    this.numberOfObjects = length;
  }

  prev(){
    let targetObjects = this.objects.slice(this.cursor - this.step, this.cursor);
    this.cursor = this.cursor - this.step;
    this.showMessages(targetObjects);
  }

  next(){
    let targetObjects = this.objects.slice(this.cursor + this.step, this.cursor + 2*this.step);
    this.cursor = this.cursor + this.step;
    this.showMessages(targetObjects);
  }

  async showMessages(targetObjects){
    let infoMessage;
    let isLongResult = this.objects.length > this.step
    if(isLongResult){
      infoMessage = await this.message.channel.send(`총 ${ this.numberOfObjects }개의 결과 : ${ this.cursor/this.step + 1 }/${ Math.ceil(this.numberOfObjects/this.step) }`)
    }
    let promises = targetObjects.map(obj => this.message.channel.send({files:[obj]}));
    let targetMessages = await Promise.all(promises);
    
    if(isLongResult){
      let lastMessage = targetMessages[0];
      for (const msg of (await targetMessages.slice(1, targetMessages.length))){
        if (msg.createdTimestamp > lastMessage.createdTimestamp){
          lastMessage = msg;
        }
      }
      if( this.cursor - this.step >= 0 ){
        await lastMessage.react("⬅️");
      }else{
        await lastMessage.react("❌");
      }
      if( this.cursor + this.step < this.objects.length ){
        await lastMessage.react("➡️");
      }else{
        await lastMessage.react("❌");
      }
      
      let collectedReactions = await lastMessage.awaitReactions(
        (reaction, user) => {
          return (reaction.emoji.name === "➡️" ||
          reaction.emoji.name === "⬅️") &&
          user.id == this.message.author.id;
        },
        { time : 15000, max : 1 }
      )
      if (collectedReactions.size == 0){
        return;
      } else {
        let reaction = collectedReactions.keys().next().value;
        targetMessages.map(msg => msg.delete())
        infoMessage.delete()
        
        if( reaction === "➡️" ){
          this.next();
        } else if( reaction === "⬅️" ){
          this.prev();
        }
      }
    }
  }

  get getObjectsLength(){
    return this.objects.length;
  }

  get getCursor(){
    return this.cursor;
  }
}

module.exports = paginator;