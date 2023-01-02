'use strict';
const mqtt = require('mqtt')
const connect = require("connect");
const app = connect();
const serveStatic = require('serve-static');
const httpServer = require("http").createServer(app);
app.use(serveStatic("public"));


const serverId = 'mqttjs_' + Math.random().toString(16).substr(2, 8)

const host = 'ws://broker.emqx.io:8083/mqtt'

const options = {
  keepalive: 60,
  clientId: serverId,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  will: {
    topic: 'WillMsg',
    payload: 'Connection Closed abnormally..!',
    qos: 0,
    retain: false
  },
}
console.log('Connecting mqtt client')
const server = mqtt.connect(host, options)

const users = [];
const chatRooms = []

server.on("connect", function(socket){
    //server.publish("loaded", chatRooms)
    server.subscribe('load', { qos: 0 })
    server.subscribe('roomManage', { qos: 0 })
    server.subscribe('joinChat', { qos: 0 })
    server.subscribe('leaveChat', { qos: 0 })
    server.subscribe('twit', { qos: 0 })
    
})

server.on("load", username => {
    users.push({
        socketId: socket.id,
        userName: username
    })
})
server.on("roomManage", arr => {
    socket.join(arr[1])
    chatRooms.push(arr[1])
    io.to(arr[1]).emit("create", arr)
})
server.on("joinChat", chatname => {
    socket.join(chatname)
    let name = users.filter(u => u.socketId == socket.id)[0].userName
    socket.to(chatname).emit("twits", [chatname, `(${name} joined room.)`])
})
server.on("leaveChat", async chatname => {
    let name = users.filter(u => u.socketId == socket.id)[0].userName
    socket.leave(chatname)
    socket.to(chatname).emit("twits", [chatname, `(${name} left room.)`])
    const sockets = await io.in(chatname).fetchSockets()
    if(sockets.length ==0){
        io.sockets.emit("deleteChat", chatname)
        chatRooms.pop(chatname)
    }
})
server.on("twit", twit_chat => {
    let name = users.filter(u => u.socketId == socket.id)[0].userName
    io.to(twit_chat[1]).emit("twits", [twit_chat[1], `(${name}: ${twit_chat[0]})`])
})

httpServer.listen(3000, function () {
 console.log('Serwer HTTP działa na pocie 3000');
});
