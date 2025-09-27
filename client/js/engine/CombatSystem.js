export class CombatSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.attackCooldowns = new Map(); // playerId -> cooldown time
        this.damageNumbers = []; // Visual damage feedback
        
        // Combat configuration
        this.config = {
            playerAttackRange: 80, // Increased range for swing attacks
            playerAttackCooldown: 0.7, // seconds
            enemyAttackRange: 40,
            enemyAttackDamage: 25, // 1 heart of damage (25 HP)
            enemyAttackCooldown: 1.0,
            damageNumberDuration: 1.0, // seconds
            swingAngle: Math.PI / 3, // 60 degree swing arc
            swingWidth: 100 // Width of swing attack
        };
    }
    
    update(deltaTime) {
        // Update attack cooldowns
        for (const [playerId, cooldown] of this.attackCooldowns) {
            const newCooldown = cooldown - deltaTime;
            if (newCooldown <= 0) {
                this.attackCooldowns.delete(playerId);
            } else {
                this.attackCooldowns.set(playerId, newCooldown);
            }
        }
        
        // Update damage numbers
        this.damageNumbers = this.damageNumbers.filter(damageNumber => {
            damageNumber.timeLeft -= deltaTime;
            damageNumber.y -= 30 * deltaTime; // Float upward
            damageNumber.alpha = damageNumber.timeLeft / this.config.damageNumberDuration;
            return damageNumber.timeLeft > 0;
        });
    }
    
    // Player attack system
    tryPlayerAttack(playerId, targetX, targetY) {
        const player = this.gameEngine.getPlayer(playerId);
        if (!player || !player.isAlive) return false;
        
        // Check cooldown
        if (this.attackCooldowns.has(playerId)) {
            return false;
        }
        
        // Calculate attack position based on player direction
        const attackPos = this.getAttackPosition(player);
        
        // Check if target is in range
        const distance = this.getDistance(attackPos.x, attackPos.y, targetX, targetY);
        if (distance > this.config.playerAttackRange) {
            return false;
        }
        
        // Set cooldown
        this.attackCooldowns.set(playerId, this.config.playerAttackCooldown);
        
        // Find enemies in attack range
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel && currentLevel.enemies) {
            for (const enemy of currentLevel.enemies) {
                if (enemy.isAlive && this.isInAttackRange(attackPos, enemy, this.config.playerAttackRange)) {
                    this.damageEnemy(enemy, this.config.playerAttackDamage, attackPos.x, attackPos.y);
                }
            }
        }
        
        // Create attack visual effect
        this.createAttackEffect(attackPos.x, attackPos.y, player.direction);
        
        return true;
    }
    
    // Enemy attack system
    tryEnemyAttack(enemy, targetPlayer) {
        if (!enemy.isAlive || !targetPlayer.isAlive) return false;
        
        // Check cooldown
        if (enemy.attackCooldown > 0) return false;
        
        // Check range
        const distance = this.getDistance(enemy.x, enemy.y, targetPlayer.x, targetPlayer.y);
        if (distance > this.config.enemyAttackRange) return false;
        
        // Set cooldown
        enemy.attackCooldown = this.config.enemyAttackCooldown;
        
        // Deal damage
        this.damagePlayer(targetPlayer, this.config.enemyAttackDamage, enemy.x, enemy.y);
        
        // Create attack visual effect
        this.createAttackEffect(enemy.x, enemy.y, this.getDirectionToTarget(enemy, targetPlayer));
        
        return true;
    }
    
    // Damage system
    damagePlayer(player, damage, sourceX, sourceY) {
        if (!player.isAlive) return;
        
        player.takeDamage(damage);
        
        // Create damage number
        this.createDamageNumber(player.x + player.width / 2, player.y, damage, '#ff4444');
        
        // Create damage effect
        this.createDamageEffect(player.x + player.width / 2, player.y + player.height / 2);
        
        // Check if player died
        if (!player.isAlive) {
            this.onPlayerDeath(player);
        }
    }
    
    damageEnemy(enemy, damage, sourceX, sourceY) {
        if (!enemy.isAlive) return;
        
        enemy.takeDamage(damage);
        
        // Create damage number
        this.createDamageNumber(enemy.x + enemy.width / 2, enemy.y, damage, '#ffff44');
        
        // Create damage effect
        this.createDamageEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        
        // Check if enemy died
        if (!enemy.isAlive) {
            this.onEnemyDeath(enemy);
        }
    }
    
    // Visual feedback system
    createDamageNumber(x, y, damage, color) {
        this.damageNumbers.push({
            x: x,
            y: y,
            damage: damage,
            color: color,
            timeLeft: this.config.damageNumberDuration,
            alpha: 1.0
        });
    }
    
    createAttackEffect(x, y, direction) {
        // Create a simple attack effect (could be enhanced with particles)
        const effect = {
            x: x,
            y: y,
            direction: direction,
            timeLeft: 0.2,
            maxTime: 0.2
        };
        
        // Add to current level's effects if available
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel && currentLevel.effects) {
            currentLevel.effects.push(effect);
        }
    }
    
    createDamageEffect(x, y) {
        // Create impact effect
        const effect = {
            type: 'damage',
            x: x,
            y: y,
            timeLeft: 0.3,
            maxTime: 0.3
        };
        
        // Add to current level's effects if available
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel && currentLevel.effects) {
            currentLevel.effects.push(effect);
        }
    }
    
    // Event handlers
    onPlayerDeath(player) {
        console.log(`Player ${player.id} has died!`);
        
        // Check if all players are dead
        const alivePlayers = Array.from(this.gameEngine.players.values()).filter(p => p.isAlive);
        if (alivePlayers.length === 0) {
            this.onAllPlayersDead();
        }
    }
    
    onEnemyDeath(enemy) {
        console.log(`Enemy ${enemy.id} has been defeated!`);
        
        // Check if all enemies are dead
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel && currentLevel.enemies) {
            const aliveEnemies = currentLevel.enemies.filter(e => e.isAlive);
            if (aliveEnemies.length === 0) {
                this.onAllEnemiesDefeated();
            }
        }
    }
    
    onAllPlayersDead() {
        console.log('Game Over - All players have died!');
        // Trigger game over state
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel) {
            currentLevel.gameOver = true;
        }
    }
    
    onAllEnemiesDefeated() {
        console.log('All enemies defeated!');
        // Trigger level completion
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel) {
            currentLevel.enemiesDefeated = true;
        }
    }
    
    // Utility methods
    getAttackPosition(player) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const range = this.config.playerAttackRange;
        
        switch (player.direction) {
            case 'up':
                return { x: centerX, y: centerY - range / 2 };
            case 'down':
                return { x: centerX, y: centerY + range / 2 };
            case 'left':
                return { x: centerX - range / 2, y: centerY };
            case 'right':
                return { x: centerX + range / 2, y: centerY };
            default:
                return { x: centerX, y: centerY };
        }
    }
    
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    isInAttackRange(attackPos, target, range) {
        const targetCenterX = target.x + target.width / 2;
        const targetCenterY = target.y + target.height / 2;
        const distance = this.getDistance(attackPos.x, attackPos.y, targetCenterX, targetCenterY);
        return distance <= range;
    }
    
    getDirectionToTarget(source, target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }
    
    // Rendering
    render(ctx) {
        // Render damage numbers
        for (const damageNumber of this.damageNumbers) {
            ctx.save();
            ctx.globalAlpha = damageNumber.alpha;
            ctx.fillStyle = damageNumber.color;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`-${damageNumber.damage}`, damageNumber.x, damageNumber.y);
            ctx.restore();
        }
        
        // Reset text alignment
        ctx.textAlign = 'left';
    }
    
    // Input handling
    handleInput(keys) {
        // Handle attack input (Space key)
        if (keys['Space']) {
            const localPlayer = this.gameEngine.getLocalPlayer();
            if (localPlayer) {
                // Attack in the direction the player is facing
                const attackPos = this.getAttackPosition(localPlayer);
                this.tryPlayerAttack(localPlayer.id, attackPos.x, attackPos.y);
            }
        }
    }
}