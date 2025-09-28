import { Player } from './Player.js';
import { SpriteManager, SpriteRenderer } from './SpriteManager.js';
import { SpriteLoader } from './SpriteLoader.js';
import { BackgroundManager } from './BackgroundManager.js';
import { BackgroundLoader } from './BackgroundLoader.js';
import { LevelManager } from './LevelManager.js';
import { DialogueSystem } from './DialogueSystem.js';
import { TutorialManager } from './TutorialManager.js';
import { CombatSystem } from './CombatSystem.js';
import { EnemyManager } from './Enemy.js';
import { DeathManager } from './DeathManager.js';
import { CharacterManager } from './CharacterManager.js';
import { DeveloperSettings } from './DeveloperSettings.js';
import { HUDManager } from './HUDManager.js';
import { VisualEffectsManager } from './VisualEffectsManager.js';
import { AudioManager } from './AudioManager.js';
// import { ValidationManager } from './ValidationManager.js'; // Removed for compatibility
import { InteractiveSystem } from './InteractiveSystem.js';
import { StoryManager } from './StoryManager.js';
import { PowerUpManager } from './PowerUpManager.js';
import { DialogueUI } from './DialogueUI.js';
// import { MiniGameSystem } from './MiniGameSystem.js';

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
        this.spriteLoader = new SpriteLoader(this.spriteManager);
        this.spriteRenderer = new SpriteRenderer(this.ctx, this.spriteManager);
        
        // Background system
        this.backgroundManager = new BackgroundManager();
        this.backgroundLoader = new BackgroundLoader();

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

        // Developer settings
        this.developerSettings = new DeveloperSettings(this);

        // HUD system
        this.hudManager = new HUDManager(this);

        // Visual effects system
        this.visualEffectsManager = new VisualEffectsManager(this);

        // Audio system
        this.audioManager = new AudioManager();

        // Validation system (disabled for compatibility)
        // this.validationManager = new ValidationManager(this);

        // Interactive system
        this.interactiveSystem = new InteractiveSystem(this);

        // Story system
        this.storyManager = new StoryManager(this);

        // Power-up system
        this.powerUpManager = new PowerUpManager(this);

        // Dialogue UI system
        this.dialogueUI = new DialogueUI(this);

        // Mini-game system
        // this.miniGameSystem = new MiniGameSystem(this);

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

        // Initialize sprites and create test player (async)
        this.initializeGame();

        // Initialize audio system
        this.initializeAudio();

        // Initial resize
        this.handleResize();
    }

    async initializeGame() {
        // Initialize sprites and backgrounds in parallel
        const [spriteResult, backgroundResult] = await Promise.allSettled([
            this.initializeSprites(),
            this.backgroundLoader.preloadAllBackgrounds()
        ]);
        
        if (spriteResult.status === 'rejected') {
            console.error('Failed to load sprites:', spriteResult.reason);
        }
        
        if (backgroundResult.status === 'rejected') {
            console.error('Failed to load backgrounds:', backgroundResult.reason);
        }
        
        // Then create test player
        this.createTestPlayer();
        
        // Initialize power-up system
        this.powerUpManager.initialize();
        
        console.log('Game sprites, backgrounds, and entities initialized');
    }



    async initializeAudio() {
        console.log('Initializing audio system...');
        try {
            // Load audio assets (this will handle missing files gracefully)
            await this.audioManager.loadAudioAssets();
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Audio system initialization failed, continuing without audio:', error);
        }
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
    
    async startMultiplayerGame(gameData) {
        console.log('Starting multiplayer game with data:', gameData);
        console.log('NetworkManager playerId:', this.networkManager.playerId);
        console.log('Players in gameData:', gameData.players?.length || 0);
        
        // Debug: Log all player data
        if (gameData.players) {
            gameData.players.forEach((playerData, index) => {
                console.log(`Player ${index}:`, playerData.name, playerData.id);
            });
        }
        
        // Remove test player if it exists
        if (this.players.has('test-player')) {
            this.players.delete('test-player');
            console.log('Removed test player for multiplayer game');
        }
        
        // Add/update players from server data (don't clear all players)
        if (gameData.players) {
            gameData.players.forEach(playerData => {
                const playerId = playerData.id;
                
                // Check if player already exists
                if (this.players.has(playerId)) {
                    console.log('Player already exists, updating:', playerData.name);
                    // Update existing player
                    const existingPlayer = this.players.get(playerId);
                    if (playerData.position) {
                        existingPlayer.x = playerData.position.x;
                        existingPlayer.y = playerData.position.y;
                    }
                } else {
                    // Create new player
                    const player = this.createPlayerFromData(playerData);
                    this.players.set(playerId, player);
                    console.log('Added new player to game:', player.name, playerId);
                }
                
                // Set local player ID if this is our player
                if (playerId === this.networkManager.playerId) {
                    this.localPlayerId = playerId;
                    console.log('Set local player ID:', this.localPlayerId);
                }
            });
        }
        
        console.log('Created', this.players.size, 'multiplayer players');
        console.log('All players in game:', Array.from(this.players.keys()));
        
        // Set up multiplayer state
        this.gameState = 'playing';
        
        // Start with Level 0
        await this.levelManager.changeLevel(0);
        
        // Debug: Check canvas state
        console.log('GameEngine: Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
        console.log('GameEngine: Canvas style:', this.canvas.style.display);
        console.log('GameEngine: Canvas parent:', this.canvas.parentElement?.id);
        
        // Set up network callbacks for multiplayer synchronization
        this.setupMultiplayerCallbacks();
        
        // Start the game loop
        this.start();
        
        console.log('Multiplayer game started successfully');
    }

    /**
     * Create a player from server data
     */
    createPlayerFromData(playerData) {
        const playerId = playerData.id;
        const playerName = playerData.name;
        const x = playerData.position?.x || 100;
        const y = playerData.position?.y || 100;
        
        const player = new Player({
            id: playerId,
            name: playerName,
            x: x,
            y: y,
            color: this.getPlayerColor(playerId),
            isLocal: playerId === this.networkManager.playerId
        });
        
        // Set network manager reference for network actions
        player.setNetworkManager(this.networkManager);
        
        console.log('Created player:', player.name, 'at', player.x, player.y, 'isLocal:', player.isLocal);
        return player;
    }

    /**
     * Get a unique color for each player
     */
    getPlayerColor(playerId) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        const hash = playerId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return colors[Math.abs(hash) % colors.length];
    }

    /**
     * Set up multiplayer network callbacks
     */
    setupMultiplayerCallbacks() {
        // Set reference to game engine for validation
        this.networkManager.gameEngine = this;
        
        // Handle game state updates from server
        this.networkManager.onGameStateUpdate = (gameState) => {
            this.handleGameStateUpdate(gameState);
        };

        // Handle individual player actions from other players
        this.networkManager.onPlayerAction = (data) => {
            this.handlePlayerAction(data);
        };
    }

    /**
     * Handle game state updates from server
     */
    handleGameStateUpdate(gameState) {
        if (!gameState.players) return;
        
        // Update existing players or create new ones
        gameState.players.forEach(serverPlayer => {
            const playerId = serverPlayer.id;
            const playerName = serverPlayer.name;
            let player = this.players.get(playerId);
            
            if (!player) {
                // Create new player if they don't exist
                player = this.createPlayerFromData(serverPlayer);
                this.players.set(playerId, player);
                console.log('Added new player from server:', playerName);
            } else {
                // Only update remote players' positions from authoritative server state
                // Local player position is handled by local input prediction
                if (playerId !== this.localPlayerId) {
                    if (serverPlayer.position) {
                        // Use smooth interpolation for remote players
                        this.smoothUpdatePlayerPosition(player, serverPlayer.position.x, serverPlayer.position.y);
                    }
                    player.health = serverPlayer.health || player.health;
                    player.isAlive = serverPlayer.isAlive !== false;
                } else {
                    // For local player, only update health and alive status from server
                    // Position is client-authoritative with server validation
                    player.health = serverPlayer.health || player.health;
                    player.isAlive = serverPlayer.isAlive !== false;
                }
            }
        });
        
        // Remove players that are no longer in the game
        const serverPlayerIds = new Set(gameState.players.map(p => p.id));
        for (const [playerId, player] of this.players) {
            if (!serverPlayerIds.has(playerId)) {
                this.players.delete(playerId);
                console.log('Removed player:', player.name);
            }
        }
    }

    /**
     * Handle individual player actions from other players
     */
    handlePlayerAction(data) {
        const { playerId, action } = data;
        
        // Don't process our own actions (we already handle them locally)
        if (playerId === this.localPlayerId) return;
        
        const player = this.players.get(playerId);
        if (!player) {
            console.warn('Received action for unknown player:', playerId);
            return;
        }
        
        // Apply the action to the player with smooth interpolation
        switch (action.type) {
            case 'move':
                // Use smooth interpolation for movement updates
                this.smoothUpdatePlayerPosition(player, action.x, action.y);
                player.direction = action.direction;
                player.isMoving = action.isMoving;
                break;
                
            case 'attack':
                // Handle attack animation/effects
                player.direction = action.direction;
                // Trigger attack animation/effects
                if (this.combatSystem) {
                    this.combatSystem.showAttackEffect(player.x, player.y, player.direction);
                }
                break;
                
            case 'dash':
                // For dash, update position immediately for responsiveness
                player.x = action.x;
                player.y = action.y;
                player.direction = action.direction;
                player.isDashing = true;
                // Could trigger dash animation here
                break;
        }
    }

    /**
     * Smoothly interpolate player position to reduce jittering
     */
    smoothUpdatePlayerPosition(player, targetX, targetY) {
        if (!player.targetPosition) {
            player.targetPosition = { x: targetX, y: targetY };
            player.interpolationSpeed = 10; // Adjust for smoothness vs responsiveness
        }
        
        // Update target position
        player.targetPosition.x = targetX;
        player.targetPosition.y = targetY;
        
        // Don't interpolate if the distance is too large (teleport instead)
        const distance = Math.sqrt(
            Math.pow(targetX - player.x, 2) + 
            Math.pow(targetY - player.y, 2)
        );
        
        if (distance > 80) {
            // Teleport for large distances (likely a correction or dash)
            player.x = targetX;
            player.y = targetY;
            console.log(`Teleported player ${player.name} due to large distance: ${distance.toFixed(1)}`);
        }
        // Interpolation will be handled in the update loop
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

        // Clean up audio system
        if (this.audioManager) {
            this.audioManager.destroy();
        }

        // Clean up validation system (disabled for compatibility)
        // if (this.validationManager) {
        //     this.validationManager.destroy();
        // }

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
            const wasMoving = player.isMoving;
            const wasDashing = player.isDashing;
            const prevX = player.x;
            const prevY = player.y;
            
            // Handle smooth interpolation for remote players
            if (player.id !== this.localPlayerId && player.targetPosition) {
                const dx = player.targetPosition.x - player.x;
                const dy = player.targetPosition.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0.5) { // Only interpolate if there's a meaningful distance
                    const speed = player.interpolationSpeed || 10;
                    const moveDistance = speed * deltaTime * 60; // 60fps normalized
                    
                    if (distance <= moveDistance) {
                        // Close enough, snap to target
                        player.x = player.targetPosition.x;
                        player.y = player.targetPosition.y;
                    } else {
                        // Interpolate towards target
                        const ratio = moveDistance / distance;
                        player.x += dx * ratio;
                        player.y += dy * ratio;
                    }
                } else if (distance > 0) {
                    // Very close, just snap to avoid micro-movements
                    player.x = player.targetPosition.x;
                    player.y = player.targetPosition.y;
                }
            }
            
            // Update player logic (only for local player or non-networked updates)
            if (player.id === this.localPlayerId) {
                player.update(deltaTime, this.keys, this.canvas.width, this.canvas.height);
            } else {
                // For remote players, only update non-position related things
                player.updateCooldowns(deltaTime);
                player.updateAnimation(deltaTime);
            }
            
            // Send network updates for local player only
            if (player.id === this.localPlayerId && player.isAlive) {
                // Send movement updates if position changed significantly (deadband to prevent spam)
                const positionChanged = Math.abs(player.x - prevX) > 1.0 || Math.abs(player.y - prevY) > 1.0;
                const stateChanged = player.isMoving !== wasMoving || player.isDashing !== wasDashing;
                
                if (positionChanged || stateChanged) {
                    player.sendMovementAction();
                }
                
                // Play sound effects
                if (this.audioManager) {
                    // Movement sound
                    if (player.isMoving && !wasMoving) {
                        this.audioManager.playSFX('player_move', 0.3);
                    }
                    
                    // Dash sound
                    if (player.isDashing && !wasDashing) {
                        this.audioManager.playSFX('player_dash', 0.7);
                    }
                }
            }
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
        
        // Handle level input
        this.levelManager.handleInput(this.keys);

        // Update dialogue system
        this.dialogueSystem.update(deltaTime, players);

        // Update tutorial system
        this.tutorialManager.update(deltaTime, players);

        // Update interactive system
        this.interactiveSystem.update(deltaTime, players);

        // Update story system
        this.storyManager.update(deltaTime);

        // Update power-up system
        this.powerUpManager.update(deltaTime, players);

        // Update dialogue UI
        this.dialogueUI.update(deltaTime);

        // Update mini-game system
        // this.miniGameSystem.update(deltaTime, players);

        // Update developer settings
        this.developerSettings.update(deltaTime);

        // Update HUD system
        this.hudManager.update(deltaTime);

        // Update visual effects system
        this.visualEffectsManager.update(deltaTime);
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
        // Debug: Log render calls
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
            console.log('GameEngine render called, gameState:', this.gameState, 'currentLevel:', this.levelManager.currentLevelNumber);
        }

        // Render character selection screen
        if (this.gameState === 'character_selection') {
            this.renderCharacterSelection();
            return;
        }

        // Render current level (includes background clearing)
        this.levelManager.render(this.ctx, this.spriteRenderer);

        // Render enemies
        this.enemyManager.render(this.ctx, this.spriteRenderer);

        // Render interactive objects
        this.interactiveSystem.render(this.ctx);

        // Render power-ups
        this.powerUpManager.render(this.ctx);

        // Render mini-games
        // this.miniGameSystem.render(this.ctx);

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

        // Render dialogue UI (bottom dialogue box)
        this.dialogueUI.render(this.ctx);

        // Render death manager (game over screen, death messages)
        this.deathManager.render(this.ctx);

        // Render visual effects (particles, screen shake, etc.)
        this.visualEffectsManager.render();

        // Render HUD system (on top of game elements)
        this.hudManager.render();

        // Render debug info
        // this.renderDebugInfo();

        // Render developer settings debug info
        this.developerSettings.renderDebugInfo(this.ctx);
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

        // Handle audio controls
        if (event.code === 'KeyM') {
            event.preventDefault();
            this.audioManager.toggleMute();
            return;
        }

        // Volume controls (number keys 1-9 for master volume)
        if (event.code >= 'Digit1' && event.code <= 'Digit9' && this.gameState === 'playing') {
            const volume = parseInt(event.code.slice(-1)) / 10;
            this.audioManager.setMasterVolume(volume);
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
                // Send validated attack action to server
                const attackSent = localPlayer.sendAttackAction();
                
                // Only execute local attack if validation passed
                if (attackSent !== false) {
                    this.combatSystem.tryPlayerAttack(localPlayer.id, 0, 0); // Position not needed for swing attacks
                }
            }
        }

        // Handle super attack (Q key)
        if (event.code === 'KeyQ' && !this.deathManager.isGameOver() && this.gameState === 'playing') {
            event.preventDefault();
            const localPlayer = this.getLocalPlayer();
            if (localPlayer && localPlayer.isAlive) {
                const success = this.powerUpManager.handleSuperAttack(localPlayer);
                if (success) {
                    // Play super attack sound
                    this.audioManager.playSFX('super_attack');
                }
            }
        }

        // Handle super speed activation (C key)
        if (event.code === 'KeyC' && !this.deathManager.isGameOver() && this.gameState === 'playing') {
            event.preventDefault();
            const localPlayer = this.getLocalPlayer();
            if (localPlayer && localPlayer.isAlive) {
                // Check if player has super speed power-up available
                this.tryActivateSuperSpeed(localPlayer);
            }
        }

        // Handle NPC interaction (E key)
        if (event.code === 'KeyE' && !this.deathManager.isGameOver() && this.gameState === 'playing') {
            event.preventDefault();
            
            // Check if dialogue UI is active first
            if (this.dialogueUI.isActive()) {
                this.dialogueUI.handleInput('KeyE');
            } else {
                // Check for nearby NPCs
                const localPlayer = this.getLocalPlayer();
                if (localPlayer && localPlayer.isAlive) {
                    this.checkNPCInteraction(localPlayer);
                }
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
        // this.updateResolutionInfo();

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

    async initializeSprites() {
        // Load all game sprites using the comprehensive sprite loader
        await this.spriteLoader.loadAllSprites();
        
        // Create backward compatibility sprites for existing player IDs
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
        const testPlayer = new Player({
            id: 'test-player',
            name: 'test-player',
            x: 100,
            y: 100,
            color: '#00ff00',
            isLocal: true
        });

        // Apply default character stats (scout)
        this.characterManager.applyCharacterStats(testPlayer, 'scout');
        
        // Set up network manager for validation
        if (this.networkManager) {
            testPlayer.setNetworkManager(this.networkManager);
        }

        this.players.set('test-player', testPlayer);
        this.localPlayerId = 'test-player';
    }

    addPlayer(id, x, y, color) {
        const player = new Player(id, x, y, color);
        
        // Set up network manager for validation
        if (this.networkManager) {
            player.setNetworkManager(this.networkManager);
        }
        
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

    // Visual effects management access
    getVisualEffectsManager() {
        return this.visualEffectsManager;
    }

    // Audio management access
    getAudioManager() {
        return this.audioManager;
    }

    // Background loading access
    getBackgroundLoader() {
        return this.backgroundLoader;
    }

    // Power-up system access
    getPowerUpManager() {
        return this.powerUpManager;
    }

    /**
     * Try to activate super speed for player
     */
    tryActivateSuperSpeed(player) {
        // Check if player has super speed available in inventory
        const playerPowerUps = this.powerUpManager.getPlayerPowerUps(player.id);
        
        // For now, allow manual super speed activation if player has collected one recently
        // In a full implementation, this would check inventory
        if (!playerPowerUps.has('super_speed')) {
            // Spawn a super speed power-up for testing
            this.powerUpManager.spawnPowerUp('super_speed', player.x, player.y);
            console.log('Super speed power-up spawned for testing');
        }
    }

    /**
     * Check for NPC interaction
     */
    checkNPCInteraction(player) {
        const currentLevel = this.getCurrentLevel();
        if (!currentLevel || !currentLevel.npcs) return;

        // Check all NPCs in current level
        for (const npc of currentLevel.npcs) {
            if (!npc.isActive || !npc.isVisible) continue;

            const distance = Math.sqrt(
                Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2)
            );

            if (distance < npc.interactionRadius) {
                // Start dialogue with this NPC
                this.dialogueUI.showDialogue(npc);
                console.log(`Started dialogue with ${npc.name || npc.id}`);
                return;
            }
        }
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

        // Audio info
        if (this.audioManager) {
            const volumeSettings = this.audioManager.getVolumeSettings();
            this.ctx.fillText(`Audio: Master ${Math.round(volumeSettings.master * 100)}% | Music ${Math.round(volumeSettings.music * 100)}% | SFX ${Math.round(volumeSettings.sfx * 100)}%`, 10, 155);
            this.ctx.fillText(`Muted: ${volumeSettings.isMuted}`, 10, 170);
        }

        // Controls
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('Controls: WASD to move, SPACE to attack, SHIFT to dash, F for fullscreen, M to mute, 1-9 for volume', 10, this.canvas.height - 20);
    }
}