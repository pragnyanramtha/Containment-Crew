export class ValidationManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.networkManager = gameEngine.networkManager;
        
        // Validation state
        this.lastValidatedState = null;
        this.validationErrors = [];
        this.maxValidationErrors = 10;
        
        // Anti-cheat parameters
        this.maxMovementSpeed = 200; // pixels per second
        this.maxAttackRate = 2; // attacks per second
        this.maxInteractionDistance = 50; // pixels
        
        // Player state tracking
        this.playerStates = new Map();
        this.lastActionTimes = new Map();
        
        // Bind methods
        this.validatePlayerAction = this.validatePlayerAction.bind(this);
        this.handleActionRejected = this.handleActionRejected.bind(this);
        this.handleStateCorrection = this.handleStateCorrection.bind(this);
        this.handleValidationWarning = this.handleValidationWarning.bind(this);
        
        // Set up server validation listener
        if (this.networkManager && this.networkManager.socket) {
            this.setupServerValidationHandlers();
        }
    }
    
    setupServerValidationHandlers() {
        if (!this.networkManager.socket) return;
        
        this.networkManager.socket.on('actionRejected', (data) => {
            this.handleActionRejected(data);
        });
        
        this.networkManager.socket.on('stateCorrection', (data) => {
            this.handleStateCorrection(data);
        });
        
        this.networkManager.socket.on('validationWarning', (data) => {
            this.handleValidationWarning(data);
        });
    }
    
    // Client-side action validation before sending to server
    validatePlayerAction(playerId, action) {
        const player = this.gameEngine.getPlayer(playerId);
        if (!player) {
            return { valid: false, reason: 'Player not found' };
        }
        
        // Basic parameter validation
        if (!action || typeof action !== 'object') {
            return { valid: false, reason: 'Invalid action format' };
        }
        
        // Validate action type
        const validActionTypes = ['move', 'attack', 'interact', 'dash', 'use_item'];
        if (!validActionTypes.includes(action.type)) {
            return { valid: false, reason: 'Invalid action type' };
        }
        
        // Type-specific validation
        switch (action.type) {
            case 'move':
                return this.validateMovement(player, action);
            case 'attack':
                return this.validateAttack(player, action);
            case 'interact':
                return this.validateInteraction(player, action);
            case 'dash':
                return this.validateDash(player, action);
            default:
                return { valid: true };
        }
    }
    
    validateMovement(player, action) {
        // Validate position bounds
        if (action.x < 0 || action.x > 1920 || action.y < 0 || action.y > 1080) {
            return { valid: false, reason: 'Position out of bounds' };
        }
        
        // Validate movement speed
        const lastState = this.playerStates.get(player.id);
        if (lastState) {
            const distance = Math.sqrt(
                Math.pow(action.x - lastState.x, 2) + 
                Math.pow(action.y - lastState.y, 2)
            );
            const timeDiff = (Date.now() - lastState.timestamp) / 1000;
            const speed = distance / timeDiff;
            
            if (speed > this.maxMovementSpeed * 1.2) { // Allow some tolerance
                return { valid: false, reason: 'Movement speed too high' };
            }
        }
        
        // Update player state
        this.playerStates.set(player.id, {
            x: action.x,
            y: action.y,
            timestamp: Date.now()
        });
        
        return { valid: true };
    }
    
    validateAttack(player, action) {
        // Check attack rate limiting
        const lastAttackTime = this.lastActionTimes.get(`${player.id}_attack`) || 0;
        const timeSinceLastAttack = (Date.now() - lastAttackTime) / 1000;
        
        if (timeSinceLastAttack < 1 / this.maxAttackRate) {
            return { valid: false, reason: 'Attack rate too high' };
        }
        
        // Validate attack range if target specified
        if (action.targetId) {
            const target = this.gameEngine.getPlayer(action.targetId) || 
                          this.gameEngine.getEnemyManager().getEnemy(action.targetId);
            
            if (target) {
                const distance = Math.sqrt(
                    Math.pow(player.x - target.x, 2) + 
                    Math.pow(player.y - target.y, 2)
                );
                
                const maxAttackRange = player.attackRange || 40;
                if (distance > maxAttackRange * 1.5) { // Allow some tolerance
                    return { valid: false, reason: 'Attack range exceeded' };
                }
            }
        }
        
        // Update last attack time
        this.lastActionTimes.set(`${player.id}_attack`, Date.now());
        
        return { valid: true };
    }
    
    validateInteraction(player, action) {
        // Validate interaction distance
        if (action.targetX !== undefined && action.targetY !== undefined) {
            const distance = Math.sqrt(
                Math.pow(player.x - action.targetX, 2) + 
                Math.pow(player.y - action.targetY, 2)
            );
            
            if (distance > this.maxInteractionDistance) {
                return { valid: false, reason: 'Interaction distance too far' };
            }
        }
        
        return { valid: true };
    }
    
    validateDash(player, action) {
        // Check dash cooldown
        const lastDashTime = this.lastActionTimes.get(`${player.id}_dash`) || 0;
        const timeSinceLastDash = (Date.now() - lastDashTime) / 1000;
        
        const dashCooldown = player.dashCooldown || 3; // 3 seconds default
        if (timeSinceLastDash < dashCooldown) {
            return { valid: false, reason: 'Dash on cooldown' };
        }
        
        // Validate dash distance
        if (action.distance > (player.dashDistance || 100) * 1.2) {
            return { valid: false, reason: 'Dash distance too far' };
        }
        
        // Update last dash time
        this.lastActionTimes.set(`${player.id}_dash`, Date.now());
        
        return { valid: true };
    }
    
    // Handle server responses
    handleActionRejected(data) {
        console.warn('Server rejected action:', data);
        
        this.validationErrors.push({
            type: 'action_rejected',
            reason: data.reason,
            action: data.action,
            timestamp: Date.now()
        });
        
        // Trim error log
        if (this.validationErrors.length > this.maxValidationErrors) {
            this.validationErrors.shift();
        }
        
        // Show warning to player
        this.showValidationWarning(`Action rejected: ${data.reason}`);
    }
    
    handleStateCorrection(data) {
        console.warn('Server corrected game state:', data);
        
        // Apply server correction
        if (data.playerId && data.position) {
            const player = this.gameEngine.getPlayer(data.playerId);
            if (player) {
                player.x = data.position.x;
                player.y = data.position.y;
                
                // Update local state tracking
                this.playerStates.set(data.playerId, {
                    x: data.position.x,
                    y: data.position.y,
                    timestamp: Date.now()
                });
            }
        }
        
        this.validationErrors.push({
            type: 'state_correction',
            correction: data,
            timestamp: Date.now()
        });
        
        this.showValidationWarning('Position corrected by server');
    }
    
    handleValidationWarning(data) {
        console.warn('Server validation warning:', data);
        this.showValidationWarning(data.message);
    }
    
    showValidationWarning(message) {
        // Create a temporary warning display
        const warningElement = document.createElement('div');
        warningElement.className = 'validation-warning';
        warningElement.textContent = message;
        warningElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
            font-family: monospace;
            font-size: 12px;
        `;
        
        document.body.appendChild(warningElement);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (warningElement.parentNode) {
                warningElement.parentNode.removeChild(warningElement);
            }
        }, 3000);
    }
    
    // Collision detection validation
    validateCollision(player, newX, newY) {
        // Check bounds
        if (newX < 0 || newX > 1920 || newY < 0 || newY > 1080) {
            return false;
        }
        
        // Check collision with level geometry
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel && currentLevel.checkCollision) {
            if (currentLevel.checkCollision(newX, newY, player.width, player.height)) {
                return false;
            }
        }
        
        // Check collision with other players
        for (const otherPlayer of this.gameEngine.players.values()) {
            if (otherPlayer.id === player.id || !otherPlayer.isAlive) continue;
            
            const distance = Math.sqrt(
                Math.pow(newX - otherPlayer.x, 2) + 
                Math.pow(newY - otherPlayer.y, 2)
            );
            
            if (distance < (player.radius + otherPlayer.radius)) {
                return false;
            }
        }
        
        return true;
    }
    
    // State synchronization validation
    validateGameState(serverState) {
        if (!serverState || !this.lastValidatedState) {
            this.lastValidatedState = serverState;
            return { valid: true };
        }
        
        const issues = [];
        
        // Check player count
        if (serverState.players.length !== this.lastValidatedState.players.length) {
            issues.push('Player count mismatch');
        }
        
        // Check level consistency
        if (serverState.currentLevel !== this.lastValidatedState.currentLevel) {
            // Level changes are valid, just update
            console.log(`Level changed: ${this.lastValidatedState.currentLevel} -> ${serverState.currentLevel}`);
        }
        
        // Check for impossible position changes
        for (const serverPlayer of serverState.players) {
            const lastPlayer = this.lastValidatedState.players.find(p => p.id === serverPlayer.id);
            if (lastPlayer) {
                const distance = Math.sqrt(
                    Math.pow(serverPlayer.x - lastPlayer.x, 2) + 
                    Math.pow(serverPlayer.y - lastPlayer.y, 2)
                );
                const timeDiff = (serverState.timestamp - this.lastValidatedState.timestamp) / 1000;
                const speed = distance / timeDiff;
                
                if (speed > this.maxMovementSpeed * 2) { // More lenient for server state
                    issues.push(`Impossible movement speed for player ${serverPlayer.id}`);
                }
            }
        }
        
        this.lastValidatedState = serverState;
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
    
    // Get validation statistics
    getValidationStats() {
        const recentErrors = this.validationErrors.filter(
            error => Date.now() - error.timestamp < 60000 // Last minute
        );
        
        return {
            totalErrors: this.validationErrors.length,
            recentErrors: recentErrors.length,
            errorTypes: recentErrors.reduce((acc, error) => {
                acc[error.type] = (acc[error.type] || 0) + 1;
                return acc;
            }, {}),
            lastError: this.validationErrors[this.validationErrors.length - 1]
        };
    }
    
    // Cleanup method
    destroy() {
        if (this.networkManager && this.networkManager.socket) {
            this.networkManager.socket.off('actionRejected');
            this.networkManager.socket.off('stateCorrection');
            this.networkManager.socket.off('validationWarning');
        }
        
        this.playerStates.clear();
        this.lastActionTimes.clear();
        this.validationErrors = [];
    }
}