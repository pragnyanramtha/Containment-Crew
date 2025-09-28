import { Level } from '../engine/Level.js';
import { EnhancedNPC } from '../engine/EnhancedNPC.js';

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
        
        // Enhanced story elements
        this.woundedSoldier = null;
        this.radioOperator = null;
        this.combatPhase = 'preparation'; // preparation, engagement, aftermath
        this.playersWarned = false;
        this.firstContactMade = false;
        
        // Environmental hazards
        this.radiationZones = [
            { x: 100, y: 100, radius: 80, intensity: 0.3 },
            { x: 600, y: 400, radius: 60, intensity: 0.5 }
        ];
        
        // Combat atmosphere
        this.emergencyLights = true;
        this.alarmTimer = 0;
        this.atmosphereTimer = 0;
    }
    
    async loadAssets() {
        // Load Level 1 specific assets
        console.log('Loading Level 1 assets...');
        
        // Create story NPCs
        this.createStoryNPCs();
        
        // Enemy sprites will be created by the sprite manager in GameEngine
        // No need to create them here as they're handled globally
    }

    createStoryNPCs() {
        // Wounded soldier who gives combat tips
        this.woundedSoldier = new EnhancedNPC({
            id: 'soldier_viktor',
            type: 'wounded_soldier',
            name: 'Sergeant Viktor Petrov',
            x: 50,
            y: 300,
            width: 48,
            height: 48,
            personality: 'battle_hardened',
            behaviorState: 'helpful',
            emotionalState: 'determined',
            health: 30, // Wounded
            dialogueTrees: {
                default: [
                    "You're not soldiers, but you'll have to fight like them.",
                    "The radiation... it's changed them. They're not human anymore.",
                    "Aim for the head. Body shots just slow them down.",
                    "Stay together. Watch each other's backs."
                ],
                tactical: [
                    "Use the environment. Bottleneck them in doorways.",
                    "Don't let them surround you. Keep moving.",
                    "Save your energy. More will come.",
                    "If someone falls, don't try to save them. Keep the mission alive."
                ],
                personal: [
                    "I've lost my whole squad to those things.",
                    "My leg's broken, but I can still help you prepare.",
                    "Promise me you'll make it to the reactor.",
                    "Don't let our sacrifice be for nothing."
                ]
            },
            color: '#4488aa',
            interactionRadius: 100
        });

        // Radio operator providing updates
        this.radioOperator = new EnhancedNPC({
            id: 'radio_anna',
            type: 'radio_operator',
            name: 'Anna Volkov',
            x: 700,
            y: 150,
            width: 44,
            height: 44,
            personality: 'professional',
            behaviorState: 'helpful',
            emotionalState: 'focused',
            dialogueTrees: {
                default: [
                    "I'm monitoring all emergency frequencies.",
                    "Reports coming in from all sectors... it's bad.",
                    "The contamination is spreading faster than predicted.",
                    "You're our only hope of stopping this."
                ],
                updates: [
                    "Sector 7 has gone dark. No survivors.",
                    "Military evacuation failed. Too many casualties.",
                    "Radiation levels rising. You don't have much time.",
                    "The reactor core temperature is critical."
                ]
            },
            color: '#aa8844',
            interactionRadius: 90
        });

        // Add to NPCs list
        this.npcs.push(this.woundedSoldier);
        this.npcs.push(this.radioOperator);
    }
    

    
    onActivate() {
        console.log('Level 1 activated - Combat Introduction');
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.combatStarted = false;
        this.enemiesSpawned = false;
    }
    
    updateLevel(deltaTime, players, gameEngine) {
        // Update atmosphere
        this.updateAtmosphere(deltaTime);
        
        // Update combat phase
        this.updateCombatPhase(deltaTime, players, gameEngine);
        
        // Update radiation zones
        this.updateRadiationZones(deltaTime, players);
        
        // Update story NPCs
        this.updateStoryNPCs(deltaTime, players);
        
        // Show intro message
        if (!this.introMessageShown) {
            this.introMessageTime += deltaTime;
            if (this.introMessageTime >= this.introMessageDuration) {
                this.introMessageShown = true;
                this.startCombat(gameEngine);
            }
        }
        
        // Check if all enemies are defeated
        if (this.combatStarted && gameEngine && gameEngine.getEnemyManager()) {
            const aliveEnemies = gameEngine.getEnemyManager().getAliveEnemies();
            if (aliveEnemies.length === 0 && this.enemiesSpawned) {
                this.onAllEnemiesDefeated(gameEngine);
            }
        }
    }

    updateAtmosphere(deltaTime) {
        this.atmosphereTimer += deltaTime;
        this.alarmTimer += deltaTime;
        
        // Emergency lights flicker
        if (Math.random() < 0.02) {
            this.emergencyLights = !this.emergencyLights;
        }
    }

    updateCombatPhase(deltaTime, players, gameEngine) {
        switch (this.combatPhase) {
            case 'preparation':
                if (!this.playersWarned && this.hasPlayersNearNPCs(players)) {
                    this.playersWarned = true;
                    this.warnPlayers();
                }
                if (this.combatStarted) {
                    this.combatPhase = 'engagement';
                }
                break;
                
            case 'engagement':
                if (this.combatStarted && gameEngine?.getEnemyManager()) {
                    const aliveEnemies = gameEngine.getEnemyManager().getAliveEnemies();
                    if (aliveEnemies.length === 0 && this.enemiesSpawned) {
                        this.combatPhase = 'aftermath';
                    }
                }
                break;
                
            case 'aftermath':
                // Post-combat dialogue and preparation for next level
                break;
        }
    }

    updateRadiationZones(deltaTime, players) {
        for (const zone of this.radiationZones) {
            for (const player of players) {
                if (!player.isAlive) continue;
                
                const distance = Math.sqrt(
                    Math.pow(player.x - zone.x, 2) + Math.pow(player.y - zone.y, 2)
                );
                
                if (distance < zone.radius) {
                    // Apply radiation damage
                    const damage = zone.intensity * deltaTime * 5;
                    player.takeDamage(damage);
                    
                    // Visual feedback would be handled by effects system
                }
            }
        }
    }

    updateStoryNPCs(deltaTime, players) {
        if (this.woundedSoldier) {
            this.woundedSoldier.update(deltaTime, players, this.gameEngine);
        }
        if (this.radioOperator) {
            this.radioOperator.update(deltaTime, players, this.gameEngine);
        }
    }

    /**
     * Set game engine reference for NPCs
     */
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
    }

    hasPlayersNearNPCs(players) {
        for (const player of players) {
            if (!player.isAlive) continue;
            
            const distanceToSoldier = Math.sqrt(
                Math.pow(player.x - this.woundedSoldier.x, 2) + 
                Math.pow(player.y - this.woundedSoldier.y, 2)
            );
            
            if (distanceToSoldier < 120) {
                return true;
            }
        }
        return false;
    }

    warnPlayers() {
        if (this.woundedSoldier) {
            this.woundedSoldier.showSpeechBubble("Listen up! Those things are coming. Get ready to fight!", 4.0);
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
    
    onAllEnemiesDefeated(gameEngine) {
        console.log('All enemies defeated in Level 1!');
        this.completeObjective('defeat_all_enemies');
        
        // Check if any players are still alive
        if (gameEngine && gameEngine.players) {
            const alivePlayers = Array.from(gameEngine.players.values()).filter(p => p.isAlive);
            if (alivePlayers.length > 0) {
                this.completeObjective('survive');
            }
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
    
    renderCombatInstructions(ctx) {
        // Show combat controls in corner
        ctx.fillStyle = '#ffff88';
        ctx.font = '14px monospace';
        ctx.fillText('COMBAT CONTROLS:', 10, ctx.canvas.height - 80);
        ctx.fillText('SPACE - Attack', 10, ctx.canvas.height - 60);
        ctx.fillText('WASD - Move', 10, ctx.canvas.height - 40);
        
        // Show enemy count - this will be handled by the GameEngine's debug info
        // We don't have direct access to gameEngine from render method
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
        
        // Level completion will be handled by LevelManager automatically
        // No need to manually transition here
    }

    /**
     * Enhanced rendering with atmospheric effects
     */
    renderLevel(ctx, spriteRenderer) {
        // Render radiation zones
        this.renderRadiationZones(ctx);
        
        // Render emergency lighting effects
        this.renderEmergencyLighting(ctx);
        
        // Render combat phase indicators
        this.renderCombatPhaseIndicators(ctx);
        
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

    renderRadiationZones(ctx) {
        for (const zone of this.radiationZones) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            
            // Pulsing radiation effect
            const pulseIntensity = Math.sin(this.atmosphereTimer * 3) * 0.2 + 0.8;
            ctx.globalAlpha *= pulseIntensity;
            
            // Radiation zone visual
            const gradient = ctx.createRadialGradient(
                zone.x, zone.y, 0,
                zone.x, zone.y, zone.radius
            );
            gradient.addColorStop(0, 'rgba(0, 255, 0, 0.4)');
            gradient.addColorStop(0.7, 'rgba(255, 255, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Radiation symbol in center
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#ffff00';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('☢', zone.x, zone.y + 7);
            
            ctx.restore();
        }
    }

    renderEmergencyLighting(ctx) {
        if (this.emergencyLights) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, this.bounds.width, this.bounds.height);
            ctx.restore();
        }
    }

    renderCombatPhaseIndicators(ctx) {
        // Show combat phase in debug mode
        if (this.gameEngine?.developerSettings?.settings?.showDebugInfo) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.fillText(`Combat Phase: ${this.combatPhase}`, 10, 230);
            ctx.fillText(`Players Warned: ${this.playersWarned}`, 10, 245);
        }
    }

    renderIntroMessage(ctx) {
        const alpha = Math.min(1.0, this.introMessageTime / 1.0);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, this.bounds.height / 2 - 60, this.bounds.width, 120);
        
        // Text
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FACILITY BREACH DETECTED', this.bounds.width / 2, this.bounds.height / 2 - 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText('CONTAMINATED ENTITIES APPROACHING', this.bounds.width / 2, this.bounds.height / 2 + 10);
        ctx.fillText('PREPARE FOR COMBAT', this.bounds.width / 2, this.bounds.height / 2 + 35);
        
        ctx.restore();
    }
}