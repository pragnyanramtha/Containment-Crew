import { Level } from '../engine/Level.js';
import { DualSwitchPuzzle, PuzzleManager } from '../engine/PuzzleSystem.js';

/**
 * Level 3: Cooperative Puzzle
 * Two remaining players must solve a dual-switch puzzle requiring teamwork
 */
export class Level3 extends Level {
    constructor(levelNumber, levelConfig) {
        super(levelNumber, levelConfig);
        
        // Level 3 specific state
        this.puzzleManager = null;
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.introMessageDuration = 4.0;
        
        // Puzzle completion state
        this.puzzleCompleted = false;
        this.completionTimer = 0;
        this.completionDelay = 3.0;
    }
    
    async loadAssets() {
        console.log('Loading Level 3 assets...');
        // Assets will be handled by sprite manager
    }
    
    onActivate() {
        console.log('Level 3 activated - Cooperative Puzzle');
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.puzzleCompleted = false;
        this.completionTimer = 0;
        
        // Initialize puzzle system
        this.initializePuzzleSystem();
    }
    
    initializePuzzleSystem() {
        // Create puzzle manager
        this.puzzleManager = new PuzzleManager(this.gameEngine);
        
        // Create dual switch puzzle configuration
        const puzzleConfig = {
            requiredPlayers: 2,
            requiredHoldTime: 3.0,
            elements: [
                {
                    id: 'switch_1',
                    type: 'switch',
                    x: 150,
                    y: 300,
                    width: 50,
                    height: 50,
                    requiresContinuousInteraction: true
                },
                {
                    id: 'switch_2',
                    type: 'switch',
                    x: 650,
                    y: 300,
                    width: 50,
                    height: 50,
                    requiresContinuousInteraction: true
                }
            ]
        };
        
        // Create and add the dual switch puzzle
        const dualSwitchPuzzle = new DualSwitchPuzzle(puzzleConfig);
        this.puzzleManager.addPuzzle('main_puzzle', dualSwitchPuzzle);
        
        console.log('Dual switch puzzle initialized');
    }
    
    updateLevel(deltaTime, players, gameEngine) {
        // Show intro message
        if (!this.introMessageShown) {
            this.introMessageTime += deltaTime;
            if (this.introMessageTime >= this.introMessageDuration) {
                this.introMessageShown = true;
                this.activatePuzzle();
            }
        }
        
        // Update puzzle system
        if (this.puzzleManager) {
            this.puzzleManager.update(deltaTime, players);
            
            // Check if puzzle is completed
            if (!this.puzzleCompleted && this.puzzleManager.hasCompletedPuzzle()) {
                this.onPuzzleCompleted();
            }
        }
        
        // Handle completion timer
        if (this.puzzleCompleted) {
            this.completionTimer += deltaTime;
            if (this.completionTimer >= this.completionDelay) {
                this.complete();
            }
        }
    }
    
    activatePuzzle() {
        if (this.puzzleManager) {
            this.puzzleManager.activatePuzzle('main_puzzle');
            console.log('Dual switch puzzle activated - both players must work together');
        }
    }
    
    onPuzzleCompleted() {
        if (this.puzzleCompleted) return;
        
        console.log('Level 3 puzzle completed!');
        this.puzzleCompleted = true;
        this.completionTimer = 0;
        
        // Complete the objective
        this.completeObjective('solve_puzzle');
        
        // Create completion effect
        this.createCompletionEffect();
    }
    
    createCompletionEffect() {
        const effect = {
            type: 'puzzle_complete',
            x: this.canvas?.width / 2 || 400,
            y: this.canvas?.height / 2 || 300,
            timeLeft: 3.0,
            maxTime: 3.0,
            message: 'PUZZLE SOLVED!'
        };
        
        if (!this.effects) {
            this.effects = [];
        }
        this.effects.push(effect);
    }
    
    checkObjective(objective, players, gameEngine) {
        switch (objective) {
            case 'solve_puzzle':
                return this.puzzleCompleted;
                
            default:
                return super.checkObjective(objective, players, gameEngine);
        }
    }
    
    renderLevel(ctx, spriteRenderer) {
        // Render intro message
        if (!this.introMessageShown) {
            this.renderIntroMessage(ctx);
        }
        
        // Render puzzle system
        if (this.puzzleManager) {
            this.puzzleManager.render(ctx, spriteRenderer);
        }
        
        // Render instructions
        if (this.introMessageShown && !this.puzzleCompleted) {
            this.renderInstructions(ctx);
        }
        
        // Render completion message
        if (this.puzzleCompleted) {
            this.renderCompletionMessage(ctx);
        }
    }
    
