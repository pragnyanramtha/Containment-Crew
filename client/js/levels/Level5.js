import { Level } from '../engine/Level.js';

/**
 * Level 5: Final Challenge and Ending
 * The final surviving player faces environmental hazards and must shut down the reactor
 */
export class Level5 extends Level {
    constructor(levelNumber, levelConfig) {
        super(levelNumber, levelConfig);
        
        // Level 5 specific state
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.introMessageDuration = 4.0;
        
        // Environmental hazards
        this.hazardSystem = null;
        this.hazardsActive = false;
        this.hazardStartDelay = 3.0; // Start hazards 3 seconds after intro
        this.hazardTimer = 0;
        
        // Reactor shutdown mechanics
        this.reactor = null;
        this.reactorReached = false;
        this.shutdownInProgress = false;
        this.shutdownProgress = 0;
        this.shutdownDuration = 5.0; // 5 seconds to shut down reactor
        
        // Ending sequence
        this.endingTriggered = false;
        this.endingTimer = 0;
        this.endingDuration = 8.0;
        
        // Input handling
        this.playerNearReactor = null;
        this.interactionPrompted = false;
        
        // Background color for reactor core
        this.backgroundColor = '#2a1a1a';
    }
    
    async loadAssets() {
        console.log('Loading Level 5 assets...');
        // Assets will be handled by sprite manager
    }
    
    onActivate() {
        console.log('Level 5 activated - Final Challenge');
        this.introMessageShown = false;
        this.introMessageTime = 0;
        this.hazardsActive = false;
        this.hazardTimer = 0;
        this.reactorReached = false;
        this.shutdownInProgress = false;
        this.shutdownProgress = 0;
        this.endingTriggered = false;
        this.endingTimer = 0;
        this.playerNearReactor = null;
        this.interactionPrompted = false;
        
        // Initialize environmental hazard system
        this.initializeHazardSystem();
        
        // Create reactor control interface
        this.createReactor();
    }
    
    initializeHazardSystem() {
        this.hazardSystem = new EnvironmentalHazardSystem(this);
    }
    
    createReactor() {
        // Reactor control panel at the far end of the level
        this.reactor = {
            x: 1600,
            y: 400,
            width: 120,
            height: 80,
            interactionRange: 60,
            isActive: true
        };
    }
    
    updateLevel(deltaTime, players, gameEngine) {
        // Store references for use in other methods
        this.gameEngine = gameEngine;
        
        // Show intro message
        if (!this.introMessageShown) {
            this.introMessageTime += deltaTime;
            if (this.introMessageTime >= this.introMessageDuration) {
                this.introMessageShown = true;
                this.hazardTimer = 0; // Start hazard timer
            }
        }
        
        // Start environmental hazards after delay
        if (this.introMessageShown && !this.hazardsActive) {
            this.hazardTimer += deltaTime;
            if (this.hazardTimer >= this.hazardStartDelay) {
                this.hazardsActive = true;
                console.log('Environmental hazards activated!');
            }
        }
        
        // Update environmental hazards
        if (this.hazardsActive && this.hazardSystem) {
            this.hazardSystem.update(deltaTime, players, gameEngine);
        }
        
        // Check reactor interaction
        if (!this.shutdownInProgress && !this.endingTriggered) {
            this.checkReactorInteraction(players);
        }
        
        // Update reactor shutdown
        if (this.shutdownInProgress) {
            this.updateReactorShutdown(deltaTime, players);
        }
        
        // Update ending sequence
        if (this.endingTriggered) {
            this.updateEndingSequence(deltaTime, players);
        }
    }
    
    checkReactorInteraction(players) {
        const alivePlayers = players.filter(p => p.isAlive);
        this.playerNearReactor = null;
        
        for (const player of alivePlayers) {
            const distance = Math.sqrt(
                Math.pow(player.x + player.width/2 - (this.reactor.x + this.reactor.width/2), 2) +
                Math.pow(player.y + player.height/2 - (this.reactor.y + this.reactor.height/2), 2)
            );
            
            if (distance <= this.reactor.interactionRange) {
                if (!this.reactorReached) {
                    this.reactorReached = true;
                    this.completeObjective('reach_reactor');
                    console.log('Player reached the reactor controls!');
                }
                
                // Store the player near reactor for input handling
                this.playerNearReactor = player;
                break;
            }
        }
    }
    
