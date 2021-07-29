function pong(message, args) {
    message.channel.send("pong!")
}

module.exports = {
    name : 'pong',
    description : 'pong',
    execute : pong
}