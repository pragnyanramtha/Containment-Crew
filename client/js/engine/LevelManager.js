import { Level } from './Level.js';
import { Level0 } from '../levels/Level0.js';

/**
 * LevelManager handles level loading, transitions, and progression
 */
export class LevelManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Level management
        this.currentLevel = null;
        this.currentLevelNumber = -1;
        this.levels = new Map();
        this.levelConfigs = new Map();
        
        // Transition state
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 1.0; // seconds
        this.transitionType = 'fade'; // 'fade', 'slide', etc.
        
        // Initialize level configurations
        this.initializeLevelConfigs();
    }
    
    /**
     * Initialize level configurations
     */
    initializeLevelConfigs() {
        // Level 0: Tutorial and Story Introduction
        this.levelConfigs.set(0, {
            type: 'tutorial',
            name: 'Tutorial - The Beginning',
            backgroundColor: '#2a2a2a',
            objectives: ['learn_movement', 'hear_story', 'complete_tutorial'],
            npcs: [
                { 
                    type: 'dying_scientist', 
                    x: 960, 
                    y: 400,
                    name: 'Dr. Petrov',
                    dialogue: [
                        "You... you made it. Thank God.",
                        "The reactor... it's going critical. The explosion will kill millions.",
                        "You three are our only hope. You must reach the reactor core.",
                        "But know this... not all of you will survive.",
                        "Sacrifices must be made to save humanity.",
                        "Now go! Learn to work together. Your journey begins here."
                    ]
                }
            ],
            tutorialMarkers: [
                { x: 100, y: 100, instruction: "Use WASD to move" },
                { x: 1800, y: 100, instruction: "Move here to continue" },
                { x: 1800, y: 900, instruction: "Good! Now move here" },
                { x: 100, y: 900, instruction: "Excellent! Talk to Dr. Petrov" }
            ]
        });
        
        // Level 1: Combat Introduction
        this.levelConfigs.set(1, {
            type: 'combat_intro',
            name: 'Level 1 - First Contact',
            backgroundColor: '#1a1a1a',
            objectives: ['defeat_all_enemies'],
            enemies: [
                { type: 'weak_zombie', count: 5, spawnArea: { x: 1400, y: 200, width: 400, height: 600 } }
            ]
        });
        
        // Level 2: Boss Fight and First Sacrifice
        this.levelConfigs.set(2, {
            type: 'boss_sacrifice',
            name: 'Level 2 - The First Choice',
            backgroundColor: '#1a1a1a',
            objectives: ['defeat_boss', 'sacrifice_one_player'],
            enemies: [
                { type: 'mutant_boss', count: 1, x: 960, y: 300 }
            ],
            levelObjects: [
                { type: 'elevator', x: 100, y: 400, width: 100, height: 200 },
                { type: 'sacrifice_button', x: 1720, y: 500, width: 100, height: 80 }
            ],
            sacrificeType: 'elevator_button'
        });
        
        // Level 3: Cooperative Puzzle
        this.levelConfigs.set(3, {
            type: 'puzzle',
            name: 'Level 3 - Cooperation',
            backgroundColor: '#1a1a1a',
            objectives: ['solve_puzzle'],
            levelObjects: [
                { type: 'dual_switch_a', x: 200, y: 400, width: 80, height: 80 },
                { type: 'dual_switch_b', x: 1640, y: 400, width: 80, height: 80 },
                { type: 'puzzle_door', x: 860, y: 200, width: 200, height: 40 }
            ],
            puzzleType: 'dual_switch'
        });
        
        // Level 4: Puzzle with Second Sacrifice
        this.levelConfigs.set(4, {
            type: 'puzzle_sacrifice',
            name: 'Level 4 - The Second Choice',
            backgroundColor: '#1a1a1a',
            objectives: ['solve_puzzle', 'sacrifice_one_player'],
            levelObjects: [
                { type: 'hold_mechanism', x: 960, y: 500, width: 100, height: 100 },
                { type: 'exit_door', x: 1720, y: 400, width: 100, height: 200 }
            ],
            puzzleType: 'hold_mechanism',
            sacrificeType: 'hold_position'
        });
        
        // Level 5: Final Challenge and Ending
        this.levelConfigs.set(5, {
            type: 'final_challenge',
            name: 'Level 5 - The Final Sacrifice',
            backgroundColor: '#0a0a0a',
            objectives: ['reach_reactor', 'shutdown_reactor', 'ending_sequence'],
            levelObjects: [
                { type: 'reactor_core', x: 860, y: 200, width: 200, height: 200 }
            ],
            hazards: ['falling_rocks', 'radiation', 'blizzard']
        });
    }
    
    /**
     * Load a specific level
     */
    async loadLevel(levelNumber) {
        console.log(`Loading level ${levelNumber}...`);
        
        const config = this.levelConfigs.get(levelNumber);
        if (!config) {
            console.error(`Level ${levelNumber} configuration not found`);
            return false;
        }
        
        try {
            // Create level instance based on type
            const level = this.createLevelInstance(levelNumber, config);
            
            // Load the level
            await level.load();
            
            // Store the level
            this.levels.set(levelNumber, level);
            
            console.log(`Level ${levelNumber} loaded successfully`);
            return true;
        } catch (error) {
            console.error(`Failed to load level ${levelNumber}:`, error);
            return false;
        }
    }
    
    /**
     * Create level instance based on type
     */
    createLevelInstance(levelNumber, config) {
        // For now, return base Level class
        // In the future, we can create specific level classes
        return new Level(levelNumber, config);
    }
    
    /**
     * Change to a specific level
     */
    async changeLevel(levelNumber, transitionType = 'fade') {
        if (this.isTransitioning) {
            console.warn('Level transition already in progress');
            return false;
        }
        
        console.log(`Changing to level ${levelNumber}...`);
        
        // Start transition
        this.isTransitioning = true;
        this.transitionType = transitionType;
        this.transitionProgress = 0;
        
        // Deactivate current level
        if (this.currentLevel) {
            this.currentLevel.deactivate();
        }
        
        // Load new level if not already loaded
        if (!this.levels.has(levelNumber)) {
            const loaded = await this.loadLevel(levelNumber);
            if (!loaded) {
                this.isTransitioning = false;
                return false;
            }
        }
        
        // Get new level
        const newLevel = this.levels.get(levelNumber);
        
        // Perform transition
        await this.performTransition();
        
        // Set new current level
        this.currentLevel = newLevel;
        this.currentLevelNumber = levelNumber;
        
        // Activate new level
        this.currentLevel.activate();
        
        // End transition
        this.isTransitioning = false;
        
        console.log(`Successfully changed to level ${levelNumber}`);
        return true;
    }
    
    /**
     * Perform level transition animation
     */
    async performTransition() {
        return new Promise(resolve => {
            const startTime = performance.now();
            
            const animateTransition = (currentTime) => {
                const elapsed = (currentTime - startTime) / 1000;
                this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
                
                if (this.transitionProgress < 1) {
                    requestAnimationFrame(animateTransition);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animateTransition);
        });
    }
    
    /**
     * Update current level
     */
    update(deltaTime, players) {
        if (this.currentLevel && !this.isTransitioning) {
            this.currentLevel.update(deltaTime, players, this.gameEngine);
            
            // Check if level is completed and advance
            if (this.currentLevel.isCompleted) {
                this.handleLevelCompletion();
            }
        }
    }
    
    /**
     * Render current level and transitions
     */
    render(ctx, spriteRenderer) {
        // Render current level
        if (this.currentLevel) {
            this.currentLevel.render(ctx, spriteRenderer);
        }
        
        // Render transition overlay
        if (this.isTransitioning) {
            this.renderTransition(ctx);
        }
    }
    
    /**
     * Render transition overlay
     */
    renderTransition(ctx) {
        const alpha = this.transitionType === 'fade' ? 
            Math.sin(this.transitionProgress * Math.PI) : 
            this.transitionProgress;
        
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Show level name during transition
        if (this.transitionProgress > 0.3 && this.transitionProgress < 0.7) {
            const config = this.levelConfigs.get(this.currentLevelNumber);
            if (config) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '48px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(
                    config.name, 
                    ctx.canvas.width / 2, 
                    ctx.canvas.height / 2
                );
                ctx.textAlign = 'left';
            }
        }
    }
    
    /**
     * Handle level completion
     */
    handleLevelCompletion() {
        console.log(`Level ${this.currentLevelNumber} completed`);
        
        // Check if there's a next level
        const nextLevelNumber = this.currentLevelNumber + 1;
        if (this.levelConfigs.has(nextLevelNumber)) {
            // Advance to next level after a short delay
            setTimeout(() => {
                this.changeLevel(nextLevelNumber);
            }, 2000);
        } else {
            // Game completed
            console.log('Game completed!');
            this.handleGameCompletion();
        }
    }
    
    /**
     * Handle game completion
     */
    handleGameCompletion() {
        // Show game completion screen
        console.log('Congratulations! You have completed Sacrifices Must Be Made.');
    }
    
    /**
     * Get current level
     */
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    /**
     * Get current level number
     */
    getCurrentLevelNumber() {
        return this.currentLevelNumber;
    }
    
    /**
     * Check if a level is loaded
     */
    isLevelLoaded(levelNumber) {
        return this.levels.has(levelNumber);
    }
    
    /**
     * Get level configuration
     */
    getLevelConfig(levelNumber) {
        return this.levelConfigs.get(levelNumber);
    }
    
    /**
     * Reset current level
     */
    resetCurrentLevel() {
        if (this.currentLevel) {
            this.currentLevel.reset();
        }
    }
    
    /**
     * Restart from a specific level
     */
    async restartFromLevel(levelNumber) {
        // Reset the target level if it exists
        if (this.levels.has(levelNumber)) {
            this.levels.get(levelNumber).reset();
        }
        
        // Change to the level
        return await this.changeLevel(levelNumber);
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Destroy all loaded levels
        for (const level of this.levels.values()) {
            level.destroy();
        }
        
        this.levels.clear();
        this.currentLevel = null;
        this.currentLevelNumber = -1;
    }
}