    startReactorShutdown() {
        console.log('Starting reactor shutdown sequence...');
        this.shutdownInProgress = true;
        this.shutdownProgress = 0;
        
        // Play reactor shutdown sound effect
        if (this.gameEngine && this.gameEngine.getAudioManager()) {
            this.gameEngine.getAudioManager().playSFX('reactor_shutdown', 1.0);
        }
        
        // Stop environmental hazards during shutdown
        if (this.hazardSystem) {
            this.hazardSystem.pauseHazards();
        }
        
        // Create reactor shutdown effect
        this.createReactorShutdownEffect();
    }
    
    createReactorShutdownEffect() {
        const effect = {
            type: 'reactor_shutdown',
            x: this.reactor.x + this.reactor.width / 2,
            y: this.reactor.y + this.reactor.height / 2,
            timeLeft: this.shutdownDuration,
            maxTime: this.shutdownDuration,
            pulseTimer: 0
        };
        
        if (!this.effects) {
            this.effects = [];
        }
        this.effects.push(effect);
    }
    
    updateReactorShutdown(deltaTime, players) {
        this.shutdownProgress += deltaTime;
        
        if (this.shutdownProgress >= this.shutdownDuration) {
            this.completeReactorShutdown();
        }
    }
    
    completeReactorShutdown() {
        console.log('Reactor shutdown complete!');
        this.shutdownInProgress = false;
        this.completeObjective('shutdown_reactor');
        
        // Create reactor shutdown completion effect
        this.createReactorCompletionEffect();
        
        // Trigger ending sequence after a brief delay
        setTimeout(() => {
            this.triggerEndingSequence();
        }, 1500);
    }
    
    createReactorCompletionEffect() {
        const effect = {
            type: 'reactor_completion',
            x: this.reactor.x + this.reactor.width / 2,
            y: this.reactor.y + this.reactor.height / 2,
            timeLeft: 3.0,
            maxTime: 3.0,
            particles: []
        };
        
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            effect.particles.push({
                x: effect.x,
                y: effect.y,
                vx: Math.cos(angle) * (100 + Math.random() * 100),
                vy: Math.sin(angle) * (100 + Math.random() * 100),
                life: 2.0 + Math.random() * 1.0,
                maxLife: 2.0 + Math.random() * 1.0,
                size: 3 + Math.random() * 5
            });
        }
        
