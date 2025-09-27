export class Enemy {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        
        // Set properties based on enemy type
        this.setupEnemyType(type);
        
        // Common properties
        this.isAlive = true;
        this.direction = 'down';
        this.velocityX = 0;
        this.velocityY = 0;
        this.animationTime = 0;
        
        // AI properties
        this.target = null;
        this.lastTargetUpdate = 0;
        this.targetUpdateInterval = 0.5; // Update target every 0.5 seconds
        this.attackCooldown = 0;
        this.stuckTimer = 0;
        this.lastPosition = { x: this.x, y: this.y };
        
        // Pathfinding
        this.path = [];
        this.pathIndex = 0;
        this.pathfindingCooldown = 0;
        
        // Collision bounds
        this.collisionPadding = 2;
    }
    
    setupEnemyType(type) {
        switch (type) {
            case 'weak_zombie':
                this.width = 28;
                this.height = 28;
                this.hearts = 1; // 1 heart
                this.health = this.hearts * 25; // 25 HP per heart
                this.maxHealth = this.health;
                this.speed = 80; // pixels per second
                this.attackDamage = 25; // 1 heart of damage
                this.detectionRange = 150;
                this.color = '#44aa44';
                this.spriteBaseName = 'zombie_weak';
                break;
                
            case 'zombie':
                this.width = 32;
                this.height = 32;
                this.hearts = 2; // 2 hearts
                this.health = this.hearts * 25; // 50 HP
                this.maxHealth = this.health;
                this.speed = 100;
                this.attackDamage = 25; // 1 heart of damage
                this.detectionRange = 180;
                this.color = '#66aa66';
                this.spriteBaseName = 'zombie_normal';
                break;
                
            case 'mutant_boss':
                this.width = 48;
                this.height = 48;
                this.hearts = 8; // 8 hearts (boss)
                this.health = this.hearts * 25; // 200 HP
                this.maxHealth = this.health;
                this.speed = 60;
                this.attackDamage = 50; // 2 hearts of damage
                this.detectionRange = 250;
                this.color = '#aa4444';
                this.spriteBaseName = 'mutant_boss';
                break;
                
            default:
                // Default zombie
                this.width = 32;
                this.height = 32;
                this.hearts = 2; // 2 hearts
                this.health = this.hearts * 25; // 50 HP
                this.maxHealth = this.health;
                this.speed = 100;
                this.attackDamage = 25; // 1 heart of damage
                this.detectionRange = 180;
                this.color = '#66aa66';
                this.spriteBaseName = 'zombie_normal';
        }
    }
    
    update(deltaTime, players, level) {
        if (!this.isAlive) return;
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (this.pathfindingCooldown > 0) {
            this.pathfindingCooldown -= deltaTime;
        }
        
        // Update AI
        this.updateAI(deltaTime, players, level);
        
        // Update movement
        this.updateMovement(deltaTime, level);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Check if stuck
        this.checkIfStuck(deltaTime);
    }
    
    updateAI(deltaTime, players, level) {
        this.lastTargetUpdate += deltaTime;
        
        // Update target periodically
        if (this.lastTargetUpdate >= this.targetUpdateInterval) {
            this.updateTarget(players);
            this.lastTargetUpdate = 0;
        }
        
        // Behavior based on enemy type
        switch (this.type) {
            case 'weak_zombie':
            case 'zombie':
                this.basicZombieAI(deltaTime, players, level);
                break;
            case 'mutant_boss':
                this.bossAI(deltaTime, players, level);
                break;
        }
    }
    
    basicZombieAI(deltaTime, players, level) {
        if (!this.target) return;
        
        const distanceToTarget = this.getDistanceToTarget();
        
        // If close enough, try to attack
        if (distanceToTarget <= 40 && this.attackCooldown <= 0) {
            // Attack handled by combat system
            return;
        }
        
        // Move towards target
        this.moveTowardsTarget(deltaTime, level);
    }
    
    bossAI(deltaTime, players, level) {
        if (!this.target) return;
        
        const distanceToTarget = this.getDistanceToTarget();
        
        // Initialize boss-specific properties if not set
        if (!this.bossPhase) {
            this.bossPhase = 1;
            this.specialAttackCooldown = 0;
            this.chargeAttackCooldown = 0;
            this.areaAttackCooldown = 0;
            this.lastSpecialAttack = 0;
            this.isCharging = false;
            this.chargeTarget = null;
            this.chargeSpeed = 200;
            this.originalSpeed = this.speed;
        }
        
        // Update boss phase based on health
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent <= 0.3 && this.bossPhase < 3) {
            this.bossPhase = 3; // Enraged phase
            this.speed = this.originalSpeed * 1.3;
        } else if (healthPercent <= 0.6 && this.bossPhase < 2) {
            this.bossPhase = 2; // Aggressive phase
            this.speed = this.originalSpeed * 1.1;
        }
        
        // Update special attack cooldowns
        if (this.specialAttackCooldown > 0) {
            this.specialAttackCooldown -= deltaTime;
        }
        if (this.chargeAttackCooldown > 0) {
            this.chargeAttackCooldown -= deltaTime;
        }
        if (this.areaAttackCooldown > 0) {
            this.areaAttackCooldown -= deltaTime;
        }
        
        // Handle charging attack
        if (this.isCharging) {
            this.handleChargeAttack(deltaTime, players, level);
            return;
        }
        
        // Choose attack pattern based on distance and phase
        if (distanceToTarget <= 80) {
            // Close range - try special attacks
            if (this.bossPhase >= 2 && this.areaAttackCooldown <= 0 && Math.random() < 0.3) {
                this.performAreaAttack(players);
            } else if (this.attackCooldown <= 0) {
                // Regular melee attack
                return;
            }
        } else if (distanceToTarget <= 200 && this.chargeAttackCooldown <= 0 && this.bossPhase >= 2) {
            // Medium range - charge attack
            this.initiateChargeAttack();
            return;
        }
        
        // Default movement towards target
        this.moveTowardsTarget(deltaTime, level);
    }
    
    updateTarget(players) {
        let closestPlayer = null;
        let closestDistance = Infinity;
        
        // Find closest alive player within detection range
        for (const player of players) {
            if (!player.isAlive) continue;
            
            const distance = this.getDistance(this.x, this.y, player.x, player.y);
            if (distance <= this.detectionRange && distance < closestDistance) {
                closestPlayer = player;
                closestDistance = distance;
            }
        }
        
        this.target = closestPlayer;
    }
    
    moveTowardsTarget(deltaTime, level) {
        if (!this.target) return;
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Set velocity
            this.velocityX = dirX * this.speed;
            this.velocityY = dirY * this.speed;
            
            // Update direction for sprite rendering
            this.updateDirection(dirX, dirY);
        }
    }
    
    updateDirection(dirX, dirY) {
        // Determine primary direction for sprite animation
        if (Math.abs(dirX) > Math.abs(dirY)) {
            this.direction = dirX > 0 ? 'right' : 'left';
        } else {
            this.direction = dirY > 0 ? 'down' : 'up';
        }
    }
    
    updateMovement(deltaTime, level) {
        if (!this.isAlive) return;
        
        // Store old position for collision detection
        const oldX = this.x;
        const oldY = this.y;
        
        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Round to nearest pixel
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        
        // Check collisions with level boundaries and obstacles
        if (level && level.checkCollision) {
            if (level.checkCollision(this)) {
                // Revert movement
                this.x = oldX;
                this.y = oldY;
                
                // Try to find alternate path
                this.handleCollision(deltaTime);
            }
        }
        
        // Keep within canvas bounds (fallback)
        this.checkBoundaries();
    }
    
    handleCollision(deltaTime) {
        // Simple collision avoidance - try moving in a different direction
        if (this.pathfindingCooldown <= 0) {
            // Try moving perpendicular to current direction
            const perpX = -this.velocityY / this.speed;
            const perpY = this.velocityX / this.speed;
            
            this.velocityX = perpX * this.speed * 0.5;
            this.velocityY = perpY * this.speed * 0.5;
            
            this.pathfindingCooldown = 0.5; // Prevent rapid direction changes
        }
    }
    
    checkIfStuck(deltaTime) {
        const distance = this.getDistance(this.x, this.y, this.lastPosition.x, this.lastPosition.y);
        
        if (distance < 5) { // If moved less than 5 pixels
            this.stuckTimer += deltaTime;
            
            if (this.stuckTimer > 1.0) { // Stuck for more than 1 second
                // Try random movement
                const angle = Math.random() * Math.PI * 2;
                this.velocityX = Math.cos(angle) * this.speed * 0.5;
                this.velocityY = Math.sin(angle) * this.speed * 0.5;
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
            this.lastPosition = { x: this.x, y: this.y };
        }
    }
    
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
    }
    
    checkBoundaries() {
        const padding = this.collisionPadding;
        
        if (this.x < padding) {
            this.x = padding;
        }
        if (this.y < padding) {
            this.y = padding;
        }
        
        // Canvas bounds would be checked by level system
    }
    
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }
    
    getDistanceToTarget() {
        if (!this.target) return Infinity;
        return this.getDistance(this.x, this.y, this.target.x, this.target.y);
    }
    
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Boss-specific attack methods
    performAreaAttack(players) {
        this.areaAttackCooldown = 4.0; // 4 second cooldown
        this.attackCooldown = 1.0; // Prevent regular attacks during area attack
        
        // Create area attack effect
        const areaAttack = {
            type: 'boss_area_attack',
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            radius: 120,
            damage: 50, // 2 hearts of damage
            timeLeft: 0.8,
            maxTime: 0.8,
            warningTime: 0.3 // Show warning for 0.3 seconds before damage
        };
        
        // Add to level effects for rendering and damage processing
        // We'll get the level reference from the game engine
        const gameEngine = this.getGameEngine();
        if (gameEngine) {
            const currentLevel = gameEngine.getCurrentLevel();
            if (currentLevel && currentLevel.effects) {
                currentLevel.effects.push(areaAttack);
            }
        }
        
        console.log('Boss performed area attack!');
    }
    
    initiateChargeAttack() {
        this.chargeAttackCooldown = 6.0; // 6 second cooldown
        this.isCharging = true;
        this.chargeTarget = { x: this.target.x, y: this.target.y };
        this.speed = this.chargeSpeed;
        
        console.log('Boss initiated charge attack!');
    }
    
    handleChargeAttack(deltaTime, players, level) {
        if (!this.chargeTarget) {
            this.endChargeAttack();
            return;
        }
        
        // Move towards charge target at high speed
        const dx = this.chargeTarget.x - this.x;
        const dy = this.chargeTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 20) {
            // Reached target, end charge
            this.endChargeAttack();
            return;
        }
        
        // Move towards target
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        this.velocityX = dirX * this.speed;
        this.velocityY = dirY * this.speed;
        
        // Update direction for sprite rendering
        this.updateDirection(dirX, dirY);
        
        // Check for collision with players during charge
        for (const player of players) {
            if (player.isAlive && this.isCollidingWith(player)) {
                // Deal charge damage
                if (level && level.gameEngine && level.gameEngine.combatSystem) {
                    level.gameEngine.combatSystem.damagePlayer(player, 75, this.x, this.y); // 3 hearts
                }
                this.endChargeAttack();
                break;
            }
        }
    }
    
    endChargeAttack() {
        this.isCharging = false;
        this.chargeTarget = null;
        this.speed = this.originalSpeed;
        this.velocityX = 0;
        this.velocityY = 0;
        this.attackCooldown = 1.0; // Brief cooldown after charge
    }
    
    getCollisionBounds() {
        return {
            x: this.x + this.collisionPadding,
            y: this.y + this.collisionPadding,
            width: this.width - (this.collisionPadding * 2),
            height: this.height - (this.collisionPadding * 2)
        };
    }
    
    isCollidingWith(other) {
        const thisBounds = this.getCollisionBounds();
        const otherBounds = other.getCollisionBounds ? other.getCollisionBounds() : other;
        
        return thisBounds.x < otherBounds.x + otherBounds.width &&
               thisBounds.x + thisBounds.width > otherBounds.x &&
               thisBounds.y < otherBounds.y + otherBounds.height &&
               thisBounds.y + thisBounds.height > otherBounds.y;
    }
    
    render(ctx, spriteRenderer = null) {
        if (!this.isAlive) return;
        
        if (spriteRenderer) {
            // Use sprite rendering
            const spriteName = `${this.spriteBaseName}_${this.direction}`;
            spriteRenderer.drawSprite(spriteName, this.x, this.y, 1);
        } else {
            // Fallback to simple rectangle rendering
            this.renderSimple(ctx);
        }
        
        // Draw health bar
        this.renderHealthBar(ctx);
    }
    
    renderSimple(ctx) {
        // Draw enemy as a colored rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw direction indicator
        ctx.fillStyle = '#ffffff';
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        switch (this.direction) {
            case 'up':
                ctx.fillRect(centerX - 1, this.y + 2, 2, 4);
                break;
            case 'down':
                ctx.fillRect(centerX - 1, this.y + this.height - 6, 2, 4);
                break;
            case 'left':
                ctx.fillRect(this.x + 2, centerY - 1, 4, 2);
                break;
            case 'right':
                ctx.fillRect(this.x + this.width - 6, centerY - 1, 4, 2);
                break;
        }
        
        // Add border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    renderHealthBar(ctx) {
        if (this.health >= this.maxHealth && this.type !== 'mutant_boss') return; // Don't show full health bars except for boss
        
        // Boss gets a special large health bar
        if (this.type === 'mutant_boss') {
            this.renderBossHealthBar(ctx);
            return;
        }
        
        const barWidth = this.width;
        const barHeight = 3;
        const barX = this.x;
        const barY = this.y - 6;
        
        // Background
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    renderBossHealthBar(ctx) {
        // Large boss health bar at top of screen
        const barWidth = 400;
        const barHeight = 20;
        const barX = (ctx.canvas.width - barWidth) / 2;
        const barY = 20;
        
        // Background
        ctx.fillStyle = '#330000';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Health background
        ctx.fillStyle = '#660000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        let healthColor = '#ff0000';
        
        // Change color based on health
        if (healthPercent > 0.6) {
            healthColor = '#ff4444';
        } else if (healthPercent > 0.3) {
            healthColor = '#ff8800';
        } else {
            healthColor = '#ff0000';
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Boss name and health text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MUTANT BOSS', ctx.canvas.width / 2, barY - 8);
        
        // Health numbers
        ctx.font = '12px monospace';
        ctx.fillText(`${this.health} / ${this.maxHealth}`, ctx.canvas.width / 2, barY + barHeight + 15);
        
        // Phase indicator
        if (this.bossPhase) {
            let phaseText = '';
            switch (this.bossPhase) {
                case 1: phaseText = 'NORMAL'; break;
                case 2: phaseText = 'AGGRESSIVE'; break;
                case 3: phaseText = 'ENRAGED'; break;
            }
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`PHASE: ${phaseText}`, ctx.canvas.width / 2, barY + barHeight + 28);
        }
        
        ctx.textAlign = 'left';
    }
}

