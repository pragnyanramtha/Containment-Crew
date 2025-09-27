import { Level } from '../engine/Level.js';

/**
 * Level 2: Boss Fight and First Sacrifice
 * Players face a mutant boss, then must make their first sacrifice decision
 */
export class Level2 extends Level {
    constructor(levelNumber, levelConfig) {
        super(levelNumber, levelConfig);
        
        // Level 2 specific state
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.sacrificePhase = false;
        this.sacrificeCompleted = false;
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.introMessageDuration = 3.0;
        
        // Sacrifice mechanism objects
        this.elevator = null;
        this.button = null;
        this.playerOnButton = null;
        this.elevatorActivated = false;
        this.sacrificeTimer = 0;
        this.sacrificeDelay = 3.0; // 3 seconds to make sacrifice decision
        
        // Zombie horde after boss
        this.hordeSpawned = false;
        this.hordeTimer = 0;
        this.hordeDelay = 2.0; // 2 seconds after boss death
    }
    
    async loadAssets() {
        console.log('Loading Level 2 assets...');
        // Assets will be handled by sprite manager
    }
    
    onActivate() {
        console.log('Level 2 activated - Boss Fight and First Sacrifice');
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.sacrificePhase = false;
        this.sacrificeCompleted = false;
        this.hordeSpawned = false;
        this.hordeTimer = 0;
        this.elevatorActivated = false;
        this.playerOnButton = null;
        
        // Create elevator and button objects
        this.createSacrificeObjects();
    }
    
    createSacrificeObjects() {
        // Elevator on the right side of the screen
        this.elevator = {
            x: 700,
            y: 300,
            width: 80,
            height: 100,
            active: false,
            playersInside: []
        };
        
        // Button on the left side of the screen
        this.button = {
            x: 50,
            y: 350,
            width: 40,
            height: 40,
            pressed: false,
            playerOn: null
        };
    }
    
    updateLevel(deltaTime, players, gameEngine) {
        // Show intro message
        if (!this.introMessageShown) {
            this.introMessageTime += deltaTime;
            if (this.introMessageTime >= this.introMessageDuration) {
                this.introMessageShown = true;
                this.spawnBoss(gameEngine);
            }
        }
        
        // Handle boss phase
        if (this.bossSpawned && !this.bossDefeated) {
            this.updateBossPhase(deltaTime, players, gameEngine);
        }
        
        // Handle post-boss horde
        if (this.bossDefeated && !this.hordeSpawned) {
            this.hordeTimer += deltaTime;
            if (this.hordeTimer >= this.hordeDelay) {
                this.spawnZombieHorde(gameEngine);
            }
        }
        
        // Handle sacrifice phase
        if (this.sacrificePhase && !this.sacrificeCompleted) {
            this.updateSacrificePhase(deltaTime, players, gameEngine);
        }
    }
    
    spawnBoss(gameEngine) {
        if (this.bossSpawned) return;
        
        console.log('Spawning mutant boss in Level 2');
        this.bossSpawned = true;
        
        // Spawn boss in center of screen
        const enemyManager = gameEngine.getEnemyManager();
        if (enemyManager) {
            const boss = enemyManager.spawnEnemy('mutant_boss', 400, 200);
            boss.gameLevel = this; // Reference for boss to communicate with level
            console.log('Boss spawned with', boss.health, 'health');
        }
    }
    
    updateBossPhase(deltaTime, players, gameEngine) {
        // Check if boss is still alive
        const enemyManager = gameEngine.getEnemyManager();
        if (enemyManager) {
            const aliveEnemies = enemyManager.getAliveEnemies();
            const boss = aliveEnemies.find(enemy => enemy.type === 'mutant_boss');
            
            if (!boss) {
                // Boss is dead
                this.onBossDefeated();
            }
        }
    }
    
    onBossDefeated() {
        if (this.bossDefeated) return;
        
        console.log('Boss defeated in Level 2!');
        this.bossDefeated = true;
        this.completeObjective('defeat_boss');
        
        // Start timer for zombie horde
        this.hordeTimer = 0;
    }
    
    spawnZombieHorde(gameEngine) {
        if (this.hordeSpawned) return;
        
        console.log('Spawning zombie horde - players must escape!');
        this.hordeSpawned = true;
        this.sacrificePhase = true;
        
        // Spawn multiple zombies around the edges
        const enemyManager = gameEngine.getEnemyManager();
        if (enemyManager) {
            const canvasWidth = gameEngine.canvas.width;
            const canvasHeight = gameEngine.canvas.height;
            
            // Spawn zombies from multiple directions
            const spawnPositions = [
                { x: 50, y: 50 },
                { x: canvasWidth - 100, y: 50 },
                { x: 50, y: canvasHeight - 100 },
                { x: canvasWidth - 100, y: canvasHeight - 100 },
                { x: canvasWidth / 2, y: 50 },
                { x: canvasWidth / 2, y: canvasHeight - 100 }
            ];
            
            for (const pos of spawnPositions) {
                enemyManager.spawnEnemy('zombie', pos.x, pos.y);
            }
        }
    }
    
