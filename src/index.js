const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {

    // socket.emit('broadcastMessage', generateMessage('Welcome User!'))
    // socket.broadcast.emit('broadcastMessage', generateMessage('A new user has joined the chat group'))

    socket.on('join', (options, callback) => {

        const {error, user} = addUser({id:socket.id, ...options})

        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('broadcastMessage', generateMessage(`Welcome ${user.username}!`))
        socket.broadcast.to(user.room).emit('broadcastMessage', generateMessage(`${user.username} has joined the chat group`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
    })

    socket.on('push', (msg, callback) => {
        //io.emit('get', msg)
        const filter = new Filter()        
        if(filter.isProfane(msg)){
            return callback(false)
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('get', generateMessage(msg, user.username))
        callback(true)
    })

    socket.on('userLocation', ({latitude, longitude}, callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${latitude},${longitude}`, user.username))
        callback(true) 
    })

    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        console.log(user)
        if(user){
            io.to(user.room).emit('broadcastMessage', generateMessage(`${user.username} has left the chat`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`App is running on ${port}`)
})