var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
const mongoose = require('mongoose');

var users  = {};

server.listen(3000);



//mongoose connect to mongodb database 
mongoose.connect("mongodb://localhost:27017/mydb",  {useNewUrlParser : true }, function(err){
    if(err){
        console.log(err)
    }else {
        console.log('database connected')
    }
});

var chatSchema = mongoose.Schema({
    nick : String,
    msg : String,
    created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('chatmessage', chatSchema);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

// receive the event on the server side 
io.sockets.on('connection', function(socket){
    // msg from database
    Chat.find({}).sort({_id:-1}).limit(10).exec(function(err, docs){
        if(err) throw err;
        //console.log('sending old messages');
        socket.emit('load old msg', docs);
    });

    socket.on('new user', function(data, callback){
        if(data in users){
            callback(false);
        } else{
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
            
        }

    });

    function updateNicknames(){
        io.sockets.emit('usernames', Object.keys(users));
    }
    socket.on('send message', function(data, callback){
        var msg = data.trim();
        if(msg.substr(0,3) === '/w '){
            // wishper message
            msg = msg.substr(3);
            var index = msg.indexOf(' ');
            if(index !== -1){
                // private message not store in database
                var name = msg.substr(0, index);
                var msg = msg.substr(index + 1);
                if(name in users){
                    users[name].emit('wishper', {msg: msg, nick: socket.nickname});
                    //console.log('wishper');
                } else {
                    callback('error : enter a valid user');
                }
                
            } else{
                // did not have any msg
                callback('error : please enter a message');
            }
            

        } else {
            var newMsg = new Chat({msg: msg, nick: socket.nickname});
            newMsg.save(function(err){
                if(err) throw err;
                io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
            });
        }
    });

    // when close the chat window
    socket.on('disconnect', function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames();
    });

})