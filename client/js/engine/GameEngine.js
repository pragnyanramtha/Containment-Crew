import { Player } from './Player.js';
import { SpriteManager, SpriteRenderer } from './SpriteManager.js';
import { LevelManager } from './LevelManager.js';
import { DialogueSystem } from './DialogueSystem.js';
import { TutorialManager } from './TutorialManager.js';
import { CombatSystem } from './CombatSystem.js';
import { EnemyManager } from './Enemy.js';
import { DeathManager } from './DeathManager.js';
import { CharacterManager } from './CharacterManager.js';

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

        // Dialogue system
        this.dialogueSystem = new DialogueSystem(this);

        // Tutorial system
        this.tutorialManager = new TutorialManager(this);

        // Combat system
        this.combatSystem = new CombatSystem(this);

        // Enemy management
        this.enemyManager = new EnemyManager(this);

        // Death management
        this.deathManager = new DeathManager(this);

        // Character management
        this.characterManager = new CharacterManager();

        // Game state
        this.gameState = 'character_selection'; // 'character_selection', 'playing'
        this.selectedCharacter = null;

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

    createEnemySprites() {
        // Create zombie sprites
        const zombieColors = {
            body: '#44aa44',
            indicator: '#ffffff',
            border: '#224422'
        };

        const bossColors = {
            body: '#aa4444',
            indicator: '#ffffff',
            border: '#442222'
        };

        this.spriteManager.createDirectionalSprites('zombie_weak', 28, 28, zombieColors);
        this.spriteManager.createDirectionalSprites('zombie_normal', 32, 32, zombieColors);
        this.spriteManager.createDirectionalSprites('mutant_boss', 48, 48, bossColors);
    }

    start() {
        console.log('Starting game engine...');
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);

        // Start with character selection
        this.gameState = 'character_selection';
        console.log('Please select your character...');
    }

    async startGame() {
        console.log('Starting game with Level 0...');
        this.gameState = 'playing';
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

        // Clean up dialogue system
        if (this.dialogueSystem) {
            this.dialogueSystem.destroy();
        }

        // Clean up tutorial system
        if (this.tutorialManager) {
            this.tutorialManager.destroy();
        }

        // Clean up combat system
        if (this.combatSystem) {
            // Combat system doesn't need explicit cleanup
        }

        // Clean up enemy manager
        if (this.enemyManager) {
            this.enemyManager.clearAllEnemies();
        }

        // Clean up death manager
        if (this.deathManager) {
            this.deathManager.reset();
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
        // Don't update game logic during character selection
        if (this.gameState === 'character_selection') {
            return;
        }

        // Don't update if game is over
        if (this.deathManager.isGameOver()) {
            this.deathManager.update(deltaTime);
            return;
        }

        const players = Array.from(this.players.values());
        const currentLevel = this.getCurrentLevel();

        // Update all players
        for (const player of players) {
            player.update(deltaTime, this.keys, this.canvas.width, this.canvas.height);
        }

        // Update combat system
        this.combatSystem.update(deltaTime);

        // Handle combat input (only if playing)
        if (this.gameState === 'playing') {
            this.combatSystem.handleInput(this.keys);
        }

        // Update enemy manager
        this.enemyManager.update(deltaTime, players, currentLevel);

        // Update combat between enemies and players
        this.updateCombatInteractions(deltaTime);

        // Update death manager
        this.deathManager.update(deltaTime);

        // Update level manager
        this.levelManager.update(deltaTime, players);

        // Update dialogue system
        this.dialogueSystem.update(deltaTime, players);

        // Update tutorial system
        this.tutorialManager.update(deltaTime, players);
    }

    updateCombatInteractions(deltaTime) {
        const players = Array.from(this.players.values());
        const enemies = this.enemyManager.getAllEnemies();

        // Check enemy attacks on players
        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;

            for (const player of players) {
                if (!player.isAlive) continue;

                // Try enemy attack
                if (this.combatSystem.tryEnemyAttack(enemy, player)) {
                    // Attack was successful
                    if (!player.isAlive) {
                        this.deathManager.onPlayerDeath(player);
                    }
                }
            }
        }
    }

    render() {
        // Render character selection screen
        if (this.gameState === 'character_selection') {
            this.renderCharacterSelection();
            return;
        }

        // Render current level (includes background clearing)
        this.levelManager.render(this.ctx, this.spriteRenderer);

        // Render enemies
        this.enemyManager.render(this.ctx, this.spriteRenderer);

        // Render all players with sprite system
        for (const player of this.players.values()) {
            player.render(this.ctx, this.spriteRenderer);
        }

        // Render combat effects
        this.combatSystem.render(this.ctx);

        // Render tutorial system
        this.tutorialManager.render(this.ctx);

        // Render dialogue system (on top of everything)
        this.dialogueSystem.render(this.ctx);

        // Render death manager (game over screen, death messages)
        this.deathManager.render(this.ctx);

        // Render debug info
        this.renderDebugInfo();
    }

    renderCharacterSelection() {
        this.characterManager.renderCharacterSelection(this.ctx, this.selectedCharacter);
    }

    setupInputHandlers() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(event) {
        this.keys[event.code] = true;

        // Handle character selection
        if (this.gameState === 'character_selection') {
            this.handleCharacterSelection(event);
            return;
        }

        // Handle fullscreen toggle
        if (event.code === 'KeyF' || event.code === 'F11') {
            event.preventDefault();
            this.handleFullscreen();
            return;
        }

        // Prevent default browser behavior for game keys
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
            event.preventDefault();
        }

        // Handle attack input immediately for responsiveness
        if (event.code === 'Space' && !this.deathManager.isGameOver() && this.gameState === 'playing') {
            const localPlayer = this.getLocalPlayer();
            if (localPlayer && localPlayer.isAlive) {
                this.combatSystem.tryPlayerAttack(localPlayer.id, 0, 0); // Position not needed for swing attacks
            }
        }
    }

    handleCharacterSelection(event) {
        const characters = Object.keys(this.characterManager.getAllCharacterTypes());

        // Number keys 1-5 for character selection
        if (event.code >= 'Digit1' && event.code <= 'Digit5') {
            const index = parseInt(event.code.slice(-1)) - 1;
            if (index < characters.length) {
                this.selectedCharacter = characters[index];
                console.log(`Selected character: ${this.selectedCharacter}`);
            }
        }

        // Enter to confirm selection
        if (event.code === 'Enter' && this.selectedCharacter) {
            this.confirmCharacterSelection();
        }
    }

    confirmCharacterSelection() {
        console.log(`Confirming character selection: ${this.selectedCharacter}`);

        // Apply character to test player
        const testPlayer = this.getLocalPlayer();
        if (testPlayer) {
            this.characterManager.applyCharacterStats(testPlayer, this.selectedCharacter);
            this.characterManager.selectCharacter(testPlayer.id, this.selectedCharacter);
        }

        // Start the game
        this.gameState = 'playing';
        this.startGame();
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

        // Create enemy sprites
        this.createEnemySprites();
    }

    createTestPlayer() {
        // Create a test player for development
        const testPlayer = new Player('test-player', 100, 100, '#00ff00');
        
        // Apply default character stats (scout)
        this.characterManager.applyCharacterStats(testPlayer, 'scout');
        
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

    // Combat system access
    getCombatSystem() {
        return this.combatSystem;
    }

    // Enemy management access
    getEnemyManager() {
        return this.enemyManager;
    }

    // Death management access
    getDeathManager() {
        return this.deathManager;
    }

    renderDebugInfo() {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';

        // FPS counter
        const fps = this.deltaTime > 0 ? Math.round(1 / this.deltaTime) : 0;
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);

        // Player count and status
        const gameStats = this.deathManager.getGameStats();
        this.ctx.fillText(`Players: ${gameStats.alivePlayers}/${gameStats.totalPlayers} alive`, 10, 35);

        // Enemy count
        const aliveEnemies = this.enemyManager.getAliveEnemies().length;
        this.ctx.fillText(`Enemies: ${aliveEnemies}`, 10, 140);

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
        this.ctx.fillText('Controls: WASD to move, SPACE to attack, SHIFT to dash, F for fullscreen', 10, this.canvas.height - 20);
    }
}