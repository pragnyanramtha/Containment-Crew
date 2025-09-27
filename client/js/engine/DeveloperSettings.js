/**
 * Developer Settings System
 * Provides debugging and development tools for the game
 */
export class DeveloperSettings {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.enabled = false;
        this.visible = false;
        
        // Settings
        this.settings = {
            levelSkipping: true,
            godMode: false,
            showDebugInfo: false,
            unlimitedHealth: false,
            fastMovement: false
        };
        
        // UI elements
        this.panel = null;
        this.overlay = null;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Check if developer mode should be enabled (e.g., from URL parameter or localStorage)
        const urlParams = new URLSearchParams(window.location.search);
        const devMode = urlParams.get('dev') === 'true' || localStorage.getItem('devMode') === 'true';
        
        if (devMode) {
            this.enabled = true;
            this.createUI();
            this.bindKeyboardShortcuts();
            console.log('Developer mode enabled');
        }
    }
    
    createUI() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'dev-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: none;
            font-family: monospace;
        `;
        
        // Create panel
        this.panel = document.createElement('div');
        this.panel.id = 'dev-panel';
        this.panel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #222;
            border: 2px solid #555;
            padding: 20px;
            border-radius: 8px;
            color: #fff;
            min-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        this.updatePanelContent();
        
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
    }
    
    updatePanelContent() {
        if (!this.panel) return;
        
        const currentLevel = this.gameEngine.levelManager?.getCurrentLevelNumber() ?? 0;
        const maxLevel = 5; // Adjust based on your game's max level
        
        this.panel.innerHTML = `
            <h2 style="margin-top: 0; color: #ff6666;">🛠️ Developer Settings</h2>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #66ff66;">Level Control</h3>
                <p>Current Level: <strong>${currentLevel}</strong></p>
                <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;">
                    ${Array.from({length: maxLevel + 1}, (_, i) => 
                        `<button onclick="window.devSettings.goToLevel(${i})" 
                                style="padding: 5px 10px; background: ${i === currentLevel ? '#666' : '#444'}; 
                                       color: white; border: 1px solid #777; cursor: pointer; border-radius: 3px;">
                            Level ${i}
                        </button>`
                    ).join('')}
                </div>
                <button onclick="window.devSettings.restartCurrentLevel()" 
                        style="padding: 8px 15px; background: #ff6666; color: white; border: none; cursor: pointer; border-radius: 3px;">
                    Restart Current Level
                </button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #66ff66;">Player Settings</h3>
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" ${this.settings.godMode ? 'checked' : ''} 
                           onchange="window.devSettings.toggleSetting('godMode', this.checked)">
                    God Mode (Invincible)
                </label>
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" ${this.settings.unlimitedHealth ? 'checked' : ''} 
                           onchange="window.devSettings.toggleSetting('unlimitedHealth', this.checked)">
                    Unlimited Health
                </label>
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" ${this.settings.fastMovement ? 'checked' : ''} 
                           onchange="window.devSettings.toggleSetting('fastMovement', this.checked)">
                    Fast Movement (2x Speed)
                </label>
                <button onclick="window.devSettings.healAllPlayers()" 
                        style="padding: 5px 10px; background: #66ff66; color: black; border: none; cursor: pointer; border-radius: 3px; margin-top: 5px;">
                    Heal All Players
                </button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #66ff66;">Debug Options</h3>
                <label style="display: block; margin-bottom: 5px;">
                    <input type="checkbox" ${this.settings.showDebugInfo ? 'checked' : ''} 
                           onchange="window.devSettings.toggleSetting('showDebugInfo', this.checked)">
                    Show Debug Info
                </label>
                <button onclick="window.devSettings.clearAllEnemies()" 
                        style="padding: 5px 10px; background: #ffaa00; color: black; border: none; cursor: pointer; border-radius: 3px; margin-right: 5px;">
                    Clear All Enemies
                </button>
                <button onclick="window.devSettings.spawnTestEnemy()" 
                        style="padding: 5px 10px; background: #aa66ff; color: white; border: none; cursor: pointer; border-radius: 3px;">
                    Spawn Test Enemy
                </button>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #555;">
                <button onclick="window.devSettings.hide()" 
                        style="padding: 8px 20px; background: #555; color: white; border: none; cursor: pointer; border-radius: 3px;">
                    Close (ESC)
                </button>
            </div>
            
            <div style="margin-top: 15px; font-size: 12px; color: #888; text-align: center;">
                Press F1 to toggle this panel | Press F2 to toggle debug info
            </div>
        `;
    }
    
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            
            // F1 - Toggle developer panel
            if (e.key === 'F1') {
                e.preventDefault();
                this.toggle();
            }
            
            // F2 - Toggle debug info
            if (e.key === 'F2') {
                e.preventDefault();
                this.toggleSetting('showDebugInfo', !this.settings.showDebugInfo);
            }
            
            // ESC - Close panel
            if (e.key === 'Escape' && this.visible) {
                e.preventDefault();
                this.hide();
            }
            
            // Number keys 0-9 for quick level switching
            if (e.ctrlKey && e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                const level = parseInt(e.key);
                this.goToLevel(level);
            }
        });
        
        // Make functions globally accessible for HTML onclick handlers
        window.devSettings = this;
    }
    
    show() {
        if (!this.enabled || !this.overlay) return;
        this.visible = true;
        this.updatePanelContent();
        this.overlay.style.display = 'block';
    }
    
    hide() {
        if (!this.enabled || !this.overlay) return;
        this.visible = false;
        this.overlay.style.display = 'none';
    }
    
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    // Level control methods
    goToLevel(levelNumber) {
        console.log(`Developer: Jumping to level ${levelNumber}`);
        if (this.gameEngine.levelManager) {
            this.gameEngine.levelManager.changeLevel(levelNumber);
        }
        this.hide();
    }
    
    restartCurrentLevel() {
        console.log('Developer: Restarting current level');
        if (this.gameEngine.levelManager) {
            const currentLevel = this.gameEngine.levelManager.getCurrentLevelNumber();
            this.gameEngine.levelManager.restartFromLevel(currentLevel);
        }
        this.hide();
    }
    
    // Player control methods
    toggleSetting(setting, value) {
        this.settings[setting] = value;
        console.log(`Developer: ${setting} = ${value}`);
        
        // Apply setting effects
        this.applySettings();
        
        // Update UI if visible
        if (this.visible) {
            this.updatePanelContent();
        }
    }
    
    applySettings() {
        if (!this.gameEngine.players) return;
        
        // Apply settings to all players
        for (const player of this.gameEngine.players.values()) {
            if (this.settings.godMode) {
                player.isInvincible = true;
            } else {
                player.isInvincible = false;
            }
            
            if (this.settings.unlimitedHealth) {
                player.health = player.maxHealth;
            }
            
            if (this.settings.fastMovement) {
                player.speedMultiplier = 2.0;
            } else {
                player.speedMultiplier = 1.0;
            }
        }
    }
    
    healAllPlayers() {
        console.log('Developer: Healing all players');
        if (!this.gameEngine.players) return;
        
        for (const player of this.gameEngine.players.values()) {
            player.health = player.maxHealth;
            console.log(`Healed player ${player.id} to full health`);
        }
    }
    
    clearAllEnemies() {
        console.log('Developer: Clearing all enemies');
        const enemyManager = this.gameEngine.getEnemyManager();
        if (enemyManager) {
            enemyManager.clearAllEnemies();
        }
    }
    
    spawnTestEnemy() {
        console.log('Developer: Spawning test enemy');
        const enemyManager = this.gameEngine.getEnemyManager();
        if (enemyManager) {
            // Spawn a zombie at a random position
            const x = 200 + Math.random() * 400;
            const y = 200 + Math.random() * 400;
            enemyManager.spawnEnemy('zombie', x, y);
        }
    }
    
    // Debug rendering
    renderDebugInfo(ctx) {
        if (!this.enabled || !this.settings.showDebugInfo) return;
        
        const currentLevel = this.gameEngine.levelManager?.getCurrentLevelNumber() ?? 0;
        const playerCount = this.gameEngine.players?.size ?? 0;
        const enemyCount = this.gameEngine.getEnemyManager()?.getAliveEnemies()?.length ?? 0;
        
        // Debug info panel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 250, 120);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('🛠️ DEBUG INFO', 15, 25);
        ctx.fillText(`Level: ${currentLevel}`, 15, 40);
        ctx.fillText(`Players: ${playerCount}`, 15, 55);
        ctx.fillText(`Enemies: ${enemyCount}`, 15, 70);
        ctx.fillText(`God Mode: ${this.settings.godMode ? 'ON' : 'OFF'}`, 15, 85);
        ctx.fillText(`Fast Movement: ${this.settings.fastMovement ? 'ON' : 'OFF'}`, 15, 100);
        ctx.fillText('F1: Dev Panel | F2: Toggle Debug', 15, 115);
        
        // Show player positions and health
        if (this.gameEngine.players) {
            let yOffset = 140;
            for (const player of this.gameEngine.players.values()) {
                const health = `${player.health}/${player.maxHealth}`;
                const pos = `(${Math.round(player.x)}, ${Math.round(player.y)})`;
                ctx.fillText(`${player.id}: ${health} ${pos}`, 15, yOffset);
                yOffset += 15;
            }
        }
    }
    
    // Update method to apply continuous effects
    update(deltaTime) {
        if (!this.enabled) return;
        
        // Apply unlimited health continuously
        if (this.settings.unlimitedHealth && this.gameEngine.players) {
            for (const player of this.gameEngine.players.values()) {
                if (player.health < player.maxHealth) {
                    player.health = player.maxHealth;
                }
            }
        }
    }
    
    // Enable developer mode programmatically
    static enable() {
        localStorage.setItem('devMode', 'true');
        window.location.reload();
    }
    
    // Disable developer mode
    static disable() {
        localStorage.removeItem('devMode');
        window.location.reload();
    }
}