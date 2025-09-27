import { Player } from './Player.js';
import { SpriteManager, SpriteRenderer } from './SpriteManager.js';

export class GameEngine {
    constructor(canvas, networkManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.networkManager = networkManager;
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Players
        this.players = new Map();
        this.localPlayerId = null;
        
        // Sprite system
        this.spriteManager = new SpriteManager();
        this.spriteRenderer = new SpriteRenderer(this.ctx, this.spriteManager);
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Input state
        this.keys = {};
        
        // Initialize canvas for pixel art rendering
        this.setupPixelArtRendering();
        
        // Initialize input handlers
        this.setupInputHandlers();
        
        // Initialize sprites and create test player
        this.initializeSprites();
        this.createTestPlayer();
    }
    
    start() {
        console.log('Starting game engine...');
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update game state
        this.update(this.deltaTime);
        
        // Render frame
        this.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Update all players
        for (const player of this.players.values()) {
            player.update(deltaTime, this.keys, this.canvas.width, this.canvas.height);
        }
    }
    
    render() {
        // Clear canvas with dark background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render all players with sprite system
        for (const player of this.players.values()) {
            player.render(this.ctx, this.spriteRenderer);
        }
        
        // Render debug info
        this.renderDebugInfo();
    }
    
    setupInputHandlers() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }
    
    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // Prevent default browser behavior for game keys
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    isKeyPressed(keyCode) {
        return !!this.keys[keyCode];
    }
    
    setupPixelArtRendering() {
        // Disable image smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // Set pixel art friendly font rendering
        this.ctx.textRenderingOptimization = 'optimizeSpeed';
        
        // Set default font for pixel art style
        this.ctx.font = '12px monospace';
    }
    
    createTestPlayer() {
        // Create a test player for development
        const testPlayer = new Player('test-player', 100, 100, '#00ff00');
        this.players.set('test-player', testPlayer);
        this.localPlayerId = 'test-player';
    }
    
    addPlayer(id, x, y, color) {
        const player = new Player(id, x, y, color);
        this.players.set(id, player);
        return player;
    }
    
    removePlayer(id) {
        this.players.delete(id);
    }
    
    getPlayer(id) {
        return this.players.get(id);
    }
    
    getLocalPlayer() {
        return this.players.get(this.localPlayerId);
    }
    
    renderDebugInfo() {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        
        // FPS counter
        const fps = this.deltaTime > 0 ? Math.round(1 / this.deltaTime) : 0;
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);
        
        // Player count
        this.ctx.fillText(`Players: ${this.players.size}`, 10, 35);
        
        // Local player position
        const localPlayer = this.getLocalPlayer();
        if (localPlayer) {
            this.ctx.fillText(`Pos: ${Math.round(localPlayer.x)}, ${Math.round(localPlayer.y)}`, 10, 50);
            this.ctx.fillText(`Dir: ${localPlayer.direction}`, 10, 65);
            this.ctx.fillText(`Moving: ${localPlayer.isMoving}`, 10, 80);
        }
        
        // Controls
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('Controls: WASD to move', 10, this.canvas.height - 20);
    }
}