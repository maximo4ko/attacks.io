const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;

const players = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Новый игрок:', socket.id);

    socket.on('join', (username) => {
        players[socket.id] = { x: 400, y: 300, username };
        io.emit('players', players);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            io.emit('playerMoved', { id: socket.id, ...data });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
