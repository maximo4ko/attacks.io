let game;
let player;
let otherPlayers = {};
let socket;
let username = "";

document.getElementById('play-btn').addEventListener('click', () => {
    username = document.getElementById('username').value || "Player" + Math.floor(Math.random() * 1000);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    initGame();
});

function initGame() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        physics: { default: 'arcade' },
        scene: { preload, create, update }
    };
    game = new Phaser.Game(config);
}

function preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
}

function create() {
    // Подключение к серверу
    socket = io();
    socket.emit('join', username);

    // Игрок
    player = this.physics.add.sprite(400, 300, 'player').setScale(0.5);

    // Управление
    this.cursors = this.input.keyboard.createCursorKeys();

    // Слушатели сервера
    socket.on('players', (players) => {
        Object.keys(players).forEach(id => {
            if (id !== socket.id && !otherPlayers[id]) {
                otherPlayers[id] = this.add.sprite(players[id].x, players[id].y, 'player').setScale(0.5);
            }
        });
    });

    socket.on('playerMoved', (data) => {
        if (otherPlayers[data.id]) {
            otherPlayers[data.id].setPosition(data.x, data.y);
        }
    });
}

function update() {
    // Движение
    if (this.cursors.left.isDown) player.x -= 5;
    if (this.cursors.right.isDown) player.x += 5;
    if (this.cursors.up.isDown) player.y -= 5;
    if (this.cursors.down.isDown) player.y += 5;

    // Отправка данных на сервер
    socket.emit('move', { x: player.x, y: player.y });
}