    updateSacrificePhase(deltaTime, players, gameEngine) {
        // Update button state
        this.updateButton(players);
        
        // Update elevator state
        this.updateElevator(players);
        
        // Check if sacrifice can be completed
        if (this.button.pressed && this.elevator.playersInside.length > 0) {
            this.sacrificeTimer += deltaTime;
            
            if (this.sacrificeTimer >= this.sacrificeDelay) {
                this.completeSacrifice(gameEngine);
            }
        } else {
            this.sacrificeTimer = 0;
        }
    }
    
    updateButton(players) {
        this.button.pressed = false;
        this.button.playerOn = null;
        
        // Check if any player is on the button
        for (const player of players) {
            if (!player.isAlive) continue;
            
            if (this.isPlayerOnObject(player, this.button)) {
                this.button.pressed = true;
                this.button.playerOn = player;
                this.playerOnButton = player;
                break;
            }
        }
        
        if (!this.button.pressed) {
            this.playerOnButton = null;
        }
    }
    
    updateElevator(players) {
        this.elevator.playersInside = [];
        
        // Check which players are inside the elevator
        for (const player of players) {
            if (!player.isAlive) continue;
            
            if (this.isPlayerOnObject(player, this.elevator)) {
                this.elevator.playersInside.push(player);
            }
        }
        
        // Elevator is active if button is pressed
        this.elevator.active = this.button.pressed;
    }
    
    isPlayerOnObject(player, object) {
        return player.x + player.width > object.x &&
               player.x < object.x + object.width &&
               player.y + player.height > object.y &&
               player.y < object.y + object.height;
    }
    
    completeSacrifice(gameEngine) {
        if (this.sacrificeCompleted) return;
        
        console.log('Completing first sacrifice...');
        this.sacrificeCompleted = true;
        this.elevatorActivated = true;
        
        // Sacrifice the player on the button
        if (this.playerOnButton) {
            console.log(`Player ${this.playerOnButton.id} sacrificed themselves to save the others`);
            
            // Remove the sacrificed player
            this.playerOnButton.isAlive = false;
            this.playerOnButton.health = 0;
            
            // Create sacrifice effect
            this.createSacrificeEffect(this.playerOnButton);
        }
        
        // Clear all enemies (players escaped)
        const enemyManager = gameEngine.getEnemyManager();
        if (enemyManager) {
            enemyManager.clearAllEnemies();
        }
        
        // Complete the level
        this.completeObjective('sacrifice_one_player');
        
        // Mark level as completed after a short delay
        setTimeout(() => {
            this.isCompleted = true;
            this.onLevelCompleted();
        }, 2000);
    }
    
    createSacrificeEffect(player) {
        // Create dramatic sacrifice effect
        const effect = {
            type: 'sacrifice',
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            timeLeft: 3.0,
            maxTime: 3.0,
            message: 'SACRIFICE MADE'
        };
        
        // Add to effects for rendering
        if (!this.effects) {
            this.effects = [];
        }
        this.effects.push(effect);
    }
    
