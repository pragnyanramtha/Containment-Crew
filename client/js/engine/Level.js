/**
 * Base Level class for managing game levels
 * Provides common functionality for all levels including loading, updating, rendering, and completion detection
 */
export class Level {
    constructor(levelNumber, levelConfig) {
        this.levelNumber = levelNumber;
        this.config = levelConfig;
        
        // Level state
        this.isLoaded = false;
        this.isCompleted = false;
        this.isActive = false;
        
        // Level objects and entities
        this.objects = [];
        this.npcs = [];
        this.enemies = [];
        this.effects = []; // Visual effects for combat
        
        // Combat state
        this.enemiesDefeated = false;
        this.gameOver = false;
        
        // Level completion tracking
        this.objectives = new Map();
        this.completedObjectives = new Set();
        
        // Initialize objectives from config
        if (this.config.objectives) {
            this.config.objectives.forEach(objective => {
                this.objectives.set(objective, false);
            });
        }
        
        // Level bounds
        this.bounds = {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080
        };
        
        // Background color
        this.backgroundColor = '#1a1a1a';
    }
    
    /**
     * Load level assets and initialize level-specific content
     * Override in subclasses for level-specific loading
     */
    async load() {
        console.log(`Loading Level ${this.levelNumber}...`);
        
        // Load level-specific assets
        await this.loadAssets();
        
        // Initialize level objects
        this.initializeObjects();
        
        // Initialize NPCs
        this.initializeNPCs();
        
        // Initialize enemies
        this.initializeEnemies();
        
        this.isLoaded = true;
        console.log(`Level ${this.levelNumber} loaded successfully`);
    }
    
    /**
     * Load level-specific assets
     * Override in subclasses
     */
    async loadAssets() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Initialize level objects from config
     */
    initializeObjects() {
        if (this.config.levelObjects) {
            this.config.levelObjects.forEach(objConfig => {
                const obj = this.createLevelObject(objConfig);
                if (obj) {
                    this.objects.push(obj);
                }
            });
        }
    }
    
    /**
     * Initialize NPCs from config
     */
    initializeNPCs() {
        if (this.config.npcs) {
            this.config.npcs.forEach(npcConfig => {
                const npc = this.createNPC(npcConfig);
                if (npc) {
                    this.npcs.push(npc);
                }
            });
        }
    }
    
    /**
     * Initialize enemies from config
     */
    initializeEnemies() {
        if (this.config.enemies) {
            this.config.enemies.forEach(enemyConfig => {
                const enemy = this.createEnemy(enemyConfig);
                if (enemy) {
                    this.enemies.push(enemy);
                }
            });
        }
    }
    
    /**
     * Spawn enemies using the game engine's enemy manager
     */
    spawnEnemies(gameEngine) {
        if (gameEngine && gameEngine.getEnemyManager()) {
            const enemyManager = gameEngine.getEnemyManager();
            enemyManager.spawnEnemiesFromConfig(this.config, this.bounds.width, this.bounds.height);
        }
    }
    
    /**
     * Create level object from config
     * Override in subclasses for specific object types
     */
    createLevelObject(config) {
        // Base implementation - override in subclasses
        return null;
    }
    
    /**
     * Create NPC from config
     * Override in subclasses for specific NPC types
     */
    createNPC(config) {
        // Base implementation - override in subclasses
        return null;
    }
    
    /**
     * Create enemy from config
     * Override in subclasses for specific enemy types
     */
    createEnemy(config) {
        // Base implementation - override in subclasses
        return null;
    }
    
    /**
     * Activate the level
     */
    activate() {
        this.isActive = true;
        this.onActivate();
    }
    
    /**
     * Deactivate the level
     */
    deactivate() {
        this.isActive = false;
        this.onDeactivate();
    }
    
    /**
     * Called when level is activated
     * Override in subclasses
     */
    onActivate() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Called when level is deactivated
     * Override in subclasses
     */
    onDeactivate() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Update level state
     */
    update(deltaTime, players, gameEngine) {
        if (!this.isActive || !this.isLoaded) return;
        
        // Update level objects
        this.objects.forEach(obj => {
            if (obj.update) {
                obj.update(deltaTime, players, gameEngine);
            }
        });
        
        // Update NPCs
        this.npcs.forEach(npc => {
            if (npc.update) {
                npc.update(deltaTime, players, gameEngine);
            }
        });
        
        // Update enemies (handled by enemy manager now)
        // this.enemies.forEach(enemy => {
        //     if (enemy.update) {
        //         enemy.update(deltaTime, players, gameEngine);
        //     }
        // });
        
        // Update visual effects
        this.updateEffects(deltaTime);
        
        // Check level completion
        this.checkCompletion(players, gameEngine);
        
        // Level-specific update logic
        this.updateLevel(deltaTime, players, gameEngine);
    }
    
