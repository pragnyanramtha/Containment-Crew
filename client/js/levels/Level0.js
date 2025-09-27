import { Level } from '../engine/Level.js';
import { NPC } from '../engine/NPC.js';

/**
 * Level 0 - Tutorial and Story Introduction
 * Players learn basic movement and hear the story from Dr. Petrov
 */
export class Level0 extends Level {
    constructor(levelNumber, levelConfig) {
        super(levelNumber, levelConfig);
        
        // Tutorial state
        this.tutorialState = 'movement'; // 'movement', 'story', 'completed'
        this.playersCompletedMovement = new Set();
        this.hasHeardStory = false;
        
        // Tutorial markers
        this.tutorialMarkers = [];
        this.currentMarkerIndex = 0;
        
        // Story NPC
        this.storyNPC = null;
    }
    
    /**
     * Initialize level-specific content
     */
    async load() {
        await super.load();
        
        // Initialize tutorial markers
        this.initializeTutorialMarkers();
        
        console.log('Level 0 (Tutorial) loaded successfully');
    }
    
    /**
     * Initialize tutorial markers from config
     */
    initializeTutorialMarkers() {
        if (this.config.tutorialMarkers) {
            this.tutorialMarkers = this.config.tutorialMarkers.map((marker, index) => ({
                ...marker,
                id: `marker_${index}`,
                isActive: index === 0, // Only first marker is active initially
                isCompleted: false,
                radius: 50,
                pulseTime: 0
            }));
        }
    }
    
    /**
     * Create NPC from config
     */
    createNPC(config) {
        if (config.type === 'dying_scientist') {
            const npc = new NPC({
                id: 'dr_petrov',
                type: config.type,
                name: config.name,
                x: config.x,
                y: config.y,
                width: 64,
                height: 64,
                dialogue: config.dialogue,
                color: '#ff6666',
                nameColor: '#ffff00',
                interactionRadius: 100
            });
            
            this.storyNPC = npc;
            return npc;
        }
        
        return super.createNPC(config);
    }
    
    /**
     * Level-specific update logic
     */
    updateLevel(deltaTime, players, gameEngine) {
        // Update tutorial markers
        this.updateTutorialMarkers(deltaTime);
        
        // Update tutorial state based on player progress
        this.updateTutorialState(players);
        
        // Check movement tutorial completion
        if (this.tutorialState === 'movement') {
            this.checkMovementTutorialProgress(players);
        }
        
        // Check story completion
        if (this.tutorialState === 'story') {
            this.checkStoryProgress();
        }
    }
    
    /**
     * Update tutorial marker animations
     */
    updateTutorialMarkers(deltaTime) {
        this.tutorialMarkers.forEach(marker => {
            if (marker.isActive) {
                marker.pulseTime += deltaTime;
            }
        });
    }
    
    /**
     * Update tutorial state based on progress
     */
    updateTutorialState(players) {
        // Check if all players completed movement tutorial
        if (this.tutorialState === 'movement' && this.playersCompletedMovement.size >= players.length) {
            this.tutorialState = 'story';
            console.log('Movement tutorial completed, now talk to Dr. Petrov');
        }
        
        // Check if story has been heard
        if (this.tutorialState === 'story' && this.hasHeardStory) {
            this.tutorialState = 'completed';
            this.completeObjective('learn_movement');
            this.completeObjective('hear_story');
            this.completeObjective('complete_tutorial');
        }
    }
    
    /**
     * Check movement tutorial progress for each player
     */
    checkMovementTutorialProgress(players) {
        players.forEach(player => {
            if (this.playersCompletedMovement.has(player.id)) return;
            
            // Check if player has visited all tutorial markers
            let completedMarkers = 0;
            
            this.tutorialMarkers.forEach((marker, index) => {
                const distance = this.getDistanceToPoint(player, marker);
                
                if (distance <= marker.radius) {
                    if (!marker.isCompleted) {
                        marker.isCompleted = true;
                        console.log(`Player ${player.id} reached marker ${index + 1}`);
                        
                        // Activate next marker
                        if (index + 1 < this.tutorialMarkers.length) {
                            this.tutorialMarkers[index + 1].isActive = true;
                        }
                    }
                }
                
                if (marker.isCompleted) {
                    completedMarkers++;
                }
            });
            
            // Check if player completed all markers
            if (completedMarkers >= this.tutorialMarkers.length) {
                this.playersCompletedMovement.add(player.id);
                console.log(`Player ${player.id} completed movement tutorial`);
            }
        });
    }
    
