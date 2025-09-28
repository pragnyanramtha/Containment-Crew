import { GameEngine } from './engine/GameEngine.js';
import { NetworkManager } from './network/NetworkManager.js';
import { LobbyManager } from './engine/LobbyManager.js';

// Initialize the game when DOM and stylesheets are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for stylesheets to load to prevent FOUC and layout forcing
    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', initializeGame);
    } else {
        // Use requestAnimationFrame to ensure rendering is ready
        requestAnimationFrame(initializeGame);
    }
});

function initializeGame() {
    if (document.readyState !== 'complete') {
        return;
    }
    
    const canvas = document.getElementById('gameCanvas');
    
    // Initialize network manager
    const networkManager = new NetworkManager();
    
    // Initialize lobby manager
    const lobbyManager = new LobbyManager(networkManager);
    
    // Show loading message
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Loading sprites and backgrounds...', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px monospace';
    ctx.fillText('This may take a moment...', canvas.width / 2, canvas.height / 2 + 40);
    
    // Initialize game engine (handles all canvas setup)
    const gameEngine = new GameEngine(canvas, networkManager);
    
    // Connect lobby to game engine
    lobbyManager.onGameStart = (data) => {
        console.log('Starting game with data:', data);
        gameEngine.startMultiplayerGame(data);
    };
    
    // Connect to server
    networkManager.connect();
    
    console.log('Sacrifices Must Be Made - Lobby and Game Initialized');
}