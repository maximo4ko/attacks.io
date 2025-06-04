// Инициализация игры
const socket = io();
let gameState = {
    players: {},
    bullets: [],
    walls: [],
    myPlayerId: "",
    health: 100,
    isAlive: true
};

// Элементы DOM
const gameContainer = document.getElementById('game-container');
const healthBar = document.getElementById('health-bar');
const connectionWarning = document.getElementById('connection-warning');

// Проверка соединения
let lastPingTime = Date.now();
setInterval(() => {
    if (Date.now() - lastPingTime > 2000) {
        connectionWarning.classList.remove('hidden');
    } else {
        connectionWarning.classList.add('hidden');
    }
}, 1000);

socket.on('ping', () => {
    lastPingTime = Date.now();
});

// Главное меню
document.getElementById('play-btn').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        showError("Введите имя игрока!");
        return;
    }
    
    socket.emit('join', username);
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
});

// Управление джойстиками
initJoysticks();

function initJoysticks() {
    // Джойстик движения
    const moveJoystick = document.getElementById('move-joystick');
    let moveTouchId = null;
    let moveStartX = 0, moveStartY = 0;

    moveJoystick.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        moveTouchId = touch.identifier;
        moveStartX = touch.clientX;
        moveStartY = touch.clientY;
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === moveTouchId) {
                const dx = touch.clientX - moveStartX;
                const dy = touch.clientY - moveStartY;
                socket.emit('move', { 
                    x: Math.min(1, Math.max(-1, dx / 50)), 
                    y: Math.min(1, Math.max(-1, dy / 50)) 
                });
                e.preventDefault();
            }
        }
    });

    document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === moveTouchId) {
                socket.emit('move', { x: 0, y: 0 });
                moveTouchId = null;
            }
        }
    });

    // Джойстик стрельбы
    const shootJoystick = document.getElementById('shoot-joystick');
    let shootTouchId = null;
    let shootStartX = 0, shootStartY = 0;

    shootJoystick.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        shootTouchId = touch.identifier;
        shootStartX = touch.clientX;
        shootStartY = touch.clientY;
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === shootTouchId) {
                const dx = touch.clientX - shootStartX;
                const dy = touch.clientY - shootStartY;
                const angle = Math.atan2(dy, dx);
                socket.emit('shoot', { angle });
                e.preventDefault();
            }
        }
    });

    document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === shootTouchId) {
                shootTouchId = null;
            }
        }
    });
}

// Кнопки меню
document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('pause-menu').classList.remove('hidden');
});

document.getElementById('players-btn').addEventListener('click', () => {
    updatePlayersList();
    document.getElementById('players-menu').classList.remove('hidden');
});

// Обработчики сервера
socket.on('init', (data) => {
    gameState.myPlayerId = socket.id;
    gameState.players = data.players;
    gameState.walls = data.walls;
    renderGame();
});

socket.on('update', (data) => {
    gameState.players = data.players;
    gameState.bullets = data.bullets;
    renderGame();
});

socket.on('healthUpdate', (health) => {
    gameState.health = health;
    healthBar.textContent = `HP: ${health}`;
    
    if (health <= 0 && gameState.isAlive) {
        gameState.isAlive = false;
        showDeathScreen();
    }
});

socket.on('playerDied', (playerId) => {
    if (playerId === gameState.myPlayerId) return;
    // Эффект смерти для других игроков
});

socket.on('respawn', () => {
    gameState.isAlive = true;
    gameState.health = 100;
    healthBar.textContent = `HP: 100`;
    document.getElementById('death-screen').classList.add('hidden');
});

// Рендер игры
function renderGame() {
    // Очистка
    gameContainer.innerHTML = '';
    
    // Рендер стен
    gameState.walls.forEach(wall => {
        const wallEl = document.createElement('div');
        wallEl.className = 'wall';
        wallEl.style.left = `${wall.x}px`;
        wallEl.style.top = `${wall.y}px`;
        wallEl.style.width = `${wall.width}px`;
        wallEl.style.height = `${wall.height}px`;
        gameContainer.appendChild(wallEl);
    });
    
    // Рендер игроков
    Object.values(gameState.players).forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = player.id === gameState.myPlayerId ? 'player my-player' : 'player';
        playerEl.style.left = `${player.x}px`;
        playerEl.style.top = `${player.y}px`;
        gameContainer.appendChild(playerEl);
    });
    
    // Рендер пуль
    gameState.bullets.forEach(bullet => {
        const bulletEl = document.createElement('div');
        bulletEl.className = 'bullet';
        bulletEl.style.left = `${bullet.x}px`;
        bulletEl.style.top = `${bullet.y}px`;
        gameContainer.appendChild(bulletEl);
    });
}

// Экран смерти
function showDeathScreen() {
    const deathScreen = document.getElementById('death-screen');
    deathScreen.classList.remove('hidden');
    
    let seconds = 5;
    const timer = document.getElementById('respawn-timer');
    const respawnBtn = document.getElementById('respawn-btn');
    
    timer.textContent = seconds;
    respawnBtn.textContent = `Возродиться (${seconds})`;
    respawnBtn.disabled = true;
    
    const countdown = setInterval(() => {
        seconds--;
        timer.textContent = seconds;
        respawnBtn.textContent = `Возродиться (${seconds})`;
        
        if (seconds <= 0) {
            clearInterval(countdown);
            respawnBtn.disabled = false;
            respawnBtn.textContent = "Возродиться";
        }
    }, 1000);
    
    respawnBtn.onclick = () => {
        clearInterval(countdown);
        socket.emit('respawn');
    };
}

// Вспомогательные функции
function showError(message) {
    const errorBox = document.getElementById('error-box');
    errorBox.querySelector('p').textContent = message;
    errorBox.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-box').classList.add('hidden');
}

function updatePlayersList() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    
    Object.values(gameState.players).forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.textContent = `${player.username} (${player.health} HP)`;
        playerEl.style.color = player.id === gameState.myPlayerId ? 'blue' : 'red';
        playerEl.style.padding = '5px';
        list.appendChild(playerEl);
    });
}

function closePopup(id) {
    document.getElementById(id).classList.add('hidden');
}

function returnToMainMenu() {
    socket.disconnect();
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    location.reload();
}
