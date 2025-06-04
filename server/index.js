вер запущен на порту ${PORT}`);
});
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

const gameState = {
    players: {},
    bullets: [],
    walls: []
};

// Генерация карты
for (let i = 0; i < 20; i++) {
    gameState.walls.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        width: Math.random() * 100 + 50,
        height: Math.random() * 100 + 50
    });
}

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Новый игрок:', socket.id);

    socket.on('join', (username) => {
        gameState.players[socket.id] = {
            id: socket.id,
            username,
            x: Math.random() * 700 + 50,
            y: Math.random() * 500 + 50,
            health: 100,
            lastShot: 0
        };
        
        socket.emit('init', gameState);
        io.emit('update', gameState);
    });

    // Остальные обработчики (move, shoot и т.д.)
    // ...
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
