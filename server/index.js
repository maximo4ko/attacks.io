const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

let players = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Новый игрок:', socket.id);

    socket.on('join', (username) => {
        players[socket.id] = {
            id: socket.id,
            username,
            x: Math.random() * 700 + 50,
            y: Math.random() * 500 + 50
        };
        io.emit('init', { players });
        io.emit('playerJoined', players[socket.id]);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('playerMoved', { id: socket.id, ...data });
        }
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            io.emit('playerLeft', socket.id);
            delete players[socket.id];
        }
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
