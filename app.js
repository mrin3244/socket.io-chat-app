var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(3000);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

// receive the event on the server side 
io.sockets.on('connection', function(socket){
    socket.on('send message', function(data){
        // message send to all users
        io.sockets.emit('new message', data);
        // message send to all other users except me
        //socket.broadcast.emit('new message', data);
    })

})