    checkObjective(objective, players, gameEngine) {
        switch (objective) {
            case 'defeat_boss':
                return this.bossDefeated;
                
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
        
        // Render sacrifice objects
        if (this.sacrificePhase) {
            this.renderSacrificeObjects(ctx);
        }
        
        // Render sacrifice instructions
        if (this.sacrificePhase && !this.sacrificeCompleted) {
            this.renderSacrificeInstructions(ctx);
        }
        
        // Render level completion message
        if (this.isCompleted) {
            this.renderCompletionMessage(ctx);
        }
        
        // Render effects
        this.renderEffects(ctx);
    }
    
    renderIntroMessage(ctx) {
        const alpha = Math.min(1.0, this.introMessageTime / 1.0);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL 2: THE GUARDIAN', ctx.canvas.width / 2, ctx.canvas.height / 2 - 80);
        
        // Instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText('A massive mutant blocks your path', ctx.canvas.width / 2, ctx.canvas.height / 2 - 30);
        ctx.fillText('It moves slowly but will fixate on one victim', ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText('If its target dies, the beast will stop...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
        ctx.fillText('Use this knowledge wisely', ctx.canvas.width / 2, ctx.canvas.height / 2 + 60);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderSacrificeObjects(ctx) {
        // Render button
        const buttonColor = this.button.pressed ? '#00ff00' : '#666666';
        ctx.fillStyle = buttonColor;
        ctx.fillRect(this.button.x, this.button.y, this.button.width, this.button.height);
        
        // Button border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.button.x, this.button.y, this.button.width, this.button.height);
        
        // Button label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BUTTON', this.button.x + this.button.width / 2, this.button.y - 5);
        
        // Render elevator
        const elevatorColor = this.elevator.active ? '#00aa00' : '#444444';
        ctx.fillStyle = elevatorColor;
        ctx.fillRect(this.elevator.x, this.elevator.y, this.elevator.width, this.elevator.height);
        
        // Elevator border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.elevator.x, this.elevator.y, this.elevator.width, this.elevator.height);
        
        // Elevator label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('ELEVATOR', this.elevator.x + this.elevator.width / 2, this.elevator.y - 5);
        
        ctx.textAlign = 'left';
    }
    
    renderSacrificeInstructions(ctx) {
        // Show sacrifice mechanism instructions
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        
        if (!this.button.pressed && this.elevator.playersInside.length === 0) {
            ctx.fillText('One player must stand on the BUTTON', ctx.canvas.width / 2, ctx.canvas.height - 80);
            ctx.fillText('Others must enter the ELEVATOR', ctx.canvas.width / 2, ctx.canvas.height - 60);
        } else if (this.button.pressed && this.elevator.playersInside.length === 0) {
            ctx.fillText('Others must enter the ELEVATOR!', ctx.canvas.width / 2, ctx.canvas.height - 70);
        } else if (!this.button.pressed && this.elevator.playersInside.length > 0) {
            ctx.fillText('Someone must stand on the BUTTON!', ctx.canvas.width / 2, ctx.canvas.height - 70);
        } else if (this.button.pressed && this.elevator.playersInside.length > 0) {
            const timeLeft = Math.ceil(this.sacrificeDelay - this.sacrificeTimer);
            ctx.fillStyle = '#ff0000';
            ctx.fillText(`SACRIFICE IN ${timeLeft}...`, ctx.canvas.width / 2, ctx.canvas.height - 70);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px monospace';
            ctx.fillText('The player on the button will be left behind', ctx.canvas.width / 2, ctx.canvas.height - 50);
        }
        
        ctx.textAlign = 'left';
    }
    
    renderCompletionMessage(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Background
        ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Message
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FIRST SACRIFICE MADE', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        ctx.fillText('One hero gave their life for the mission', ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.fillText('The remaining survivors must continue...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 30);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderEffects(ctx) {
        if (!this.effects) return;
        
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.timeLeft -= 1/60; // Assuming 60 FPS
            
            if (effect.timeLeft <= 0) {
                this.effects.splice(i, 1);
                continue;
            }
            
            const alpha = effect.timeLeft / effect.maxTime;
            
            if (effect.type === 'sacrifice') {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(effect.message, effect.x, effect.y - 20);
                ctx.restore();
            }
        }
        
        ctx.textAlign = 'left';
    }
    
    renderUI(ctx) {
        // Show level info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('LEVEL 2: THE GUARDIAN', 10, 25);
        
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
        
        // Show sacrifice status
        if (this.sacrificePhase && !this.sacrificeCompleted) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('SACRIFICE PHASE ACTIVE', 10, yOffset + 10);
            
            if (this.playerOnButton) {
                ctx.fillStyle = '#ff6666';
                ctx.font = '12px monospace';
                ctx.fillText(`${this.playerOnButton.id} on button`, 10, yOffset + 25);
            }
            
            if (this.elevator.playersInside.length > 0) {
                ctx.fillStyle = '#66ff66';
                ctx.fillText(`${this.elevator.playersInside.length} in elevator`, 10, yOffset + 40);
            }
        }
    }
    
    getObjectiveText(objective) {
        switch (objective) {
            case 'defeat_boss':
                return 'Defeat the mutant boss';
            case 'sacrifice_one_player':
                return 'Make the first sacrifice';
            default:
                return objective;
        }
    }
    
    spawnEnemies(gameEngine) {
        // This will be called by LevelManager, but we handle boss spawning manually
        // in the level flow, so we don't spawn enemies immediately
        console.log('Level 2 enemy spawning handled by level flow');
    }
    
    onLevelCompleted() {
        console.log('Level 2 completed! First sacrifice has been made.');
        
        // Count remaining players
        const alivePlayers = Array.from(this.gameEngine?.players?.values() || []).filter(p => p.isAlive);
        console.log(`${alivePlayers.length} players remaining for Level 3`);
    }
}