        if (!this.effects) {
            this.effects = [];
        }
        this.effects.push(effect);
    }
    
    triggerEndingSequence() {
        console.log('Triggering ending sequence...');
        this.endingTriggered = true;
        this.endingTimer = 0;
        
        // Create radiation death effect for the final player
        const alivePlayers = Array.from(this.players?.values() || []).filter(p => p.isAlive);
        if (alivePlayers.length > 0) {
            const finalPlayer = alivePlayers[0];
            this.createRadiationDeathEffect(finalPlayer);
        }
    }
    
    updateEndingSequence(deltaTime, players) {
        this.endingTimer += deltaTime;
        
        // Kill the final player from radiation after a delay
        if (this.endingTimer >= 2.0) {
            const alivePlayers = players.filter(p => p.isAlive);
            for (const player of alivePlayers) {
                player.isAlive = false;
                player.health = 0;
            }
        }
        
        // Complete the level and trigger ending
        if (this.endingTimer >= this.endingDuration) {
            this.completeObjective('ending_sequence');
            this.complete();
        }
    }
    
    /**
     * Handle input for reactor interaction
     */
    handleInput(keys) {
        // Check if player is near reactor and can interact
        if (this.playerNearReactor && this.reactorReached && !this.shutdownInProgress && !this.endingTriggered) {
            // Check for Space key press to start reactor shutdown
            if (keys && keys['Space']) {
                this.startReactorShutdown();
            }
        }
    }
    
    createRadiationDeathEffect(player) {
        const effect = {
            type: 'radiation_death',
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            timeLeft: 6.0,
            maxTime: 6.0,
            player: player
        };
        
        if (!this.effects) {
            this.effects = [];
        }
        this.effects.push(effect);
        
        // Use visual effects manager for enhanced radiation death effects
        if (this.gameEngine && this.gameEngine.visualEffectsManager) {
            this.gameEngine.visualEffectsManager.createEnvironmentalHazard(
                'reactor_shutdown', 
                player.x + player.width / 2, 
                player.y + player.height / 2
            );
        }
    }
    
    checkObjective(objective, players, gameEngine) {
        switch (objective) {
            case 'reach_reactor':
                return this.reactorReached;
                
            case 'shutdown_reactor':
                return this.shutdownProgress >= this.shutdownDuration;
                
            case 'ending_sequence':
                return this.endingTimer >= this.endingDuration;
                
            default:
                return super.checkObjective(objective, players, gameEngine);
        }
    }
    
    renderLevel(ctx, spriteRenderer) {
        // Render intro message
        if (!this.introMessageShown) {
            this.renderIntroMessage(ctx);
        }
        
        // Render environmental hazards
        if (this.hazardSystem) {
            this.hazardSystem.render(ctx);
        }
        
        // Render reactor
        this.renderReactor(ctx);
        
        // Render shutdown progress
        if (this.shutdownInProgress) {
            this.renderShutdownProgress(ctx);
        }
        
        // Render ending sequence
        if (this.endingTriggered) {
            this.renderEndingSequence(ctx);
        }
    }
    
    renderIntroMessage(ctx) {
        const alpha = Math.min(1.0, this.introMessageTime / 1.0);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL 5: THE CORE', ctx.canvas.width / 2, ctx.canvas.height / 2 - 100);
        
        // Instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        ctx.fillText('You are alone now...', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        ctx.fillText('The reactor core is unstable and the environment is deadly', ctx.canvas.width / 2, ctx.canvas.height / 2 - 10);
        ctx.fillText('Reach the reactor controls and shut it down', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
        ctx.fillText('This is humanity\'s last hope', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderReactor(ctx) {
        // Determine reactor state color
        let reactorColor = '#666666'; // Inactive
        if (this.endingTriggered) {
            reactorColor = '#0088ff'; // Shutdown complete
        } else if (this.shutdownInProgress) {
            reactorColor = '#ffaa00'; // Shutting down
        } else if (this.reactor.isActive) {
            reactorColor = '#00aa00'; // Active
        }
        
        // Reactor control panel
        ctx.fillStyle = reactorColor;
        ctx.fillRect(this.reactor.x, this.reactor.y, this.reactor.width, this.reactor.height);
        
        // Reactor border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.reactor.x, this.reactor.y, this.reactor.width, this.reactor.height);
        
        // Reactor status lights
        const lightColor = this.endingTriggered ? '#0088ff' : 
                          this.shutdownInProgress ? '#ffaa00' : '#ffff00';
        ctx.fillStyle = lightColor;
        ctx.fillRect(this.reactor.x + 10, this.reactor.y + 10, 20, 20);
        ctx.fillRect(this.reactor.x + 40, this.reactor.y + 10, 20, 20);
        ctx.fillRect(this.reactor.x + 70, this.reactor.y + 10, 20, 20);
        
        // Control buttons
        const buttonColor = this.endingTriggered ? '#0044aa' : 
                           this.shutdownInProgress ? '#ff6600' : '#ff0000';
        ctx.fillStyle = buttonColor;
        ctx.fillRect(this.reactor.x + 20, this.reactor.y + 40, 30, 15);
        ctx.fillRect(this.reactor.x + 60, this.reactor.y + 40, 30, 15);
        
        // Status display
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.reactor.x + 10, this.reactor.y + 60, this.reactor.width - 20, 15);
        
        // Status text
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        let statusText = 'CRITICAL';
        if (this.endingTriggered) {
            statusText = 'SHUTDOWN';
        } else if (this.shutdownInProgress) {
            statusText = 'SHUTTING DOWN';
        } else if (this.reactorReached) {
            statusText = 'READY';
        }
        ctx.fillText(statusText, this.reactor.x + this.reactor.width / 2, this.reactor.y + 72);
        
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('REACTOR', this.reactor.x + this.reactor.width / 2, this.reactor.y - 10);
        ctx.fillText('CONTROLS', this.reactor.x + this.reactor.width / 2, this.reactor.y + this.reactor.height + 20);
        
        // Interaction range indicator (if player is nearby)
        if (this.playerNearReactor && !this.shutdownInProgress && !this.endingTriggered) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(
                this.reactor.x + this.reactor.width / 2,
                this.reactor.y + this.reactor.height / 2,
                this.reactor.interactionRange,
                0,
                Math.PI * 2
            );
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.textAlign = 'left';
    }
    
    renderShutdownProgress(ctx) {
        const progress = this.shutdownProgress / this.shutdownDuration;
        const barWidth = 400;
        const barHeight = 30;
        const barX = (ctx.canvas.width - barWidth) / 2;
        const barY = ctx.canvas.height / 2 + 100;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX - 20, barY - 60, barWidth + 40, 120);
        
        // Title
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SHUTTING DOWN REACTOR', ctx.canvas.width / 2, barY - 20);
        
        // Progress bar background
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress bar fill
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Progress bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Progress text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText(`${Math.round(progress * 100)}%`, ctx.canvas.width / 2, barY + barHeight + 25);
        
        ctx.textAlign = 'left';
    }
    
    renderEndingSequence(ctx) {
        const alpha = Math.min(1.0, this.endingTimer / 2.0);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Background fade to black
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Ending text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        
        if (this.endingTimer < 3.0) {
            ctx.fillText('REACTOR SHUTDOWN COMPLETE', ctx.canvas.width / 2, ctx.canvas.height / 2 - 60);
        }
        
        if (this.endingTimer >= 2.0 && this.endingTimer < 5.0) {
            ctx.fillStyle = '#ff6666';
            ctx.fillText('The radiation is too much...', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
        }
        
        if (this.endingTimer >= 4.0) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 28px monospace';
            ctx.fillText('MISSION ACCOMPLISHED', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px monospace';
            ctx.fillText('The reactor has been shut down', ctx.canvas.width / 2, ctx.canvas.height / 2 + 60);
            ctx.fillText('Humanity is saved', ctx.canvas.width / 2, ctx.canvas.height / 2 + 85);
            ctx.fillText('The sacrifices were not in vain', ctx.canvas.width / 2, ctx.canvas.height / 2 + 110);
        }
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    renderUI(ctx) {
        // Show level info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('LEVEL 5: THE CORE', 10, 25);
        
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
        
        // Show hazard warnings
        if (this.hazardsActive && this.hazardSystem) {
            ctx.fillStyle = '#ff6666';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('ENVIRONMENTAL HAZARDS ACTIVE', 10, yOffset + 10);
            
            const hazardStatus = this.hazardSystem.getHazardStatus();
            ctx.fillStyle = '#ffaa00';
            ctx.font = '12px monospace';
            yOffset += 30;
            
            if (hazardStatus.fallingRocks > 0) {
                ctx.fillText(`Falling Rocks: ${hazardStatus.fallingRocks}`, 10, yOffset);
                yOffset += 15;
            }
            
            if (hazardStatus.radiationZones > 0) {
                ctx.fillText(`Radiation Zones: ${hazardStatus.radiationZones}`, 10, yOffset);
                yOffset += 15;
            }
            
            if (hazardStatus.blizzardActive) {
                ctx.fillText('Blizzard: ACTIVE', 10, yOffset);
                yOffset += 15;
            }
        }
        
        // Show reactor status
        if (this.reactorReached) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('REACTOR CONTROLS ACCESSIBLE', 10, yOffset + 10);
            
            if (this.playerNearReactor && !this.shutdownInProgress && !this.endingTriggered) {
                ctx.fillStyle = '#ffff00';
                ctx.fillText('Press SPACE to shut down reactor', 10, yOffset + 25);
                
                // Also show interaction prompt near reactor
                ctx.save();
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Press SPACE to shutdown', 
                    this.reactor.x + this.reactor.width / 2, 
                    this.reactor.y - 30);
                ctx.restore();
            }
        }
    }
    
    getObjectiveText(objective) {
        switch (objective) {
            case 'reach_reactor':
                return 'Reach the reactor controls';
            case 'shutdown_reactor':
                return 'Shut down the reactor';
            case 'ending_sequence':
                return 'Complete the mission';
            default:
                return objective;
        }
    }
    
    onLevelCompleted() {
        console.log('Level 5 completed! The mission is accomplished.');
        console.log('All sacrifices have been made. Humanity is saved.');
    }
}

