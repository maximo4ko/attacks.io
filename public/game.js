// Инициализация
const socket = io();
let gameState = {
    players: {},
    myPlayerId: "",
    health: 100,
    isAlive: true
};

// Элементы интерфейса
const elements = {
    mainMenu: document.getElementById('main-menu'),
    gameScreen: document.getElementById('game-screen'),
    pauseMenu: document.getElementById('pause-menu'),
    playersMenu: document.getElementById('players-menu'),
    deathScreen: document.getElementById('death-screen'),
    healthBar: document.getElementById('health-bar'),
    respawnTimer: document.getElementById('respawn-timer'),
    respawnBtn: document.getElementById('respawn-btn')
};

// Кнопка "Играть"
document.getElementById('play-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        showError("Введите имя игрока!");
        return;
    }
    
    startGame(username);
});

// Запуск игры
function startGame(username) {
    // Переключение экранов
    elements.mainMenu.classList.remove('active');
    elements.gameScreen.classList.add('active');
    
    // Подключение к серверу
    socket.emit('join', username);
    
    // Инициализация игры
    initGame();
}

// Показ ошибки
function showError(message) {
    const errorBox = document.getElementById('error-box');
    errorBox.querySelector('p').textContent = message;
    errorBox.classList.remove('hidden');
}

// Закрытие ошибки
function hideError() {
    document.getElementById('error-box').classList.add('hidden');
}

// Управление меню
function openMenu() {
    elements.pauseMenu.style.display = 'flex';
}

function closeMenu() {
    elements.pauseMenu.style.display = 'none';
}

function openPlayersMenu() {
    updatePlayersList();
    elements.playersMenu.style.display = 'flex';
}

function closePlayersMenu() {
    elements.playersMenu.style.display = 'none';
}

function showDeathScreen() {
    elements.deathScreen.style.display = 'flex';
    startRespawnTimer();
}

// Таймер возрождения
function startRespawnTimer() {
    let seconds = 5;
    elements.respawnTimer.textContent = seconds;
    elements.respawnBtn.innerHTML = `Ждать (<span>${seconds}</span>)`;
    elements.respawnBtn.disabled = true;
    
    const timer = setInterval(() => {
        seconds--;
        elements.respawnTimer.textContent = seconds;
        elements.respawnBtn.innerHTML = `Ждать (<span>${seconds}</span>)`;
        
        if (seconds <= 0) {
            clearInterval(timer);
            elements.respawnBtn.disabled = false;
            elements.respawnBtn.textContent = "Возродиться";
        }
    }, 1000);
    
    elements.respawnBtn.onclick = () => {
        clearInterval(timer);
        socket.emit('respawn');
        elements.deathScreen.style.display = 'none';
    };
}

// Возврат в меню
function returnToMainMenu() {
    socket.disconnect();
    location.reload();
}

// Обновление списка игроков
function updatePlayersList() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    Object.values(gameState.players).forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = 'player-item';
        playerEl.innerHTML = `
            <span class="player-name">${player.username}</span>
            <span class="player-health">${player.health}HP</span>
        `;
        list.appendChild(playerEl);
    });
    
    document.getElementById('online-count').textContent = Object.keys(gameState.players).length;
}
