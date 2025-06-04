// Инициализация
const socket = io();
let username = "";
let players = {};
let myPlayerId = "";

// Элементы DOM
const gameContainer = document.getElementById('game-container');
const playersBtn = document.getElementById('players-btn');
const playersModal = document.getElementById('players-modal');
const closeBtn = document.querySelector('.close');

// Кнопка "Играть"
document.getElementById('play-btn').addEventListener('click', () => {
    username = document.getElementById('username').value || "Player" + Math.floor(Math.random() * 1000);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-input').style.display = 'block';
    gameContainer.style.display = 'block';
    socket.emit('join', username);
});

// Кнопка списка игроков
playersBtn.addEventListener('click', () => {
    playersModal.style.display = 'block';
});

// Закрытие модального окна
closeBtn.addEventListener('click', () => {
    playersModal.style.display = 'none';
});

// Отрисовка игроков
function renderPlayers() {
    // Удаляем старых игроков
    document.querySelectorAll('.player').forEach(el => el.remove());

    // Рисуем всех игроков
    for (const id in players) {
        const player = players[id];
        const playerEl = document.createElement('div');
        playerEl.className = 'player';
        playerEl.style.left = player.x + 'px';
        playerEl.style.top = player.y + 'px';
        playerEl.style.backgroundColor = id === myPlayerId ? '#00FF00' : '#FF0000';
        gameContainer.appendChild(playerEl);
    }
}

// Обновление таблицы игроков
function updatePlayersTable() {
    const tbody = document.querySelector('#players-table tbody');
    tbody.innerHTML = '';
    for (const id in players) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${players[id].username}</td>
            <td>${id === myPlayerId ? 'Вы' : 'В игре'}</td>
        `;
        tbody.appendChild(row);
    }
}

// События с сервера
socket.on('init', (data) => {
    myPlayerId = socket.id;
    players = data.players;
    renderPlayers();
    updatePlayersTable();
});

socket.on('playerJoined', (playerData) => {
    players[playerData.id] = playerData;
    renderPlayers();
    updatePlayersTable();
});

socket.on('playerMoved', (data) => {
    if (players[data.id]) {
        players[data.id].x = data.x;
        players[data.id].y = data.y;
        renderPlayers();
    }
});

socket.on('playerLeft', (id) => {
    delete players[id];
    renderPlayers();
    updatePlayersTable();
});

// Управление (движение мышкой)
gameContainer.addEventListener('mousemove', (e) => {
    const rect = gameContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    socket.emit('move', { x, y });
});

// Стрельба (клик)
gameContainer.addEventListener('click', (e) => {
    const rect = gameContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    socket.emit('shoot', { x, y });
});