/**
 * Environmental Hazard System for Level 5
 * Manages falling rocks, radiation zones, and blizzard effects
 */
class EnvironmentalHazardSystem {
    constructor(level) {
        this.level = level;
        this.paused = false;
        
        // Falling rocks
        this.fallingRocks = [];
        this.rockSpawnTimer = 0;
        this.rockSpawnInterval = 2.0; // Spawn rock every 2 seconds
        this.maxRocks = 8;
        
        // Radiation zones
        this.radiationZones = [];
        this.radiationTimer = 0;
        this.radiationInterval = 5.0; // Create new zone every 5 seconds
        this.maxRadiationZones = 4;
        
        // Blizzard effect
        this.blizzardActive = true;
        this.blizzardParticles = [];
        this.blizzardIntensity = 0.7; // Movement speed reduction
        
        // Initialize blizzard particles
        this.initializeBlizzard();
        
        // Create initial radiation zones
        this.createInitialRadiationZones();
    }
    
    update(deltaTime, players, gameEngine) {
        if (this.paused) return;
        
        // Update falling rocks
        this.updateFallingRocks(deltaTime, players);
        
        // Update radiation zones
        this.updateRadiationZones(deltaTime, players);
        
        // Update blizzard
        this.updateBlizzard(deltaTime, players);
        
        // Spawn new hazards
        this.spawnHazards(deltaTime);
    }
    
