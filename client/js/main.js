import { GameEngine } from './engine/GameEngine.js';
import { NetworkManager } from './network/NetworkManager.js';

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    
    // Initialize network manager
    const networkManager = new NetworkManager();
    
    // Initialize game engine (handles all canvas setup)
    const gameEngine = new GameEngine(canvas, networkManager);
    
    // Start the game
    gameEngine.start();
    
    console.log('Sacrifices Must Be Made - Game Initialized');
});