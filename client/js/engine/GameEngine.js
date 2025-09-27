import { Player } from './Player.js';
import { SpriteManager, SpriteRenderer } from './SpriteManager.js';
import { LevelManager } from './LevelManager.js';
import { DialogueSystem } from './DialogueSystem.js';

export class GameEngine {
    constructor(canvas, networkManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.networkManager = networkManager;

        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;

        // Resolution and scaling
        this.baseWidth = 1920;
        this.baseHeight = 1080;
        this.pixelRatio = window.devicePixelRatio || 1;
        this.scaleFactor = 1;

        // Players
        this.players = new Map();
        this.localPlayerId = null;

        // Sprite system
        this.spriteManager = new SpriteManager();
        this.spriteRenderer = new SpriteRenderer(this.ctx, this.spriteManager);
        
        // Level management
        this.levelManager = new LevelManager(this);

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleFullscreen = this.handleFullscreen.bind(this);

        // Input state
        this.keys = {};

        // Initialize canvas resolution and pixel art rendering
        this.setupCanvas();
        this.setupPixelArtRendering();

        // Initialize input handlers
        this.setupInputHandlers();
        this.setupResizeHandler();
        this.setupFullscreenHandler();

        // Initialize sprites and create test player
        this.initializeSprites();
        this.createTestPlayer();

        // Initial resize
        this.handleResize();
    }

    start() {
        console.log('Starting game engine...');
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
        
        // Start with Level 0 (Tutorial)
        this.startGame();
    }
    
    async startGame() {
        console.log('Starting game with Level 0...');
        await this.levelManager.changeLevel(0);
    }

    stop() {
        this.isRunning = false;
    }

    destroy() {
        this.stop();

        // Clean up level manager
        if (this.levelManager) {
            this.levelManager.destroy();
        }

        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);

        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.removeEventListener('click', this.handleFullscreen);
        }

        document.removeEventListener('fullscreenchange', this.handleResize);
        document.removeEventListener('webkitfullscreenchange', this.handleResize);
        document.removeEventListener('mozfullscreenchange', this.handleResize);
        document.removeEventListener('MSFullscreenChange', this.handleResize);
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
        
        // Update level manager
        this.levelManager.update(deltaTime, Array.from(this.players.values()));
    }

    render() {
        // Render current level (includes background clearing)
        this.levelManager.render(this.ctx, this.spriteRenderer);

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

        // Handle fullscreen toggle
        if (event.code === 'KeyF' || event.code === 'F11') {
            event.preventDefault();
            this.handleFullscreen();
            return;
        }

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

    setupCanvas() {
        // Set initial canvas size
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
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

    setupResizeHandler() {
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);
    }

    setupFullscreenHandler() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', this.handleFullscreen);
        }

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', this.handleResize);
        document.addEventListener('webkitfullscreenchange', this.handleResize);
        document.addEventListener('mozfullscreenchange', this.handleResize);
        document.addEventListener('MSFullscreenChange', this.handleResize);
    }

    handleResize() {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate scale to fit viewport while maintaining aspect ratio
        const scaleX = viewportWidth / this.baseWidth;
        const scaleY = viewportHeight / this.baseHeight;
        this.scaleFactor = Math.min(scaleX, scaleY);

        // For pixel art, we want integer scaling when possible for maximum sharpness
        // But allow fractional scaling for better fit on smaller screens
        if (this.scaleFactor >= 1) {
            // Use integer scaling for upscaling to maintain pixel perfect rendering
            this.scaleFactor = Math.floor(this.scaleFactor);
            if (this.scaleFactor < 1) this.scaleFactor = 1;
        }

        // Calculate actual display size
        const displayWidth = this.baseWidth * this.scaleFactor;
        const displayHeight = this.baseHeight * this.scaleFactor;

        // Set canvas style size (what user sees)
        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;

        // Keep internal resolution consistent for crisp rendering
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;

        // Reapply pixel art settings after canvas resize
        this.setupPixelArtRendering();

        // Update resolution info
        this.updateResolutionInfo();

        console.log(`Canvas resized: ${displayWidth}x${displayHeight} (scale: ${this.scaleFactor.toFixed(2)})`);
    }

    handleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    updateResolutionInfo() {
        const resolutionInfo = document.getElementById('resolutionInfo');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (resolutionInfo) {
            const displayWidth = Math.round(this.baseWidth * this.scaleFactor);
            const displayHeight = Math.round(this.baseHeight * this.scaleFactor);
            const isFullscreen = !!document.fullscreenElement;

            resolutionInfo.textContent =
                `${displayWidth}x${displayHeight} | Scale: ${this.scaleFactor.toFixed(2)} | ${isFullscreen ? 'Fullscreen' : 'Windowed'}`;
        }

        if (fullscreenBtn) {
            const isFullscreen = !!document.fullscreenElement;
            fullscreenBtn.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
        }
    }

    initializeSprites() {
        // Create directional sprites for different player colors
        const playerColors = [
            { body: '#00ff00', indicator: '#ffffff', border: '#004400' }, // Green
            { body: '#0088ff', indicator: '#ffffff', border: '#004488' }, // Blue  
            { body: '#ff8800', indicator: '#ffffff', border: '#884400' }  // Orange
        ];

        playerColors.forEach((colors, index) => {
            const playerName = `player_${index + 1}`;
            this.spriteManager.createDirectionalSprites(playerName, 32, 32, colors);
        });

        // Create test player sprite
        this.spriteManager.createDirectionalSprites('player_test-player', 32, 32, playerColors[0]);
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
    
    // Level management methods
    getCurrentLevel() {
        return this.levelManager.getCurrentLevel();
    }
    
    getCurrentLevelNumber() {
        return this.levelManager.getCurrentLevelNumber();
    }
    
    async changeLevel(levelNumber) {
        return await this.levelManager.changeLevel(levelNumber);
    }

    renderDebugInfo() {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';

        // FPS counter
        const fps = this.deltaTime > 0 ? Math.round(1 / this.deltaTime) : 0;
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);

        // Player count
        this.ctx.fillText(`Players: ${this.players.size}`, 10, 35);

        // Level info
        const currentLevel = this.levelManager.getCurrentLevelNumber();
        const levelConfig = this.levelManager.getLevelConfig(currentLevel);
        this.ctx.fillText(`Level: ${currentLevel} - ${levelConfig ? levelConfig.name : 'Unknown'}`, 10, 50);

        // Resolution info
        this.ctx.fillText(`Resolution: ${this.canvas.width}x${this.canvas.height}`, 10, 65);
        this.ctx.fillText(`Scale: ${this.scaleFactor.toFixed(2)}x`, 10, 80);

        // Local player position
        const localPlayer = this.getLocalPlayer();
        if (localPlayer) {
            this.ctx.fillText(`Pos: ${Math.round(localPlayer.x)}, ${Math.round(localPlayer.y)}`, 10, 95);
            this.ctx.fillText(`Dir: ${localPlayer.direction}`, 10, 110);
            this.ctx.fillText(`Moving: ${localPlayer.isMoving}`, 10, 125);
        }

        // Controls
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('Controls: WASD to move, F for fullscreen', 10, this.canvas.height - 20);
    }
}