// Enemy spawning and management system
export class EnemyManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.enemies = [];
        this.nextEnemyId = 1;
        this.spawnCooldown = 0;
    }
    
    update(deltaTime, players, level) {
        // Update spawn cooldown
        if (this.spawnCooldown > 0) {
            this.spawnCooldown -= deltaTime;
        }
        
        // Update all enemies
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, players, level);
        }
        
        // Remove dead enemies
        this.cleanupDeadEnemies();
    }
    
    spawnEnemy(type, x, y) {
        const enemy = new Enemy(`enemy_${this.nextEnemyId++}`, type, x, y);
        this.enemies.push(enemy);
        return enemy;
    }
    
    spawnEnemiesFromConfig(levelConfig, canvasWidth, canvasHeight) {
        if (!levelConfig.enemies) return;
        
        for (const enemyConfig of levelConfig.enemies) {
            for (let i = 0; i < enemyConfig.count; i++) {
                // Find safe spawn position
                const spawnPos = this.findSafeSpawnPosition(canvasWidth, canvasHeight);
                this.spawnEnemy(enemyConfig.type, spawnPos.x, spawnPos.y);
            }
        }
    }
    
    findSafeSpawnPosition(canvasWidth, canvasHeight) {
        const margin = 100;
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            const x = margin + Math.random() * (canvasWidth - margin * 2);
            const y = margin + Math.random() * (canvasHeight - margin * 2);
            
            // Check if position is safe (not too close to players)
            let isSafe = true;
            for (const player of this.gameEngine.players.values()) {
                const distance = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
                if (distance < 150) { // Minimum spawn distance from players
                    isSafe = false;
                    break;
                }
            }
            
            if (isSafe) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback to random position if no safe position found
        return {
            x: margin + Math.random() * (canvasWidth - margin * 2),
            y: margin + Math.random() * (canvasHeight - margin * 2)
        };
    }
    
    cleanupDeadEnemies() {
        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    }
    
    getAliveEnemies() {
        return this.enemies.filter(enemy => enemy.isAlive);
    }
    
    getAllEnemies() {
        return this.enemies;
    }
    
    clearAllEnemies() {
        this.enemies = [];
    }
    
    render(ctx, spriteRenderer) {
        for (const enemy of this.enemies) {
            enemy.render(ctx, spriteRenderer);
        }
    }
}