    updateFallingRocks(deltaTime, players) {
        // Update existing rocks
        for (let i = this.fallingRocks.length - 1; i >= 0; i--) {
            const rock = this.fallingRocks[i];
            
            // Move rock down
            rock.y += rock.speed * deltaTime;
            rock.rotation += rock.rotationSpeed * deltaTime;
            
            // Check collision with players
            for (const player of players) {
                if (!player.isAlive) continue;
                
                if (this.checkRockPlayerCollision(rock, player)) {
                    // Deal damage to player
                    player.takeDamage(rock.damage);
                    console.log(`Player ${player.id} hit by falling rock for ${rock.damage} damage!`);
                    
                    // Create impact effect
                    this.createRockImpactEffect(rock.x, rock.y);
                    
                    // Remove rock
                    this.fallingRocks.splice(i, 1);
                    break;
                }
            }
            
            // Remove rock if it hits the ground
            if (rock.y > this.level.bounds.height) {
                this.createRockImpactEffect(rock.x, this.level.bounds.height - 10);
                this.fallingRocks.splice(i, 1);
            }
        }
    }
    
    updateRadiationZones(deltaTime, players) {
        // Update existing zones
        for (const zone of this.radiationZones) {
            zone.damageTimer += deltaTime;
            zone.pulseTimer += deltaTime;
            
            // Deal damage to players in zone
            if (zone.damageTimer >= zone.damageInterval) {
                zone.damageTimer = 0;
                
                for (const player of players) {
                    if (!player.isAlive) continue;
                    
                    if (this.checkPlayerInRadiationZone(player, zone)) {
                        player.takeDamage(zone.damagePerTick);
                        console.log(`Player ${player.id} taking radiation damage: ${zone.damagePerTick}`);
                        
                        // Create radiation damage effect
                        this.createRadiationDamageEffect(player);
                    }
                }
            }
        }
    }
    
