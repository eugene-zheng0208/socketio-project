/**
 * Created by:
 *      Rob Brennan <rob@therobbrennan.com>
 *
 *      Based on the example provided by Liam Kaufman (see README.md)
 */

var should = require('should');
var io = require('socket.io-client');

var request = require('supertest');
var app = require('../chat-server.js');
var socketURL = 'http://localhost:3000';

var options = {
  transports: ['websocket'],
  'force new connection': true
};

var chatUser1 = {'name': 'Tom'};
var chatUser2 = {'name': 'Sally'};
var chatUser3 = {'name': 'Dana'};

describe("Chat Server", function(){
  
  before(function(done){
    /* Start our chat server */
    request(socketURL)
    .get('/')
    .end(function(err,res){
      if(err) throw err;
      done();
    });
  });

  it('should broadcast new user to all users', function(done){

    var client1 = io.connect(socketURL, options);
    var numUsers = 0;

    client1.on('connect', function(data){
      client1.emit('connection name', chatUser1);

      /**
       * First client has connected successfully.
       * Connect another client to verify the broadcast.
       */
      var client2 = io.connect(socketURL, options);

      client2.on('connect', function(data){
        client2.emit('connection name', chatUser2);
      });

      client2.on('new user', function(userName){
        numUsers++;
        userName.should.equal(chatUser2.name + " has joined.");
        client2.disconnect(); // Disconnect after verifying we received the message
      })

    }); // client1.on('connect')

    client1.on('new user', function(userName){

      numUsers++;

      if(numUsers == 2){
        userName.should.equal(chatUser2.name + " has joined.");
        client1.disconnect();
        done();
      }

    });

  });

  it('should be able to broadcast messages', function(done){
    var client1, client2, client3;
    var message = 'Hello, world!';
    var messages = 0;

    // Function to verify that we're receiving the same message across all clients
    var checkMessage = function(client){
      client.on('message', function(msg){ // When a message event is received
        message.should.equal(msg);  // We're expecting it to be the 'Hello, world!' message
        client.disconnect();      // Disconnect when we've received a message
        messages++;               // Increment the number of messages received
        if(messages == 3){        // If all three clients have received that message
          done();                 // We're done
        }
      });
    };

    client1 = io.connect(socketURL, options);
    checkMessage(client1);  // Pass in our client to the checkMessage function

    client1.on('connect', function(data){
      client2 = io.connect(socketURL, options);
      checkMessage(client2);  // Pass in our client to the checkMessage function

      client2.on('connect', function(data){
        client3 = io.connect(socketURL, options);
        checkMessage(client3);  // Pass in our client to the checkMessage function

        client3.on('connect', function(data){
          client2.send(message);  // Send a message that all clients should receive
        });
      });
    });

  });

  it('should be able to send private messages', function(done){
    var client1, client2, client3;
    var message = {to: chatUser1.name, txt: 'Private Hello World'};
    var messages = 0;

    var completeTest = function(){
      messages.should.equal(1);
      client1.disconnect();
      client2.disconnect();
      client3.disconnect();
      done();
    };

    var checkPrivateMessage = function(client){
      client.on('private message', function(msg){
        message.txt.should.equal(msg.txt);
        msg.from.should.equal(chatUser3.name);
        messages++;

        if(client === client1){
          /* The first client has received the message; use a small delay to ensure other
           * clients do not receive the same message */
          setTimeout(completeTest, 40); // 40ms delay before completing our test
         };
      });
    };

    client1 = io.connect(socketURL, options);
    checkPrivateMessage(client1);

    client1.on('connect', function(data){
      client1.emit('connection name', chatUser1);

      client2 = io.connect(socketURL, options);
      checkPrivateMessage(client2);

      client2.on('connect', function(data){
        client2.emit('connect name', chatUser2);

        client3 = io.connect(socketURL, options);
        checkPrivateMessage(client3);

        client3.on('connect', function(data){
          client3.emit('connection name', chatUser3);
          client3.emit('private message', message);
        });
      });
    });
  });


});