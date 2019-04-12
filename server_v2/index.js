var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(8080, function() {
  console.log("server ok")
});

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

let clients = [];
let total_clients;

let history = [];
let rooms = [];

let max_players = 4;

let colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
colors.sort(function(a,b) { return Math.random() > 0.5; } );

// WebSocket server
wsServer.on('request', function(request) {
  let connection = request.accept(null, request.origin);
  let index = clients.push(connection) - 1;
  let userName = false;
  let userColor = false;

  connection.on('message', function(req) {
    //console.log(req)
    total_clients = clients.length;
    if(req.type === 'utf8') {
      let obj = JSON.parse(req.utf8Data);

      if('username' in obj) {
        userColor = colors.shift();
        userName = obj.username;
        connection.sendUTF(JSON.stringify({ type: 'username', data: { username : userName, color : userColor} }));
        if (history.length > 0) {
          connection.sendUTF(JSON.stringify({ type: 'history', data: history }));
        }
        if (rooms.length > 0) {
          connection.sendUTF(JSON.stringify({ type: 'rooms', data: rooms }));
        }
      }
      else if('message' in obj) {
        let hour = (new Date().getHours().length < 2) ? '0'+new Date().getHours() : new Date().getHours();
        let min = (new Date().getMinutes().length < 2) ? '0'+new Date().getMinutes() : new Date().getMinutes();
        let time = hour + ':' + min;
        let msg = {
          time: time,
          message: obj.message,
          username: userName,
          color: userColor,
          chat: obj.chat
        };

        history.push(msg);
        history = history.slice(-100);
        for (var i=0; i < total_clients; i++) {
          clients[i].sendUTF(JSON.stringify({ type: 'message', data : msg }));
        }
      }
      else if('new_room' in obj){
        let room = {
          id: obj.new_room,
          data:{
            code: obj.room_code,
            name: obj.new_room,
            admin: obj.user.username,
            users: [obj.user.username]
          }
        };
        rooms.push(room);
        for (var i=0; i < total_clients; i++) {
          clients[i].sendUTF(JSON.stringify({ type: 'new_room', data : room }));
        }
        connection.sendUTF(JSON.stringify({ type: 'join_room', data : room }));
      }
      else if('room_id' in obj){
        for(let i=0; i<rooms.length; i++){
          if(rooms[i].id == obj.room_id){
            if(rooms[i].data.users.length == max_players) connection.sendUTF(JSON.stringify({ type: 'ask_join', data: { res: 'room full' } }));
            else if(rooms[i].data.code !== obj.room_code) connection.sendUTF(JSON.stringify({ type: 'ask_join', data: { res: 'wrong code' } }));
            else connection.sendUTF(JSON.stringify({ type: 'ask_join', data: rooms[i] } ));
          }
        }
      }
      else if('join_room' in obj){
        for(let i=0; i<rooms.length; i++){
          if(rooms[i].id == obj.join_room){
            rooms[i].data.users.push(obj.user.username)
            connection.sendUTF(JSON.stringify({ type: 'join_room', data : rooms[i] }));
          }
        }
      }
      else if('exit_room' in obj){
        for(let i=0; i<rooms.length; i++){
          if(rooms[i].id == obj.exit_room){
            rooms[i].data.users.splice(obj.user.username, 1);
            connection.sendUTF(JSON.stringify({ type: 'exit_room', data : rooms[i] }));
            if (rooms.length > 0) {
              connection.sendUTF(JSON.stringify({ type: 'rooms', data: rooms }));
            }
          }
        }
      }
    }
  });

connection.on('close', function(connection) {
  // close user connection
  clients.splice(index, 1);
  });
});
