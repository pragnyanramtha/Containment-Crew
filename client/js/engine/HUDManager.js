export class HUDManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = gameEngine.canvas;
        this.ctx = gameEngine.ctx;
        
        // HUD configuration
        this.hudConfig = {
            healthBar: {
                width: 200,
                height: 20,
                margin: 10,
                backgroundColor: '#333333',
                borderColor: '#ffffff',
                healthColor: '#00ff00',
                lowHealthColor: '#ff0000',
                criticalHealthThreshold: 0.25
            },
            levelIndicator: {
                fontSize: 24,
                font: 'monospace',
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: 10,
                margin: 10
            },
            objectives: {
                fontSize: 16,
                font: 'monospace',
                color: '#ffff00',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 8,
                margin: 10,
                maxWidth: 400
            },
            playerStatus: {
                fontSize: 14,
                font: 'monospace',
                aliveColor: '#00ff00',
                deadColor: '#ff6666',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: 8,
                margin: 10
            },
            minimap: {
                size: 150,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#ffffff',
                playerColor: '#00ff00',
                enemyColor: '#ff0000',
                margin: 10
            }
        };
        
        // UI scaling
        this.uiScale = 1;
        this.baseUIScale = 1;
        
        // Animation state
        this.animationTime = 0;
        this.pulseSpeed = 2; // For pulsing effects
        
        // Cached measurements
        this.cachedMeasurements = {};
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.updateUIScale();
    }
    
    updateUIScale() {
        // Calculate UI scale based on canvas scale factor
        const scaleFactor = this.gameEngine.scaleFactor || 1;
        
        // Scale UI elements appropriately for different screen sizes
        if (scaleFactor < 0.5) {
            this.uiScale = 0.7; // Smaller UI for very small screens
        } else if (scaleFactor < 1) {
            this.uiScale = 0.8; // Slightly smaller UI for small screens
        } else if (scaleFactor > 2) {
            this.uiScale = 1.2; // Larger UI for large screens
        } else {
            this.uiScale = 1; // Normal UI scale
        }
    }
    
    render() {
        this.ctx.save();
        
        // Apply UI scaling
        this.ctx.scale(this.uiScale, this.uiScale);
        
        // Render HUD elements
        this.renderHealthBars();
        this.renderLevelIndicator();
        this.renderObjectives();
        this.renderPlayerStatus();
        this.renderMinimap();
        
        this.ctx.restore();
    }
    
    renderHealthBars() {
        const players = Array.from(this.gameEngine.players.values());
        const config = this.hudConfig.healthBar;
        
        let yOffset = config.margin;
        
        for (const player of players) {
            if (!player.isAlive) continue;
            
            const x = config.margin;
            const y = yOffset;
            
            // Background
            this.ctx.fillStyle = config.backgroundColor;
            this.ctx.fillRect(x, y, config.width, config.height);
            
            // Health bar
            const healthPercent = player.health / player.maxHealth;
            const healthWidth = config.width * healthPercent;
            
            // Choose color based on health level
            let healthColor = config.healthColor;
            if (healthPercent <= config.criticalHealthThreshold) {
                // Pulse red when critical
                const pulse = Math.sin(this.animationTime * this.pulseSpeed * 2) * 0.5 + 0.5;
                healthColor = `rgb(255, ${Math.floor(pulse * 100)}, 0)`;
            } else if (healthPercent <= 0.5) {
                healthColor = config.lowHealthColor;
            }
            
            this.ctx.fillStyle = healthColor;
            this.ctx.fillRect(x, y, healthWidth, config.height);
            
            // Border
            this.ctx.strokeStyle = config.borderColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, config.width, config.height);
            
            // Player name and health text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${12 * this.uiScale}px monospace`;
            this.ctx.textAlign = 'left';
            
            const playerName = player.id;
            const healthText = `${Math.ceil(player.health)}/${player.maxHealth}`;
            
            this.ctx.fillText(playerName, x, y - 5);
            this.ctx.fillText(healthText, x + config.width - 60, y + 15);
            
            yOffset += config.height + config.margin;
        }
    }
    
    renderLevelIndicator() {
        const config = this.hudConfig.levelIndicator;
        const currentLevel = this.gameEngine.getCurrentLevelNumber();
        const levelConfig = this.gameEngine.levelManager.getLevelConfig(currentLevel);
        
        const levelText = `Level ${currentLevel}`;
        const levelName = levelConfig ? levelConfig.name : 'Unknown';
        
        // Position at top center
        const canvasWidth = this.canvas.width / this.uiScale;
        const x = canvasWidth / 2;
        const y = config.margin + config.fontSize;
        
        // Background
        this.ctx.font = `${config.fontSize}px ${config.font}`;
        this.ctx.textAlign = 'center';
        
        const textWidth = Math.max(
            this.ctx.measureText(levelText).width,
            this.ctx.measureText(levelName).width
        );
        
        const bgWidth = textWidth + config.padding * 2;
        const bgHeight = config.fontSize * 2 + config.padding * 2;
        
        this.ctx.fillStyle = config.backgroundColor;
        this.ctx.fillRect(x - bgWidth / 2, y - config.fontSize, bgWidth, bgHeight);
        
        // Text
        this.ctx.fillStyle = config.color;
        this.ctx.fillText(levelText, x, y);
        this.ctx.fillText(levelName, x, y + config.fontSize + 5);
        
        this.ctx.textAlign = 'left';
    }
    
    renderObjectives() {
        const config = this.hudConfig.objectives;
        const currentLevel = this.gameEngine.getCurrentLevel();
        
        if (!currentLevel || !currentLevel.getObjectives) return;
        
        const objectives = currentLevel.getObjectives();
        if (!objectives || objectives.length === 0) return;
        
        // Position at top right
        const canvasWidth = this.canvas.width / this.uiScale;
        const x = canvasWidth - config.margin - config.maxWidth;
        let y = config.margin + config.fontSize;
        
        // Title background
        this.ctx.font = `${config.fontSize}px ${config.font}`;
        const titleText = 'Objectives:';
        const titleWidth = this.ctx.measureText(titleText).width;
        
        this.ctx.fillStyle = config.backgroundColor;
        this.ctx.fillRect(x, y - config.fontSize, titleWidth + config.padding * 2, config.fontSize + config.padding);
        
        // Title text
        this.ctx.fillStyle = config.color;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(titleText, x + config.padding, y);
        
        y += config.fontSize + config.padding;
        
        // Objectives list
        for (let i = 0; i < objectives.length; i++) {
            const objective = objectives[i];
            const isCompleted = objective.completed;
            const objectiveText = `${isCompleted ? '✓' : '○'} ${objective.description}`;
            
            // Background for each objective
            const textWidth = this.ctx.measureText(objectiveText).width;
            this.ctx.fillStyle = config.backgroundColor;
            this.ctx.fillRect(x, y - config.fontSize, textWidth + config.padding * 2, config.fontSize + config.padding);
            
            // Objective text
            this.ctx.fillStyle = isCompleted ? '#00ff00' : config.color;
            this.ctx.fillText(objectiveText, x + config.padding, y);
            
            y += config.fontSize + 5;
        }
    }
    
    renderPlayerStatus() {
        const config = this.hudConfig.playerStatus;
        const players = Array.from(this.gameEngine.players.values());
        
        // Position at bottom left
        const canvasHeight = this.canvas.height / this.uiScale;
        let y = canvasHeight - config.margin;
        
        // Title
        this.ctx.font = `${config.fontSize}px ${config.font}`;
        this.ctx.textAlign = 'left';
        
        const titleText = 'Team Status:';
        const titleWidth = this.ctx.measureText(titleText).width;
        
        y -= config.fontSize;
        
        this.ctx.fillStyle = config.backgroundColor;
        this.ctx.fillRect(config.margin, y - config.fontSize, titleWidth + config.padding * 2, config.fontSize + config.padding);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(titleText, config.margin + config.padding, y);
        
        // Player list
        for (let i = players.length - 1; i >= 0; i--) {
            const player = players[i];
            y -= config.fontSize + 5;
            
            const statusText = player.isAlive ? 
                `${player.id} - ALIVE (${Math.ceil(player.health)}HP)` : 
                `${player.id} - DEAD`;
            
            const textWidth = this.ctx.measureText(statusText).width;
            
            // Background
            this.ctx.fillStyle = config.backgroundColor;
            this.ctx.fillRect(config.margin, y - config.fontSize, textWidth + config.padding * 2, config.fontSize + config.padding);
            
            // Status text
            this.ctx.fillStyle = player.isAlive ? config.aliveColor : config.deadColor;
            this.ctx.fillText(statusText, config.margin + config.padding, y);
        }
    }
    
    renderMinimap() {
        const config = this.hudConfig.minimap;
        const canvasWidth = this.canvas.width / this.uiScale;
        const canvasHeight = this.canvas.height / this.uiScale;
        
        // Position at bottom right
        const x = canvasWidth - config.margin - config.size;
        const y = canvasHeight - config.margin - config.size;
        
        // Background
        this.ctx.fillStyle = config.backgroundColor;
        this.ctx.fillRect(x, y, config.size, config.size);
        
        // Border
        this.ctx.strokeStyle = config.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, config.size, config.size);
        
        // Calculate scale for minimap
        const mapScale = config.size / Math.max(this.canvas.width, this.canvas.height);
        
        // Draw players
        const players = Array.from(this.gameEngine.players.values());
        for (const player of players) {
            if (!player.isAlive) continue;
            
            const playerX = x + (player.x * mapScale);
            const playerY = y + (player.y * mapScale);
            
            this.ctx.fillStyle = config.playerColor;
            this.ctx.fillRect(playerX - 2, playerY - 2, 4, 4);
        }
        
        // Draw enemies
        const enemies = this.gameEngine.enemyManager.getAllEnemies();
        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;
            
            const enemyX = x + (enemy.x * mapScale);
            const enemyY = y + (enemy.y * mapScale);
            
            this.ctx.fillStyle = config.enemyColor;
            this.ctx.fillRect(enemyX - 1, enemyY - 1, 2, 2);
        }
        
        // Minimap title
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${10 * this.uiScale}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Map', x + config.size / 2, y - 5);
        
        this.ctx.textAlign = 'left';
    }
    
    // Utility methods for responsive UI
    getScaledValue(baseValue) {
        return baseValue * this.uiScale;
    }
    
    getScaledFont(baseFontSize, fontFamily = 'monospace') {
        return `${this.getScaledValue(baseFontSize)}px ${fontFamily}`;
    }
    
    // Method to show temporary notifications
    showNotification(message, duration = 3000, color = '#ffff00') {
        // This could be expanded to show temporary messages
        console.log(`Notification: ${message}`);
    }
    
    // Method to update objectives (called by levels)
    updateObjectives(objectives) {
        this.currentObjectives = objectives;
    }
    
    // Method to show level transition
    showLevelTransition(fromLevel, toLevel, callback) {
        // This could be expanded to show smooth level transitions
        console.log(`Level transition: ${fromLevel} -> ${toLevel}`);
        if (callback) callback();
    }
}