import { Level } from '../engine/Level.js';

/**
 * Level 1: Combat Introduction
 * Players learn combat mechanics by fighting radioactive zombies
 */
export class Level1 extends Level {
    constructor(levelNumber, levelConfig) {
        super(levelNumber, levelConfig);
        
        // Level 1 specific state
        this.combatStarted = false;
        this.enemiesSpawned = false;
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.introMessageDuration = 3.0;
    }
    
    async loadAssets() {
        // Load Level 1 specific assets
        console.log('Loading Level 1 assets...');
        
        // Enemy sprites will be created by the sprite manager in GameEngine
        // No need to create them here as they're handled globally
    }
    

    
    onActivate() {
        console.log('Level 1 activated - Combat Introduction');
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.combatStarted = false;
        this.enemiesSpawned = false;
    }
    
    updateLevel(deltaTime, players, gameEngine) {
        // Show intro message
        if (!this.introMessageShown) {
            this.introMessageTime += deltaTime;
            if (this.introMessageTime >= this.introMessageDuration) {
                this.introMessageShown = true;
                this.startCombat(gameEngine);
            }
        }
        
        // Check if all enemies are defeated
        if (this.combatStarted && gameEngine.getEnemyManager()) {
            const aliveEnemies = gameEngine.getEnemyManager().getAliveEnemies();
            if (aliveEnemies.length === 0 && this.enemiesSpawned) {
                this.onAllEnemiesDefeated();
            }
        }
    }
    
    startCombat(gameEngine) {
        if (this.combatStarted) return;
        
        console.log('Starting combat in Level 1');
        this.combatStarted = true;
        this.enemiesSpawned = true;
        
        // Enemies are spawned by the LevelManager when the level activates
        // We just need to mark that combat has started
    }
    
    onAllEnemiesDefeated() {
        console.log('All enemies defeated in Level 1!');
        this.completeObjective('defeat_all_enemies');
        
        // Check if any players are still alive
        const alivePlayers = Array.from(this.gameEngine.players.values()).filter(p => p.isAlive);
        if (alivePlayers.length > 0) {
            this.completeObjective('survive');
        }
    }
    
    checkObjective(objective, players, gameEngine) {
        switch (objective) {
            case 'defeat_all_enemies':
                if (gameEngine && gameEngine.getEnemyManager()) {
                    const aliveEnemies = gameEngine.getEnemyManager().getAliveEnemies();
                    return aliveEnemies.length === 0 && this.enemiesSpawned;
                }
                return false;
                
            case 'survive':
                // At least one player must be alive
                return players.some(player => player.isAlive);
                
            default:
                return super.checkObjective(objective, players, gameEngine);
        }
    }
    
    renderLevel(ctx, spriteRenderer) {
        // Render intro message
        if (!this.introMessageShown) {
            this.renderIntroMessage(ctx);
        }
        
        // Render combat instructions
        if (this.combatStarted) {
            this.renderCombatInstructions(ctx);
        }
        
        // Render level completion message
        if (this.isCompleted) {
            this.renderCompletionMessage(ctx);
        }
    }
    
    renderIntroMessage(ctx) {
        const alpha = Math.min(1.0, this.introMessageTime / 1.0);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL 1: FIRST CONTACT', ctx.canvas.width / 2, ctx.canvas.height / 2 - 60);
        
        // Instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText('Radioactive mutants have been detected ahead', ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
        ctx.fillText('Use SPACE to attack enemies', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
        ctx.fillText('Remember: Death is permanent - be careful!', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderCombatInstructions(ctx) {
        // Show combat controls in corner
        ctx.fillStyle = '#ffff88';
        ctx.font = '14px monospace';
        ctx.fillText('COMBAT CONTROLS:', 10, ctx.canvas.height - 80);
        ctx.fillText('SPACE - Attack', 10, ctx.canvas.height - 60);
        ctx.fillText('WASD - Move', 10, ctx.canvas.height - 40);
        
        // Show enemy count
        if (this.gameEngine && this.gameEngine.getEnemyManager()) {
            const aliveEnemies = this.gameEngine.getEnemyManager().getAliveEnemies().length;
            ctx.fillStyle = '#ff8888';
            ctx.font = 'bold 16px monospace';
            ctx.fillText(`Enemies Remaining: ${aliveEnemies}`, ctx.canvas.width - 250, 30);
        }
    }
    
    renderCompletionMessage(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Background
        ctx.fillStyle = 'rgba(0, 50, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Success message
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL 1 COMPLETE!', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        ctx.fillText('All enemies defeated!', ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText('Prepare for greater challenges ahead...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderUI(ctx) {
        // Show level info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('LEVEL 1: FIRST CONTACT', 10, 25);
        
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
    }
    
    getObjectiveText(objective) {
        switch (objective) {
            case 'defeat_all_enemies':
                return 'Defeat all enemies';
            case 'survive':
                return 'Keep at least one player alive';
            default:
                return objective;
        }
    }
    
    onLevelCompleted() {
        console.log('Level 1 completed! Players have learned combat.');
        
        // Transition to Level 2 after a delay
        setTimeout(() => {
            if (this.gameEngine && this.gameEngine.levelManager) {
                this.gameEngine.levelManager.changeLevel(2);
            }
        }, 3000);
    }
}