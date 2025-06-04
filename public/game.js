let game;
let player;
let otherPlayers = {};
let bullets = [];
let walls = [];
let joystickMove, joystickShoot;
let socket;
let username = "";

// Инициализация игры
document.getElementById('play-btn').addEventListener('click', () => {
    username = document.getElementById('username').value || "Player" + Math.floor(Math.random() * 1000);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-input').style.display = 'block';
    initGame();
});

function initGame() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        physics: {
            default: 'arcade',
            arcade: { gravity: { y: 0 }, debug: false }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        plugins: {
            global: [{
                key: 'rexVirtualJoystick',
                plugin: rexvirtualjoystickplugin,
                start: true
            }]
        }
    };
    game = new Phaser.Game(config);
}

function preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('wall', 'assets/wall.png');
}

function create() {
    // Подключение к серверу
    socket = io();
    socket.emit('join', username);

    // Создаем стены
    walls = this.physics.add.staticGroup();
    for (let i = 0; i < 10; i++) {
        walls.create(
            Phaser.Math.Between(50, 750),
            Phaser.Math.Between(50, 550),
            'wall'
        ).setScale(0.5).refreshBody();
    }

    // Создаем игрока
    player = this.physics.add.sprite(400, 300, 'player').setScale(0.5);
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, walls);

    // Джойстики
    joystickMove = this.plugins.get('rexVirtualJoystick').add(this, {
        x: 100, y: 500, radius: 50,
        base: this.add.circle(0, 0, 50, 0x888888),
        thumb: this.add.circle(0, 0, 25, 0xcccccc)
    });

    joystickShoot = this.plugins.get('rexVirtualJoystick').add(this, {
        x: 700, y: 500, radius: 50,
        base: this.add.circle(0, 0, 50, 0x888888),
        thumb: this.add.circle(0, 0, 25, 0xcccccc)
    });

    // Чат
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = e.target.value;
            if (message) {
                socket.emit('chat', message);
                addMessage(`${username}: ${message}`);
                e.target.value = '';
            }
        }
    });

    // Обработчики событий
    socket.on('players', (players) => {
        Object.keys(players).forEach(id => {
            if (id !== socket.id && !otherPlayers[id]) {
                otherPlayers[id] = this.physics.add.sprite(
                    players[id].x,
                    players[id].y,
                    'player'
                ).setScale(0.5);
            }
        });
    });

    socket.on('playerMoved', (data) => {
        if (otherPlayers[data.id]) {
            otherPlayers[data.id].setPosition(data.x, data.y);
        }
    });

    socket.on('bulletFired', (data) => {
        const bullet = this.physics.add.sprite(data.x, data.y, 'bullet').setScale(0.3);
        bullet.setVelocity(data.velX * 500, data.velY * 500);
        bullets.push(bullet);
    });

    socket.on('playerDied', (id) => {
        if (otherPlayers[id]) {
            otherPlayers[id].setVisible(false);
            setTimeout(() => {
                otherPlayers[id].setVisible(true);
            }, 3000);
        }
    });

    socket.on('chat', (msg) => {
        addMessage(msg);
    });

    socket.on('playerJoined', (name) => {
        addMessage(`${name} присоединился!`);
    });
}

function update() {
    // Движение игрока
    const moveX = joystickMove.forceX;
    const moveY = joystickMove.forceY;
    player.setVelocityX(moveX * 200);
    player.setVelocityY(moveY * 200);
    socket.emit('move', { x: player.x, y: player.y });

    // Стрельба
    if (joystickShoot.forceX !== 0 || joystickShoot.forceY !== 0) {
        socket.emit('shoot', {
            x: player.x,
            y: player.y,
            velX: joystickShoot.forceX,
            velY: joystickShoot.forceY
        });
    }
}

function addMessage(msg) {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div>${msg}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}
