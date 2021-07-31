// parameter : array of images
async function paginate(message, images){
  if (images.length == 0) return;
  else if (images.length == 1) {
    await message.channel.send({files: images[0]});
    return;
  } else {
    let length = images.length;
    channel = message.channel;
    for(image of images){
      if (length == 1){
        await channel.send("마지막 결과입니다.", {files: [image]})
        return;
      } else {
        let msg = await channel.send(
          `${ length - 1 }개의 결과가 더 있습니다. 이모티콘을 클릭하여 다음 결과를 확인할 수 있습니다.`,
          {files: [image]}
        );
        await msg.react("➡️");
        collected = await msg.awaitReactions(
          (reaction, user) => {
              return reaction.emoji.name === "➡️" && user.id == message.author.id;
          },
          { time : 15000, max : 1 }
        )
        if(collected.size == 0){
          break;
        } else {
          length -= 1;
          msg.delete();
        }
      }
    }
  }
}

module.exports = paginate