    updateBlizzard(deltaTime, players) {
        if (!this.blizzardActive) return;
        
        // Update blizzard particles
        for (const particle of this.blizzardParticles) {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            
            // Reset particle if it goes off screen or dies
            if (particle.x < -10 || particle.x > this.level.bounds.width + 10 ||
                particle.y > this.level.bounds.height + 10 || particle.life <= 0) {
                this.resetBlizzardParticle(particle);
            }
        }
        
        // Apply movement impairment to players
        for (const player of players) {
            if (!player.isAlive) continue;
            
            // Reduce player movement speed
            if (player.moveSpeed) {
                player.moveSpeed *= (1 - this.blizzardIntensity * 0.3);
            }
        }
    }
    
    spawnHazards(deltaTime) {
        // Spawn falling rocks
        this.rockSpawnTimer += deltaTime;
        if (this.rockSpawnTimer >= this.rockSpawnInterval && this.fallingRocks.length < this.maxRocks) {
            this.spawnFallingRock();
            this.rockSpawnTimer = 0;
        }
        
        // Spawn radiation zones
        this.radiationTimer += deltaTime;
        if (this.radiationTimer >= this.radiationInterval && this.radiationZones.length < this.maxRadiationZones) {
            this.spawnRadiationZone();
            this.radiationTimer = 0;
        }
    }
    
    spawnFallingRock() {
        const rock = {
            x: Math.random() * (this.level.bounds.width - 40),
            y: -30,
            width: 20 + Math.random() * 20,
            height: 20 + Math.random() * 20,
            speed: 200 + Math.random() * 150,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 10,
            damage: 15 + Math.random() * 10,
            warningTime: 1.0,
            warningTimer: 0
        };
        
        // Play falling rock sound effect
        if (this.gameEngine && this.gameEngine.getAudioManager()) {
            this.gameEngine.getAudioManager().playSFX('falling_rock', 0.6, 0.8 + Math.random() * 0.4);
        }
        
        this.fallingRocks.push(rock);
        console.log('Spawned falling rock');
    }
    
    spawnRadiationZone() {
        const zone = {
            x: Math.random() * (this.level.bounds.width - 100),
            y: Math.random() * (this.level.bounds.height - 100),
            radius: 60 + Math.random() * 40,
            damagePerTick: 8 + Math.random() * 7,
            damageInterval: 1.0,
            damageTimer: 0,
            pulseTimer: 0,
            lifetime: 15.0 + Math.random() * 10,
            age: 0
        };
        
        this.radiationZones.push(zone);
        console.log('Spawned radiation zone');
    }
    
    createInitialRadiationZones() {
        // Create a few initial radiation zones
        for (let i = 0; i < 2; i++) {
            this.spawnRadiationZone();
        }
    }
    
    initializeBlizzard() {
        const particleCount = 150;
        
        for (let i = 0; i < particleCount; i++) {
            this.blizzardParticles.push(this.createBlizzardParticle());
        }
    }
    
    createBlizzardParticle() {
        return {
            x: Math.random() * (this.level.bounds.width + 20) - 10,
            y: Math.random() * (this.level.bounds.height + 20) - 10,
            vx: -50 - Math.random() * 100, // Wind blowing left
            vy: 100 + Math.random() * 150, // Falling down
            size: 1 + Math.random() * 3,
            life: 5 + Math.random() * 10,
            maxLife: 5 + Math.random() * 10,
            opacity: 0.3 + Math.random() * 0.7
        };
    }
    
    resetBlizzardParticle(particle) {
        particle.x = this.level.bounds.width + 10 + Math.random() * 50;
        particle.y = -10 - Math.random() * 50;
        particle.vx = -50 - Math.random() * 100;
        particle.vy = 100 + Math.random() * 150;
        particle.life = particle.maxLife;
    }
    