    /**
     * Update visual effects
     */
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.timeLeft -= deltaTime;
            return effect.timeLeft > 0;
        });
    }
    
    /**
     * Level-specific update logic
     * Override in subclasses
     */
    updateLevel(deltaTime, players, gameEngine) {
        // Base implementation - override in subclasses
    }
    
    /**
     * Render level content
     */
    render(ctx, spriteRenderer) {
        if (!this.isLoaded) return;
        
        // Render level background (now uses BackgroundManager)
        this.renderBackground(ctx, spriteRenderer);
        
        // Render level objects
        this.objects.forEach(obj => {
            if (obj.render) {
                obj.render(ctx, spriteRenderer);
            }
        });
        
        // Render NPCs
        this.npcs.forEach(npc => {
            if (npc.render) {
                npc.render(ctx, spriteRenderer);
            }
        });
        
        // Render enemies (handled by enemy manager now)
        // this.enemies.forEach(enemy => {
        //     if (enemy.render) {
        //         enemy.render(ctx, spriteRenderer);
        //     }
        // });
        
        // Render visual effects
        this.renderEffects(ctx);
        
        // Render level-specific content
        this.renderLevel(ctx, spriteRenderer);
        
        // Render UI elements
        this.renderUI(ctx);
    }
    
    /**
     * Render visual effects
     */
    renderEffects(ctx) {
        for (const effect of this.effects) {
            this.renderEffect(ctx, effect);
        }
    }
    
    /**
     * Render a single effect
     */
    renderEffect(ctx, effect) {
        const alpha = effect.timeLeft / effect.maxTime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        switch (effect.type) {
            case 'swing':
                // Swing attack arc effect
                ctx.strokeStyle = '#ffff44';
                ctx.lineWidth = 8;
                
                // Calculate swing direction
                let startAngle, endAngle;
                switch (effect.direction) {
                    case 'right':
                        startAngle = -effect.angle / 2;
                        endAngle = effect.angle / 2;
                        break;
                    case 'down':
                        startAngle = Math.PI / 2 - effect.angle / 2;
                        endAngle = Math.PI / 2 + effect.angle / 2;
                        break;
                    case 'left':
                        startAngle = Math.PI - effect.angle / 2;
                        endAngle = Math.PI + effect.angle / 2;
                        break;
                    case 'up':
                        startAngle = -Math.PI / 2 - effect.angle / 2;
                        endAngle = -Math.PI / 2 + effect.angle / 2;
                        break;
                    default:
                        startAngle = -effect.angle / 2;
                        endAngle = effect.angle / 2;
                }
                
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.range * (1 - alpha * 0.5), startAngle, endAngle);
                ctx.stroke();
                break;
                
            case 'damage':
                // Red impact effect
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 10 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'boss_area_attack':
                // Boss area attack warning and damage effect
                const elapsed = effect.maxTime - effect.timeLeft;
                const isWarning = elapsed < effect.warningTime;
                
                if (isWarning) {
                    // Warning phase - red circle growing
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 4;
                    ctx.setLineDash([10, 10]);
                    
                    const warningProgress = elapsed / effect.warningTime;
                    const radius = effect.radius * warningProgress;
                    
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Warning text
                    ctx.fillStyle = '#ff0000';
                    ctx.font = 'bold 16px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('DANGER!', effect.x, effect.y - effect.radius - 20);
                } else {
                    // Damage phase - explosion effect
                    ctx.fillStyle = '#ff4444';
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add some particles
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 * i) / 8;
                        const distance = effect.radius * 0.8;
                        const particleX = effect.x + Math.cos(angle) * distance;
                        const particleY = effect.y + Math.sin(angle) * distance;
                        
                        ctx.fillStyle = '#ffaa00';
                        ctx.beginPath();
                        ctx.arc(particleX, particleY, 8, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                ctx.setLineDash([]); // Reset line dash
                ctx.textAlign = 'left';
                break;
                
            case 'boss_death':
                // Boss death explosion effect
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 50 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                
                // Render particles
                for (const particle of effect.particles) {
                    const particleAlpha = particle.life / particle.maxLife;
                    ctx.globalAlpha = alpha * particleAlpha;
                    
                    ctx.fillStyle = '#ffaa00';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Update particle
                    particle.x += particle.vx * (1/60); // Assuming 60 FPS
                    particle.y += particle.vy * (1/60);
                    particle.life -= 1/60;
                }
                break;
                
            case 'attack':
                // Enemy attack effect (red)
                ctx.fillStyle = '#ff6666';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 12 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'radiation_death':
                // Final player radiation death effect
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 30 * (1 - alpha * 0.5), 0, Math.PI * 2);
                ctx.fill();
                
                // Radiation particles
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI * 2 * i) / 12;
                    const distance = 40 * (1 - alpha);
                    const particleX = effect.x + Math.cos(angle) * distance;
                    const particleY = effect.y + Math.sin(angle) * distance;
                    
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'rock_impact':
                // Falling rock impact effect
                ctx.fillStyle = '#888888';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 20 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                
                // Dust particles
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const distance = 15 * (1 - alpha);
                    const particleX = effect.x + Math.cos(angle) * distance;
                    const particleY = effect.y + Math.sin(angle) * distance;
                    
                    ctx.fillStyle = '#aaaaaa';
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'radiation_damage':
                // Radiation damage effect on player
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 15 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                
                // Radiation symbol
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('☢', effect.x, effect.y + 4);
                break;
                
            case 'reactor_shutdown':
                // Reactor shutdown effect
                effect.pulseTimer += 1/60; // Assuming 60 FPS
                const pulseIntensity = Math.sin(effect.pulseTimer * 8) * 0.5 + 0.5;
                
                ctx.save();
                ctx.globalAlpha = alpha * pulseIntensity;
                
                // Energy rings
                for (let i = 0; i < 3; i++) {
                    const ringRadius = 50 + (i * 30) + (effect.pulseTimer * 20) % 90;
                    ctx.strokeStyle = i === 0 ? '#00ffff' : i === 1 ? '#0088ff' : '#0044ff';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Central energy core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 10 + pulseIntensity * 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
                break;
                
            case 'reactor_completion':
                // Reactor shutdown completion effect
                ctx.save();
                ctx.globalAlpha = alpha;
                
                // Central explosion
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 40 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                
                // Energy burst
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 80 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                
                // Render particles
                for (const particle of effect.particles) {
                    const particleAlpha = particle.life / particle.maxLife;
                    ctx.globalAlpha = alpha * particleAlpha;
                    
                    ctx.fillStyle = '#ffff00';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Update particle
                    particle.x += particle.vx * (1/60); // Assuming 60 FPS
                    particle.y += particle.vy * (1/60);
                    particle.life -= 1/60;
                }
                
                ctx.restore();
                break;
                
            default:
                // Default attack effect
                ctx.fillStyle = '#ffff44';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 8 * (1 - alpha), 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * Render level background
     * Uses BackgroundLoader for preloaded images, falls back to BackgroundManager
     */
    renderBackground(ctx, spriteRenderer) {
        // Try to use preloaded background image first
        if (this.gameEngine && this.gameEngine.backgroundLoader) {
            const backgroundRendered = this.gameEngine.backgroundLoader.renderBackground(
                ctx, 
                this.levelNumber, 
                this.bounds.width, 
                this.bounds.height
            );
            
            if (backgroundRendered) {
                return; // Successfully rendered background image
            }
        }
        
        // Fallback to procedural background from BackgroundManager
        if (this.gameEngine && this.gameEngine.backgroundManager) {
            const background = this.gameEngine.backgroundManager.getBackground(
                this.levelNumber, 
                this.bounds.width, 
                this.bounds.height
            );
            
            if (background) {
                ctx.drawImage(background, 0, 0);
                return;
            }
        }
        
        // Final fallback to solid color
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.bounds.width, this.bounds.height);
    }
    

    
    /**
     * Render level UI elements
     * Override in subclasses
     */
    renderUI(ctx) {
        // Base implementation - override in subclasses
    }
    
    /**
     * Check if level completion conditions are met
     */
    checkCompletion(players, gameEngine) {
        if (this.isCompleted) return;
        
        // Check all objectives
        let allObjectivesComplete = true;
        for (const [objective, completed] of this.objectives) {
            if (!completed && !this.checkObjective(objective, players, gameEngine)) {
                allObjectivesComplete = false;
            } else if (!completed) {
                this.completeObjective(objective);
            }
        }
        
        // Mark level as completed if all objectives are done
        if (allObjectivesComplete && this.objectives.size > 0) {
            this.complete();
        }
    }
    
    /**
     * Check if a specific objective is completed
     * Override in subclasses for objective-specific logic
     */
    checkObjective(objective, players, gameEngine) {
        // Common objectives that can be handled in base class
        switch (objective) {
            case 'defeat_all_enemies':
                if (gameEngine && gameEngine.getEnemyManager()) {
                    const aliveEnemies = gameEngine.getEnemyManager().getAliveEnemies();
                    return aliveEnemies.length === 0;
                }
                return false;
                
            case 'survive':
                // Check if at least one player is alive
                return players.some(player => player.isAlive);
                
            default:
                // Level-specific objectives handled in subclasses
                return false;
        }
    }
    
    /**
     * Check for collision with level boundaries and obstacles
     */
    checkCollision(entity) {
        // Check bounds
        if (entity.x < 0 || entity.y < 0 || 
            entity.x + entity.width > this.bounds.width || 
            entity.y + entity.height > this.bounds.height) {
            return true;
        }
        
        // Check collision with level objects
        for (const obj of this.objects) {
            if (obj.solid && entity.isCollidingWith && entity.isCollidingWith(obj)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Mark an objective as completed
     */
    completeObjective(objective) {
        this.objectives.set(objective, true);
        this.completedObjectives.add(objective);
        console.log(`Objective completed: ${objective}`);
        this.onObjectiveCompleted(objective);
    }
    
    /**
     * Called when an objective is completed
     * Override in subclasses
     */
    onObjectiveCompleted(objective) {
        // Base implementation - override in subclasses
    }
    
    /**
     * Mark level as completed
     */
    complete() {
        if (this.isCompleted) return;
        
        this.isCompleted = true;
        console.log(`Level ${this.levelNumber} completed!`);
        this.onLevelCompleted();
    }
    
    /**
     * Called when level is completed
     * Override in subclasses
     */
    onLevelCompleted() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Reset level to initial state
     */
    reset() {
        this.isCompleted = false;
        this.completedObjectives.clear();
        
        // Reset all objectives
        for (const objective of this.objectives.keys()) {
            this.objectives.set(objective, false);
        }
        
        // Reset level objects
        this.objects.forEach(obj => {
            if (obj.reset) {
                obj.reset();
            }
        });
        
        // Reset NPCs
        this.npcs.forEach(npc => {
            if (npc.reset) {
                npc.reset();
            }
        });
        
        // Reset enemies
        this.enemies.forEach(enemy => {
            if (enemy.reset) {
                enemy.reset();
            }
        });
        
        this.onReset();
    }
    
    /**
     * Called when level is reset
     * Override in subclasses
     */
    onReset() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Clean up level resources
     */
    destroy() {
        this.objects.forEach(obj => {
            if (obj.destroy) {
                obj.destroy();
            }
        });
        
        this.npcs.forEach(npc => {
            if (npc.destroy) {
                npc.destroy();
            }
        });
        
        this.enemies.forEach(enemy => {
            if (enemy.destroy) {
                enemy.destroy();
            }
        });
        
        this.objects = [];
        this.npcs = [];
        this.enemies = [];
        
        this.onDestroy();
    }
    
    /**
     * Called when level is destroyed
     * Override in subclasses
     */
    onDestroy() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Get objectives for HUD display
     */
    getObjectives() {
        const objectives = [];
        for (const [objective, completed] of this.objectives) {
            objectives.push({
                description: this.getObjectiveDescription(objective),
                completed: completed
            });
        }
        return objectives;
    }
    
    /**
     * Get human-readable description for an objective
     * Override in subclasses for custom descriptions
     */
    getObjectiveDescription(objective) {
        switch (objective) {
            case 'defeat_all_enemies':
                return 'Defeat all enemies';
            case 'survive':
                return 'Keep at least one player alive';
            case 'learn_movement':
                return 'Learn basic movement controls';
            case 'hear_story':
                return 'Listen to the story introduction';
            case 'defeat_boss':
                return 'Defeat the boss enemy';
            case 'sacrifice_one_player':
                return 'One player must sacrifice themselves';
            case 'solve_puzzle':
                return 'Solve the cooperative puzzle';
            case 'reach_reactor':
                return 'Reach the reactor controls';
            case 'shutdown_reactor':
                return 'Shut down the nuclear reactor';
            case 'ending_sequence':
                return 'Complete the ending sequence';
            default:
                return objective.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }
    
    /**
     * Handle input for level-specific interactions
     * Override in subclasses
     */
    handleInput(keys) {
        // Base implementation - override in subclasses
    }
}