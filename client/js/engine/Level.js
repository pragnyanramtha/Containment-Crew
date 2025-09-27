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
        
        // Clear background
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.bounds.width, this.bounds.height);
        
        // Render level background
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
        
        // Render enemies
        this.enemies.forEach(enemy => {
            if (enemy.render) {
                enemy.render(ctx, spriteRenderer);
            }
        });
        
        // Render level-specific content
        this.renderLevel(ctx, spriteRenderer);
        
        // Render UI elements
        this.renderUI(ctx);
    }
    
    /**
     * Render level background
     * Override in subclasses
     */
    renderBackground(ctx, spriteRenderer) {
        // Base implementation - override in subclasses
    }
    
    /**
     * Render level-specific content
     * Override in subclasses
     */
    renderLevel(ctx, spriteRenderer) {
        // Base implementation - override in subclasses
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
        // Base implementation - override in subclasses
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
}