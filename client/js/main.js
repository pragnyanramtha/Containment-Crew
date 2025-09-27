import { GameEngine } from './engine/GameEngine.js';
import { NetworkManager } from './network/NetworkManager.js';

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set up pixel art rendering
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Initialize network manager
    const networkManager = new NetworkManager();
    
    // Initialize game engine
    const gameEngine = new GameEngine(canvas, networkManager);
    
    // Start the game
    gameEngine.start();
    
    console.log('Sacrifices Must Be Made - Game Initialized');
});