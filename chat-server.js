/**
 * Created by:
 *      Rob Brennan <rob@generalui.com>
 *      7/18/14 10:13 AM
 *
 *      Based on the example provided by Liam Kaufman (see README.md)
 *
 *      This chat server should be able to
 *      + Broadcast that a new user has joined
 *      + Broadcast messages to the whole group
 *      + Handle private messages between clients
 */

console.log('Preparing to load chat server');

var port = 3000;
var io = require('socket.io').listen(port);
var clients = {};

console.log('Chat server is listening on port ' + port);

io.sockets.on('connection', function(socket){
  var userName;

  // Socket events
  socket.on('connection name', function(user){
    userName = user.name;
    clients[userName] = socket;
    io.sockets.emit('new user', user.name + " has joined.");
  });

  socket.on('message', function(msg){
    io.sockets.emit('message', msg);
  });

  socket.on('private message', function(msg){
    fromMsg = {from:userName, txt:msg.txt};
    clients[msg.to].emit('private message', fromMsg);
  });

  socket.on('disconnect', function(){
    delete clients[userName];
  });

});

module.exports = io;