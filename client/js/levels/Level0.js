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
            this.checkStoryProgress(gameEngine);
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
    checkStoryProgress(gameEngine) {
        // Check if dialogue system indicates story was heard
        const dialogueSystem = gameEngine?.dialogueSystem;
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
        let subInstruction = '';
        
        switch (this.tutorialState) {
            case 'movement':
                const remainingPlayers = 3 - this.playersCompletedMovement.size; // Assuming 3 players
                instruction = `Movement Tutorial`;
                subInstruction = `${remainingPlayers} player(s) need to complete the movement course`;
                break;
                
            case 'story':
                instruction = 'Story Time';
                subInstruction = 'Talk to Dr. Petrov to hear the story (Press E near him)';
                break;
                
            case 'completed':
                instruction = 'Tutorial Complete!';
                subInstruction = 'Advancing to Level 1...';
                break;
        }
        
        if (instruction) {
            // Calculate box dimensions
            const maxWidth = Math.max(
                ctx.measureText(instruction).width,
                ctx.measureText(subInstruction).width
            );
            const boxWidth = maxWidth + 60;
            const boxHeight = 80;
            const boxX = (ctx.canvas.width - boxWidth) / 2;
            const boxY = 30;
            
            // Draw instruction background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
            
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
            
            // Draw main instruction
            ctx.fillStyle = '#00ff00';
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                instruction,
                ctx.canvas.width / 2,
                boxY + 30
            );
            
            // Draw sub instruction
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px monospace';
            ctx.fillText(
                subInstruction,
                ctx.canvas.width / 2,
                boxY + 55
            );
            
            ctx.textAlign = 'left';
        }
        
        // Draw progress indicator
        this.renderTutorialProgress(ctx);
        
        // Draw controls reminder
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px monospace';
        ctx.fillText(
            'Controls: WASD to move, E to interact',
            20,
            ctx.canvas.height - 40
        );
    }
    
    /**
     * Render tutorial progress indicator
     */
    renderTutorialProgress(ctx) {
        if (this.tutorialState !== 'movement') return;
        
        const progressX = 50;
        const progressY = 150;
        const progressWidth = 300;
        const progressHeight = 20;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(progressX - 10, progressY - 10, progressWidth + 20, progressHeight + 40);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(progressX - 10, progressY - 10, progressWidth + 20, progressHeight + 40);
        
        // Progress label
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText('Movement Progress:', progressX, progressY - 15);
        
        // Progress bar background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
        
        // Progress bar fill
        const progress = this.playersCompletedMovement.size / 3; // Assuming 3 players
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
        
        // Progress bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(progressX, progressY, progressWidth, progressHeight);
        
        // Progress text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.playersCompletedMovement.size}/3 Players`,
            progressX + progressWidth / 2,
            progressY + progressHeight / 2 + 4
        );
        ctx.textAlign = 'left';
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
        
        // Start movement tutorial using TutorialManager
        this.startMovementTutorial();
    }
    
    /**
     * Start the movement tutorial
     */
    startMovementTutorial() {
        // Create tutorial configuration for TutorialManager
        const tutorialConfig = {
            name: 'Movement Tutorial',
            steps: this.tutorialMarkers.map((marker, index) => ({
                type: 'position',
                x: marker.x,
                y: marker.y,
                radius: marker.radius,
                instruction: marker.instruction,
                color: '#00ff00'
            })),
            onComplete: () => {
                console.log('Movement tutorial completed via TutorialManager');
                this.tutorialState = 'story';
                // All players completed movement, now they need to talk to Dr. Petrov
            }
        };
        
        // Access tutorial manager through the game engine
        // We'll need to pass this through the level system
        // For now, we'll keep the existing system and enhance it
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