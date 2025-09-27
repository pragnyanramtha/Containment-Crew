import { Level } from '../engine/Level.js';
import { HoldMechanismPuzzle, PuzzleManager } from '../engine/PuzzleSystem.js';

/**
 * Level 4: Hold Mechanism and Second Sacrifice
 * The final two players face a mechanism that requires permanent interaction
 * One must sacrifice themselves to allow the other to advance to Level 5
 */
export class Level4 extends Level {
    constructor(levelNumber, levelConfig) {
        super(levelNumber, levelConfig);
        
        // Level 4 specific state
        this.puzzleManager = null;
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.introMessageDuration = 5.0;
        
        // Sacrifice state
        this.sacrificeCompleted = false;
        this.completionTimer = 0;
        this.completionDelay = 4.0;
        
        // Final player advancement
        this.finalPlayerAdvanced = false;
    }
    
    async loadAssets() {
        console.log('Loading Level 4 assets...');
        // Assets will be handled by sprite manager
    }
    
    onActivate() {
        console.log('Level 4 activated - Hold Mechanism and Second Sacrifice');
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.sacrificeCompleted = false;
        this.completionTimer = 0;
        this.finalPlayerAdvanced = false;
        
        // Initialize puzzle system
        this.initializePuzzleSystem();
    }
    
    initializePuzzleSystem() {
        // Create puzzle manager
        this.puzzleManager = new PuzzleManager(this.gameEngine);
        
        // Create hold mechanism puzzle configuration
        const puzzleConfig = {
            requiredPlayers: 2,
            sacrificeDelay: 5.0,
            mechanismX: 150,
            mechanismY: 300,
            doorX: 650,
            doorY: 250
        };
        
        // Create and add the hold mechanism puzzle
        const holdMechanismPuzzle = new HoldMechanismPuzzle(puzzleConfig);
        this.puzzleManager.addPuzzle('sacrifice_puzzle', holdMechanismPuzzle);
        
        console.log('Hold mechanism puzzle initialized');
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
            
            // Check if sacrifice is completed
            if (!this.sacrificeCompleted && this.puzzleManager.hasCompletedPuzzle()) {
                this.onSacrificeCompleted();
            }
        }
        
