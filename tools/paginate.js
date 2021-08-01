// parameter : array of images
async function paginate(message, images, step){
  if (images.length == 0) return;
  else if (images.length <= step) {
    await message.channel.send("마지막 결과입니다.");
    let promises = images.map(image => message.channel.send({files: [image]}));
    Promise.all(promises);
    return;
  } else {
    let length = images.length;
    let imagesToSend = images.slice(0, step);
    let infoMsg = await message.channel.send(`${ length - step }개의 결과가 더 있습니다.`)
    let promises = imagesToSend.map(image => message.channel.send({files: [image]}));
    let postedMessages = await Promise.all(promises);
    let lastMessage = postedMessages[0];
    for (msg of (await postedMessages.slice(1, postedMessages.length))){
      if (msg.createdTimestamp > lastMessage.createdTimestamp){
        lastMessage = msg;
      }
    }
    lastMessage.react("➡️");
    collected = await lastMessage.awaitReactions(
      (reaction, user) => {
          return reaction.emoji.name === "➡️" && user.id == message.author.id;
      },
      { time : 15000, max : 1 }
    )
    if (collected.size == 0){
      return;
    } else {
      postedMessages.map(msg => msg.delete())
      infoMsg.delete()
      images = images.slice(step, images.length);
      paginate(message, images, step);
    }
  }
}

module.exports = paginate