const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

// Игровое состояние
const gameState = {
    players: {},
    bullets: [],
    walls: []
};

// Создаем стены
for (let i = 0; i < 15; i++) {
    gameState.walls.push({
        x: Math.random() * 700 + 50,
        y: Math.random() * 500 + 50,
        width: Math.random() * 100 + 50,
        height: Math.random() * 100 + 50
    });
}

app.use(express.static('public'));

// Ping для проверки соединения
setInterval(() => {
    io.emit('ping');
}, 1000);

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

    socket.on('move', (data) => {
        const player = gameState.players[socket.id];
        if (!player) return;
        
        // Обновляем позицию
        player.x = Math.max(0, Math.min(750, player.x + data.x * 5));
        player.y = Math.max(0, Math.min(550, player.y + data.y * 5));
        
        io.emit('update', gameState);
    });

    socket.on('shoot', (data) => {
        const player = gameState.players[socket.id];
        if (!player || player.health <= 0) return;
        
        const now = Date.now();
        if (now - player.lastShot < 500) return; // Задержка между выстрелами
        
        player.lastShot = now;
        
        // Создаем пулю
        gameState.bullets.push({
            x: player.x + 20,
            y: player.y + 20,
            angle: data.angle,
            speed: 10,
            owner: socket.id
        });
        
        io.emit('update', gameState);
    });

    socket.on('disconnect', () => {
        delete gameState.players[socket.id];
        io.emit('update', gameState);
    });
});

// Игровой цикл
setInterval(() => {
    // Движение пуль
    gameState.bullets.forEach((bullet, index) => {
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;
        
        // Проверка столкновений
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            if (playerId !== bullet.owner && 
                Math.abs(bullet.x - (player.x + 20)) < 25 && 
                Math.abs(bullet.y - (player.y + 20)) < 25) {
                
                player.health -= 35;
                if (player.health <= 0) {
                    io.to(playerId).emit('healthUpdate', 0);
                    setTimeout(() => {
                        if (gameState.players[playerId]) {
                            gameState.players[playerId].health = 100;
                            gameState.players[playerId].x = Math.random() * 700 + 50;
                            gameState.players[playerId].y = Math.random() * 500 + 50;
                            io.to(playerId).emit('respawn');
                            io.emit('update', gameState);
                        }
                    }, 5000);
                } else {
                    io.to(playerId).emit('healthUpdate', player.health);
                }
                
                gameState.bullets.splice(index, 1);
                break;
            }
        }
        
        // Удаление пуль за пределами карты
        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
            gameState.bullets.splice(index, 1);
        }
    });
    
    io.emit('update', gameState);
}, 1000 / 60);

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