    /**
     * Check story progress
     */
    checkStoryProgress() {
        // Check if dialogue system indicates story was heard
        const dialogueSystem = this.gameEngine.gameEngine?.dialogueSystem;
        if (dialogueSystem && this.storyNPC && this.storyNPC.hasSpokenTo) {
            if (!dialogueSystem.isDialogueActive() && this.storyNPC.isDialogueFinished()) {
                this.hasHeardStory = true;
                console.log('Story completed');
            }
        }
    }
    
    /**
     * Get distance from player to a point
     */
    getDistanceToPoint(player, point) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        return Math.sqrt(
            Math.pow(playerCenterX - point.x, 2) + 
            Math.pow(playerCenterY - point.y, 2)
        );
    }
    
    /**
     * Check if a specific objective is completed
     */
    checkObjective(objective, players, gameEngine) {
        switch (objective) {
            case 'learn_movement':
                return this.playersCompletedMovement.size >= players.length;
                
            case 'hear_story':
                return this.hasHeardStory;
                
            case 'complete_tutorial':
                return this.tutorialState === 'completed';
                
            default:
                return false;
        }
    }
    
    /**
     * Render level-specific content
     */
    renderLevel(ctx, spriteRenderer) {
        // Render tutorial markers
        this.renderTutorialMarkers(ctx);
        
        // Render tutorial instructions
        this.renderTutorialInstructions(ctx);
    }
    
    /**
     * Render tutorial markers
     */
    renderTutorialMarkers(ctx) {
        this.tutorialMarkers.forEach((marker, index) => {
            if (!marker.isActive || marker.isCompleted) return;
            
            // Pulsing circle animation
            const pulseScale = 1 + Math.sin(marker.pulseTime * 3) * 0.3;
            const radius = marker.radius * pulseScale;
            const alpha = 0.3 + Math.sin(marker.pulseTime * 2) * 0.2;
            
            // Draw marker circle
            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw marker center
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw instruction text
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                marker.instruction,
                marker.x,
                marker.y - radius - 20
            );
            ctx.textAlign = 'left';
            
            // Draw step number
            ctx.fillStyle = '#ffff00';
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${index + 1}`,
                marker.x,
                marker.y + 8
            );
            ctx.textAlign = 'left';
        });
    }
    
    /**
     * Render tutorial instructions
     */
    renderTutorialInstructions(ctx) {
        // Main tutorial instruction
        let instruction = '';
        
        switch (this.tutorialState) {
            case 'movement':
                const remainingPlayers = 3 - this.playersCompletedMovement.size; // Assuming 3 players
                instruction = `Movement Tutorial - ${remainingPlayers} player(s) remaining`;
                break;
                
            case 'story':
                instruction = 'Talk to Dr. Petrov to hear the story (Press E near him)';
                break;
                
            case 'completed':
                instruction = 'Tutorial Complete! Advancing to Level 1...';
                break;
        }
        
        if (instruction) {
            // Draw instruction background
            const textWidth = ctx.measureText(instruction).width + 40;
            const textHeight = 50;
            const textX = (ctx.canvas.width - textWidth) / 2;
            const textY = 50;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(textX, textY, textWidth, textHeight);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(textX, textY, textWidth, textHeight);
            
            // Draw instruction text
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                instruction,
                ctx.canvas.width / 2,
                textY + 30
            );
            ctx.textAlign = 'left';
        }
        
        // Draw controls reminder
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px monospace';
        ctx.fillText(
            'Controls: WASD to move, E to interact',
            20,
            ctx.canvas.height - 40
        );
    }
    
    /**
     * Called when level is activated
     */
    onActivate() {
        console.log('Level 0 activated - Tutorial starting');
        
        // Reset tutorial state
        this.tutorialState = 'movement';
        this.playersCompletedMovement.clear();
        this.hasHeardStory = false;
        
        // Reset tutorial markers
        this.tutorialMarkers.forEach((marker, index) => {
            marker.isActive = index === 0;
            marker.isCompleted = false;
            marker.pulseTime = 0;
        });
    }
    
    /**
     * Called when level is reset
     */
    onReset() {
        super.onReset();
        
        this.tutorialState = 'movement';
        this.playersCompletedMovement.clear();
        this.hasHeardStory = false;
        
        // Reset tutorial markers
        this.tutorialMarkers.forEach((marker, index) => {
            marker.isActive = index === 0;
            marker.isCompleted = false;
            marker.pulseTime = 0;
        });
        
        // Reset story NPC
        if (this.storyNPC) {
            this.storyNPC.resetDialogue();
        }
    }
}