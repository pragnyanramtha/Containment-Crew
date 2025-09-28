/**
 * PowerUpManager - Handles power-ups, abilities, and collectible items
 */
export class PowerUpManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.powerUps = new Map();
        this.activePowerUps = new Map(); // playerId -> active power-ups
        this.powerUpSpawns = [];
        this.spawnTimer = 0;
        this.spawnInterval = 15.0; // Spawn power-up every 15 seconds
    }

    /**
     * Initialize power-up system
     */
    initialize() {
        this.createPowerUpTypes();
        console.log('PowerUp system initialized');
    }

    /**
     * Define all power-up types
     */
    createPowerUpTypes() {
        this.powerUpTypes = {
            super_attack: {
                name: 'Super Attack',
                description: 'Devastating attack that deals massive damage',
                color: '#ff4444',
                icon: '⚡',
                duration: 0, // Instant use
                cooldown: 10.0,
                rarity: 'rare',
                effect: 'super_attack'
            },
            super_speed: {
                name: 'Super Speed',
                description: 'Greatly increases movement speed',
                color: '#44ff44',
                icon: '💨',
                duration: 8.0,
                cooldown: 0,
                rarity: 'common',
                effect: 'super_speed'
            },
            health_boost: {
                name: 'Health Boost',
                description: 'Restores health and increases max health',
                color: '#ff8844',
                icon: '❤️',
                duration: 0, // Instant use
                cooldown: 0,
                rarity: 'common',
                effect: 'health_boost'
            },
            shield: {
                name: 'Energy Shield',
                description: 'Temporary invincibility',
                color: '#4488ff',
                icon: '🛡️',
                duration: 5.0,
                cooldown: 0,
                rarity: 'rare',
                effect: 'shield'
            },
            multi_shot: {
                name: 'Multi Shot',
                description: 'Attacks hit multiple enemies',
                color: '#ff44ff',
                icon: '🎯',
                duration: 10.0,
                cooldown: 0,
                rarity: 'uncommon',
                effect: 'multi_shot'
            },
            time_slow: {
                name: 'Time Slow',
                description: 'Slows down enemies',
                color: '#44ffff',
                icon: '⏰',
                duration: 6.0,
                cooldown: 0,
                rarity: 'rare',
                effect: 'time_slow'
            }
        };
    }

    /**
     * Update power-up system
     */
    update(deltaTime, players) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnRandomPowerUp();
            this.spawnTimer = 0;
        }

        // Update active power-ups
        this.updateActivePowerUps(deltaTime, players);

        // Check for power-up pickups
        this.checkPowerUpPickups(players);

        // Update power-up animations
        this.updatePowerUpAnimations(deltaTime);
    }

    /**
     * Spawn a random power-up at a random location
     */
    spawnRandomPowerUp() {
        const powerUpTypeKeys = Object.keys(this.powerUpTypes);
        const randomType = powerUpTypeKeys[Math.floor(Math.random() * powerUpTypeKeys.length)];
        
        // Random position on the map
        const x = Math.random() * (1920 - 100) + 50;
        const y = Math.random() * (1080 - 100) + 50;
        
        this.spawnPowerUp(randomType, x, y);
    }

    /**
     * Spawn a specific power-up at a location
     */
    spawnPowerUp(type, x, y) {
        const powerUpType = this.powerUpTypes[type];
        if (!powerUpType) return;

        const powerUp = {
            id: `powerup_${Date.now()}_${Math.random()}`,
            type: type,
            x: x,
            y: y,
            width: 32,
            height: 32,
            animationTime: 0,
            bobOffset: 0,
            glowIntensity: 1.0,
            collected: false,
            ...powerUpType
        };

        this.powerUps.set(powerUp.id, powerUp);
        console.log(`Spawned power-up: ${powerUp.name} at (${Math.round(x)}, ${Math.round(y)})`);
    }

    /**
     * Check if players are picking up power-ups
     */
    checkPowerUpPickups(players) {
        for (const player of players) {
            if (!player.isAlive) continue;

            for (const [id, powerUp] of this.powerUps) {
                if (powerUp.collected) continue;

                const distance = Math.sqrt(
                    Math.pow(player.x - powerUp.x, 2) + Math.pow(player.y - powerUp.y, 2)
                );

                if (distance < 40) {
                    this.collectPowerUp(player, powerUp);
                    break;
                }
            }
        }
    }

    /**
     * Player collects a power-up
     */
    collectPowerUp(player, powerUp) {
        powerUp.collected = true;
        
        // Add to player's inventory or apply effect
        this.applyPowerUpEffect(player, powerUp);
        
        // Remove from map after short delay
        setTimeout(() => {
            this.powerUps.delete(powerUp.id);
        }, 100);

        console.log(`${player.id} collected ${powerUp.name}`);
    }

    /**
     * Apply power-up effect to player
     */
    applyPowerUpEffect(player, powerUp) {
        if (!this.activePowerUps.has(player.id)) {
            this.activePowerUps.set(player.id, new Map());
        }

        const playerPowerUps = this.activePowerUps.get(player.id);

        switch (powerUp.effect) {
            case 'super_attack':
                // Give player super attack ability
                player.hasSuperAttack = true;
                player.superAttackCooldown = 0;
                break;

            case 'super_speed':
                // Apply speed boost
                const speedBoost = {
                    type: 'super_speed',
                    timeLeft: powerUp.duration,
                    originalSpeed: player.speed,
                    multiplier: 2.5
                };
                player.speed *= speedBoost.multiplier;
                playerPowerUps.set('super_speed', speedBoost);
                break;

            case 'health_boost':
                // Restore and boost health
                player.health = Math.min(player.maxHealth, player.health + 50);
                player.maxHealth += 25;
                break;

            case 'shield':
                // Apply shield
                const shield = {
                    type: 'shield',
                    timeLeft: powerUp.duration,
                    originalInvulnerable: player.invulnerable || false
                };
                player.invulnerable = true;
                playerPowerUps.set('shield', shield);
                break;

            case 'multi_shot':
                // Apply multi-shot
                const multiShot = {
                    type: 'multi_shot',
                    timeLeft: powerUp.duration
                };
                player.hasMultiShot = true;
                playerPowerUps.set('multi_shot', multiShot);
                break;

            case 'time_slow':
                // Apply time slow effect to enemies
                const timeSlow = {
                    type: 'time_slow',
                    timeLeft: powerUp.duration
                };
                playerPowerUps.set('time_slow', timeSlow);
                this.applyTimeSlowToEnemies(true);
                break;
        }
    }

    /**
     * Update active power-ups
     */
    updateActivePowerUps(deltaTime, players) {
        for (const [playerId, playerPowerUps] of this.activePowerUps) {
            const player = players.find(p => p.id === playerId);
            if (!player) continue;

            for (const [effectType, powerUp] of playerPowerUps) {
                powerUp.timeLeft -= deltaTime;

                if (powerUp.timeLeft <= 0) {
                    // Power-up expired
                    this.removePowerUpEffect(player, powerUp);
                    playerPowerUps.delete(effectType);
                }
            }
        }
    }

    /**
     * Remove power-up effect from player
     */
    removePowerUpEffect(player, powerUp) {
        switch (powerUp.type) {
            case 'super_speed':
                player.speed = powerUp.originalSpeed;
                break;

            case 'shield':
                player.invulnerable = powerUp.originalInvulnerable;
                break;

            case 'multi_shot':
                player.hasMultiShot = false;
                break;

            case 'time_slow':
                this.applyTimeSlowToEnemies(false);
                break;
        }

        console.log(`${powerUp.type} effect expired for ${player.id}`);
    }

    /**
     * Apply time slow effect to all enemies
     */
    applyTimeSlowToEnemies(slow) {
        if (this.gameEngine.enemyManager) {
            const enemies = this.gameEngine.enemyManager.getAllEnemies();
            enemies.forEach(enemy => {
                if (slow) {
                    if (!enemy.originalSpeed) {
                        enemy.originalSpeed = enemy.speed;
                    }
                    enemy.speed = enemy.originalSpeed * 0.3; // 30% speed
                } else {
                    if (enemy.originalSpeed) {
                        enemy.speed = enemy.originalSpeed;
                    }
                }
            });
        }
    }

    /**
     * Update power-up animations
     */
    updatePowerUpAnimations(deltaTime) {
        for (const [id, powerUp] of this.powerUps) {
            if (powerUp.collected) continue;

            powerUp.animationTime += deltaTime;
            
            // Bobbing animation
            powerUp.bobOffset = Math.sin(powerUp.animationTime * 3) * 5;
            
            // Pulsing glow
            powerUp.glowIntensity = 0.7 + Math.sin(powerUp.animationTime * 4) * 0.3;
        }
    }

    /**
     * Handle super attack input
     */
    handleSuperAttack(player) {
        if (!player.hasSuperAttack || player.superAttackCooldown > 0) {
            return false;
        }

        // Execute super attack
        this.executeSuperAttack(player);
        
        // Set cooldown
        player.superAttackCooldown = this.powerUpTypes.super_attack.cooldown;
        player.hasSuperAttack = false; // One-time use
        
        return true;
    }

    /**
     * Execute super attack
     */
    executeSuperAttack(player) {
        // Create large damage area around player
        const attackRadius = 150;
        const damage = 100; // Massive damage
        
        // Damage all enemies in range
        if (this.gameEngine.enemyManager) {
            const enemies = this.gameEngine.enemyManager.getAllEnemies();
            enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
                );
                
                if (distance <= attackRadius) {
                    enemy.takeDamage(damage);
                }
            });
        }

        // Create visual effect
        if (this.gameEngine.visualEffectsManager) {
            this.gameEngine.visualEffectsManager.createEffect('super_attack', {
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                radius: attackRadius,
                duration: 1.0
            });
        }

        console.log(`${player.id} used Super Attack!`);
    }

    /**
     * Render power-ups
     */
    render(ctx) {
        for (const [id, powerUp] of this.powerUps) {
            if (powerUp.collected) continue;

            this.renderPowerUp(ctx, powerUp);
        }
    }

    /**
     * Render individual power-up
     */
    renderPowerUp(ctx, powerUp) {
        const renderX = powerUp.x;
        const renderY = powerUp.y + powerUp.bobOffset;

        ctx.save();
        
        // Glow effect
        ctx.globalAlpha = powerUp.glowIntensity * 0.3;
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(renderX + powerUp.width/2, renderY + powerUp.height/2, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Main power-up body
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(renderX, renderY, powerUp.width, powerUp.height);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(renderX, renderY, powerUp.width, powerUp.height);
        
        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(powerUp.icon, renderX + powerUp.width/2, renderY + powerUp.height/2 + 7);
        
        // Name label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(powerUp.name, renderX + powerUp.width/2, renderY - 5);
        
        ctx.restore();
    }

    /**
     * Get active power-ups for a player
     */
    getPlayerPowerUps(playerId) {
        return this.activePowerUps.get(playerId) || new Map();
    }

    /**
     * Clear all power-ups
     */
    clearAll() {
        this.powerUps.clear();
        this.activePowerUps.clear();
    }
}