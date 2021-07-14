const express = require('express');
const path = require('path');
const { generatemessage, generatelocation } = require('./utils/message')
const publicdirectory = path.join(__dirname, '../public');
const http = require('http');
const Filter = require('bad-words');
const socketio = require('socket.io');
const { constants } = require('buffer');
const { join } = require('path');
const { removeuser, getuser, adduser, getusersinroom } = require('./utils/users')
const app = express()
app.use(express.static(publicdirectory));
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketio(server);
let count = 0

io.on('connection', (socket) => {

    console.log("new web-socket connection");
    
    socket.on('join', ( options, callback ) => {
        const { error, user } = adduser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }
        socket.join(user.room);
        socket.emit('message', generatemessage('Admin','welcome'));
        socket.broadcast.to(user.room).emit('message', generatemessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomdata',{
            room:user.room,
            users:getusersinroom(user.room)
        });
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeuser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generatemessage('Admin',`${user.username} is left!`))

        }
    })
    socket.on('sendmessage', (message, callback) => {
        const user=getuser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('profanity is not allowed');
        }
        io.to(user.room).emit('message', generatemessage(user.username,message))
        callback()
    });
    socket.on('sendlocation', (coords, callback) => {
        const user=getuser(socket.id)
        io.to(user.room).emit('locationmessage', generatelocation(user.username,`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback()
    })

})
server.listen(port, () => {
    console.log(`listening on port ${port} `);
})