        // Handle completion timer
        if (this.sacrificeCompleted) {
            this.completionTimer += deltaTime;
            if (this.completionTimer >= this.completionDelay) {
                this.complete();
            }
        }
    }
    
    activatePuzzle() {
        if (this.puzzleManager) {
            this.puzzleManager.activatePuzzle('sacrifice_puzzle');
            console.log('Hold mechanism puzzle activated - final sacrifice required');
        }
    }
    
    onSacrificeCompleted() {
        if (this.sacrificeCompleted) return;
        
        console.log('Level 4 sacrifice completed!');
        this.sacrificeCompleted = true;
        this.completionTimer = 0;
        
        // Complete the objectives
        this.completeObjective('solve_puzzle');
        this.completeObjective('sacrifice_one_player');
        
        // Mark final player advancement
        this.finalPlayerAdvanced = true;
        
        // Create completion effect
        this.createSacrificeEffect();
    }
    
    createSacrificeEffect() {
        const effect = {
            type: 'final_sacrifice',
            x: this.canvas?.width / 2 || 400,
            y: this.canvas?.height / 2 || 300,
            timeLeft: 4.0,
            maxTime: 4.0,
            message: 'FINAL SACRIFICE MADE'
        };
        
        if (!this.effects) {
            this.effects = [];
        }
        this.effects.push(effect);
    }
    
    checkObjective(objective, players, gameEngine) {
        switch (objective) {
            case 'solve_puzzle':
                return this.sacrificeCompleted;
                
            case 'sacrifice_one_player':
                return this.sacrificeCompleted;
                
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
        if (this.introMessageShown && !this.sacrificeCompleted) {
            this.renderInstructions(ctx);
        }
        
        // Render completion message
        if (this.sacrificeCompleted) {
            this.renderCompletionMessage(ctx);
        }
        
        // Render custom effects
        this.renderCustomEffects(ctx);
    }
    
    renderIntroMessage(ctx) {
        const alpha = Math.min(1.0, this.introMessageTime / 2.0);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(50, 0, 0, 0.9)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL 4: THE FINAL CHOICE', ctx.canvas.width / 2, ctx.canvas.height / 2 - 120);
        
        // Story text
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        ctx.fillText('The reactor core lies beyond this door', ctx.canvas.width / 2, ctx.canvas.height / 2 - 60);
        ctx.fillText('But the mechanism requires constant pressure', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        ctx.fillText('One must stay behind to hold it open', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
        ctx.fillText('The other will face the reactor alone', ctx.canvas.width / 2, ctx.canvas.height / 2);
        
        // Dramatic pause
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('Who will make the ultimate sacrifice?', ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderInstructions(ctx) {
        const puzzle = this.puzzleManager?.getActivePuzzle();
        if (!puzzle) return;
        
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        
        // Show current puzzle state
        if (!puzzle.mechanism.interactingPlayer && puzzle.exitDoor.playersNear.length === 0) {
            ctx.fillText('One player must hold the MECHANISM', ctx.canvas.width / 2, ctx.canvas.height - 100);
            ctx.fillText('The other must approach the EXIT DOOR', ctx.canvas.width / 2, ctx.canvas.height - 80);
        } else if (puzzle.mechanism.interactingPlayer && puzzle.exitDoor.playersNear.length === 0) {
            ctx.fillText('The other player must approach the EXIT DOOR!', ctx.canvas.width / 2, ctx.canvas.height - 80);
        } else if (!puzzle.mechanism.interactingPlayer && puzzle.exitDoor.playersNear.length > 0) {
            ctx.fillText('Someone must hold the MECHANISM!', ctx.canvas.width / 2, ctx.canvas.height - 80);
        } else if (puzzle.sacrificePhase) {
            // Sacrifice phase instructions are handled by the puzzle itself
        } else {
            ctx.fillStyle = '#00ff00';
            ctx.fillText('Both players in position - sacrifice will begin soon...', ctx.canvas.width / 2, ctx.canvas.height - 80);
        }
        
        ctx.textAlign = 'left';
    }
    
    renderCompletionMessage(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Background
        ctx.fillStyle = 'rgba(100, 0, 0, 0.9)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Message
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('THE FINAL SACRIFICE', ctx.canvas.width / 2, ctx.canvas.height / 2 - 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        ctx.fillText('One hero holds the door for eternity', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
        ctx.fillText('One survivor carries the hopes of humanity', ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText('The reactor core awaits...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
        
        // Show which player advanced
        const puzzle = this.puzzleManager?.getPuzzle('sacrifice_puzzle');
        if (puzzle && puzzle.advancingPlayer) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 20px monospace';
            ctx.fillText(`${puzzle.advancingPlayer.id} advances to Level 5`, 
                        ctx.canvas.width / 2, ctx.canvas.height / 2 + 60);
        }
        
        // Countdown to next level
        const timeLeft = Math.ceil(this.completionDelay - this.completionTimer);
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px monospace';
        ctx.fillText(`Final level begins in ${timeLeft}s...`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 100);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderCustomEffects(ctx) {
        if (!this.effects) return;
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.timeLeft -= 1/60; // Assuming 60 FPS
            
            if (effect.timeLeft <= 0) {
                this.effects.splice(i, 1);
                continue;
            }
            
            const alpha = effect.timeLeft / effect.maxTime;
            
            if (effect.type === 'final_sacrifice') {
                ctx.save();
                ctx.globalAlpha = alpha;
                
                // Pulsing red effect
                const pulse = Math.sin((effect.maxTime - effect.timeLeft) * 8) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
                ctx.font = 'bold 28px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(effect.message, effect.x, effect.y - 30);
                
                // Expanding circle effect
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 4;
                const radius = (1 - alpha) * 100;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.restore();
            }
        }
        
        ctx.textAlign = 'left';
    }
    
    renderUI(ctx) {
        // Show level info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('LEVEL 4: THE FINAL CHOICE', 10, 25);
        
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
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('SACRIFICE STATUS:', 10, yOffset + 10);
                
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
                
                // Show mechanism status
                if (puzzle.mechanism.interactingPlayer) {
                    ctx.fillStyle = '#ffff00';
                    ctx.fillText(`Mechanism: ${puzzle.mechanism.interactingPlayer.id} holding`, 10, yOffset + 25);
                } else {
                    ctx.fillStyle = '#666666';
                    ctx.fillText('Mechanism: No one holding', 10, yOffset + 25);
                }
                
                // Show door status
                if (puzzle.exitDoor.playersNear.length > 0) {
                    ctx.fillStyle = '#00ff00';
                    ctx.fillText(`Door: ${puzzle.exitDoor.playersNear.length} player(s) near`, 10, yOffset + 40);
                } else {
                    ctx.fillStyle = '#666666';
                    ctx.fillText('Door: No players near', 10, yOffset + 40);
                }
                
                // Show sacrifice phase status
                if (puzzle.sacrificePhase) {
                    const timeLeft = Math.ceil(puzzle.sacrificeDelay - puzzle.sacrificeTimer);
                    ctx.fillStyle = '#ff0000';
                    ctx.fillText(`SACRIFICE IN: ${timeLeft}s`, 10, yOffset + 55);
                }
            }
        }
    }
    
    getObjectiveText(objective) {
        switch (objective) {
            case 'solve_puzzle':
                return 'Activate the mechanism';
            case 'sacrifice_one_player':
                return 'Make the final sacrifice';
            default:
                return objective;
        }
    }
    
    onLevelCompleted() {
        console.log('Level 4 completed! The final sacrifice has been made.');
        
        // Count remaining players
        const alivePlayers = Array.from(this.gameEngine?.players?.values() || []).filter(p => p.isAlive);
        console.log(`${alivePlayers.length} player remaining for the final challenge - Level 5`);
        
        // Show final player info
        const puzzle = this.puzzleManager?.getPuzzle('sacrifice_puzzle');
        if (puzzle && puzzle.advancingPlayer) {
            console.log(`${puzzle.advancingPlayer.id} carries the hopes of humanity into the reactor core`);
        }
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