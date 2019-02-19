var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var nicknames = [];

server.listen(3000);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

// receive the event on the server side 
io.sockets.on('connection', function(socket){
    socket.on('new user', function(data, callback){
        if(nicknames.indexOf(data) != -1){
            callback(false);
        } else{
            callback(true);
            socket.nickname = data;
            nicknames.push(socket.nickname);
            updateNicknames();
            
        }

    });

    function updateNicknames(){
        //console.log(nicknames);
        io.sockets.emit('usernames', nicknames);
    }
    socket.on('send message', function(data){
        // message send to all users
        io.sockets.emit('new message', {msg: data, nick: socket.nickname});
        // message send to all other users except me
        //socket.broadcast.emit('new message', data);
    });

    // when close the chat window
    socket.on('disconnect', function(data){
        if(!socket.nickname) return;
        nicknames.splice(nicknames.indexOf(socket.nickname), 1);
        updateNicknames();
    });

})