    checkRockPlayerCollision(rock, player) {
        return player.x < rock.x + rock.width &&
               player.x + player.width > rock.x &&
               player.y < rock.y + rock.height &&
               player.y + player.height > rock.y;
    }
    
    checkPlayerInRadiationZone(player, zone) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const zoneCenterX = zone.x + zone.radius;
        const zoneCenterY = zone.y + zone.radius;
        
        const distance = Math.sqrt(
            Math.pow(playerCenterX - zoneCenterX, 2) +
            Math.pow(playerCenterY - zoneCenterY, 2)
        );
        
        return distance <= zone.radius;
    }
    
    createRockImpactEffect(x, y) {
        const effect = {
            type: 'rock_impact',
            x: x,
            y: y,
            timeLeft: 0.5,
            maxTime: 0.5
        };
        
        if (!this.level.effects) {
            this.level.effects = [];
        }
        this.level.effects.push(effect);
    }
    
    createRadiationDamageEffect(player) {
        const effect = {
            type: 'radiation_damage',
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            timeLeft: 1.0,
            maxTime: 1.0
        };
        
        if (!this.level.effects) {
            this.level.effects = [];
        }
        this.level.effects.push(effect);
    }
    
    pauseHazards() {
        this.paused = true;
        console.log('Environmental hazards paused');
    }
    
    resumeHazards() {
        this.paused = false;
        console.log('Environmental hazards resumed');
    }
    
    getHazardStatus() {
        return {
            fallingRocks: this.fallingRocks.length,
            radiationZones: this.radiationZones.length,
            blizzardActive: this.blizzardActive
        };
    }
    
    render(ctx) {
        // Render blizzard
        this.renderBlizzard(ctx);
        
        // Render radiation zones
        this.renderRadiationZones(ctx);
        
        // Render falling rocks
        this.renderFallingRocks(ctx);
    }
    
    renderBlizzard(ctx) {
        if (!this.blizzardActive) return;
        
        ctx.save();
        
        for (const particle of this.blizzardParticles) {
            const alpha = (particle.life / particle.maxLife) * particle.opacity;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ffffff';
            
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderRadiationZones(ctx) {
        for (const zone of this.radiationZones) {
            const pulseIntensity = Math.sin(zone.pulseTimer * 4) * 0.3 + 0.7;
            
            ctx.save();
            ctx.globalAlpha = 0.4 * pulseIntensity;
            
            // Radiation zone circle
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(zone.x + zone.radius, zone.y + zone.radius, zone.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Radiation zone border
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = '#00aa00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Radiation symbol in center
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('☢', zone.x + zone.radius, zone.y + zone.radius + 6);
            
            ctx.restore();
        }
        
        ctx.textAlign = 'left';
    }
    
    renderFallingRocks(ctx) {
        for (const rock of this.fallingRocks) {
            ctx.save();
            
            // Translate to rock center for rotation
            ctx.translate(rock.x + rock.width / 2, rock.y + rock.height / 2);
            ctx.rotate(rock.rotation);
            
            // Draw rock
            ctx.fillStyle = '#666666';
            ctx.fillRect(-rock.width / 2, -rock.height / 2, rock.width, rock.height);
            
            // Rock border
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(-rock.width / 2, -rock.height / 2, rock.width, rock.height);
            
            // Rock details
            ctx.fillStyle = '#888888';
            ctx.fillRect(-rock.width / 4, -rock.height / 4, rock.width / 2, rock.height / 2);
            
            ctx.restore();
            
            // Warning shadow on ground (if rock is high enough)
            if (rock.y < this.level.bounds.height - 100) {
                const shadowY = this.level.bounds.height - 20;
                const shadowAlpha = Math.max(0, 1 - (rock.y / (this.level.bounds.height - 100)));
                
                ctx.save();
                ctx.globalAlpha = shadowAlpha * 0.5;
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(rock.x, shadowY, rock.width, 10);
                ctx.restore();
            }
        }
    }
}