    renderIntroMessage(ctx) {
        const alpha = Math.min(1.0, this.introMessageTime / 1.5);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#00aaff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL 3: COOPERATION', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
        
        // Instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText('Two survivors must work as one', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        ctx.fillText('Both switches must be held simultaneously', ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
        ctx.fillText('Trust and timing are everything', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
        ctx.fillText('Neither can succeed alone...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderInstructions(ctx) {
        // Show puzzle instructions
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        
        const puzzle = this.puzzleManager?.getActivePuzzle();
        if (puzzle) {
            const status = puzzle.getStatus();
            
            if (status.interactingPlayers.length === 0) {
                ctx.fillText('Both players must stand on the SWITCHES', ctx.canvas.width / 2, ctx.canvas.height - 80);
                ctx.fillText('Work together to hold them simultaneously', ctx.canvas.width / 2, ctx.canvas.height - 60);
            } else if (status.interactingPlayers.length === 1) {
                ctx.fillText('One switch activated - need the other player!', ctx.canvas.width / 2, ctx.canvas.height - 70);
            } else if (status.interactingPlayers.length >= 2) {
                ctx.fillStyle = '#00ff00';
                ctx.fillText('Both switches active - hold position!', ctx.canvas.width / 2, ctx.canvas.height - 70);
            }
        }
        
        ctx.textAlign = 'left';
    }
    
    renderCompletionMessage(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Background
        ctx.fillStyle = 'rgba(0, 50, 100, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Message
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('COOPERATION SUCCESSFUL', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        ctx.fillText('Two minds working as one', ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText('But the hardest choice lies ahead...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
        
        // Countdown to next level
        const timeLeft = Math.ceil(this.completionDelay - this.completionTimer);
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px monospace';
        ctx.fillText(`Advancing in ${timeLeft}s...`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 70);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderUI(ctx) {
        // Show level info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('LEVEL 3: COOPERATION', 10, 25);
        
        // Show objectives
        ctx.fillStyle = '#cccccc';
        ctx.font = '12px monospace';
        let yOffset = 45;
        
        for (const [objective, completed] of this.objectives) {
            const status = completed ? '✓' : '○';
            const color = completed ? '#00ff00' : '#ffffff';
            
            ctx.fillStyle = color;
            ctx.fillText(`${status} ${this.getObjectiveText(objective)}`, 10, yOffset);
            yOffset += 15;
        }
        
        // Show puzzle status
        if (this.puzzleManager) {
            const puzzle = this.puzzleManager.getActivePuzzle();
            if (puzzle) {
                const status = puzzle.getStatus();
                
                ctx.fillStyle = '#00aaff';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('PUZZLE STATUS:', 10, yOffset + 10);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
                ctx.fillText(`Players on switches: ${status.interactingPlayers.length}/2`, 10, yOffset + 25);
                
                if (status.interactingPlayers.length > 0) {
                    ctx.fillStyle = '#ffff00';
                    status.interactingPlayers.forEach((playerId, index) => {
                        ctx.fillText(`- ${playerId}`, 10, yOffset + 40 + (index * 12));
                    });
                }
                
                // Show progress if puzzle is being solved
                if (puzzle.currentHoldTime > 0) {
                    const progress = Math.round((puzzle.currentHoldTime / puzzle.requiredHoldTime) * 100);
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText(`Progress: ${progress}%`, 10, yOffset + 70);
                }
            }
        }
    }
    
    getObjectiveText(objective) {
        switch (objective) {
            case 'solve_puzzle':
                return 'Solve the dual-switch puzzle';
            default:
                return objective;
        }
    }
    
    onLevelCompleted() {
        console.log('Level 3 completed! Players demonstrated perfect cooperation.');
        
        // Count remaining players
        const alivePlayers = Array.from(this.gameEngine?.players?.values() || []).filter(p => p.isAlive);
        console.log(`${alivePlayers.length} players advancing to Level 4 - the final sacrifice`);
    }
    
    onDestroy() {
        // Clean up puzzle system
        if (this.puzzleManager) {
            this.puzzleManager.destroy();
            this.puzzleManager = null;
        }
        
        super.onDestroy();
    }
}