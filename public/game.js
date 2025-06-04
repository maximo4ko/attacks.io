// В функции renderPlayers():
function renderPlayers() {
    // Очистка старых элементов
    document.querySelectorAll('.player-container').forEach(el => el.remove());

    // Рендер каждого игрока
    Object.values(gameState.players).forEach(player => {
        const container = document.createElement('div');
        container.className = 'player-container';
        container.style.left = `${player.x}px`;
        container.style.top = `${player.y}px`;
        
        // Куб
        const cube = document.createElement('div');
        cube.className = player.id === gameState.myPlayerId ? 'player my-player' : 'player';
        
        // Ник
        const nameTag = document.createElement('div');
        nameTag.className = 'player-name';
        nameTag.textContent = player.username;
        
        container.appendChild(cube);
        container.appendChild(nameTag);
        gameContainer.appendChild(container);
    });
}
