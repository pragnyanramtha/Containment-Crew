import { Level } from '../engine/Level.js';
import { NPC } from '../engine/NPC.js';
import { EnhancedNPC } from '../engine/EnhancedNPC.js';

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

        // Story NPCs
        this.storyNPC = null;
        this.survivorNPCs = [];
        this.interactiveObjects = [];

        // Enhanced story elements
        this.storyPhase = 'arrival'; // arrival, exploration, revelation, preparation
        this.discoveredClues = new Set();
        this.playerInteractions = new Map();

        // Environmental storytelling
        this.environmentalClues = [
            { x: 200, y: 150, type: 'bloodstain', discovered: false },
            { x: 500, y: 300, type: 'abandoned_equipment', discovered: false },
            { x: 350, y: 450, type: 'warning_sign', discovered: false },
            { x: 600, y: 200, type: 'emergency_kit', discovered: false }
        ];
    }

    /**
     * Initialize level-specific content with rich storytelling
     */
    async load() {
        await super.load();

        // Initialize tutorial markers
        this.initializeTutorialMarkers();

        // Create additional survivor NPCs for atmosphere
        this.createSurvivorNPCs();

        // Initialize interactive objects
        this.initializeInteractiveObjects();

        console.log('Level 0 (Tutorial) loaded successfully with enhanced story elements');
    }

    createSurvivorNPCs() {
        // Panicked civilian near entrance
        const panickedSurvivor = this.createNPC({
            type: 'panicked_survivor',
            id: 'civilian_maria',
            name: 'Maria Volkov',
            x: 150,
            y: 200
        });
        if (panickedSurvivor) {
            this.survivorNPCs.push(panickedSurvivor);
            this.npcs.push(panickedSurvivor);
        }

        // Security guard trying to help
        const securityGuard = this.createNPC({
            type: 'security_guard',
            id: 'guard_dmitri',
            name: 'Dmitri Kozlov',
            x: 600,
            y: 400
        });
        if (securityGuard) {
            this.survivorNPCs.push(securityGuard);
            this.npcs.push(securityGuard);
        }
    }

    initializeInteractiveObjects() {
        // Emergency radio
        this.interactiveObjects.push({
            id: 'emergency_radio',
            x: 300,
            y: 100,
            width: 40,
            height: 30,
            type: 'radio',
            interacted: false,
            message: "EMERGENCY BROADCAST: All personnel evacuate immediately. Reactor breach in progress."
        });

        // Warning computer terminal
        this.interactiveObjects.push({
            id: 'warning_terminal',
            x: 500,
            y: 150,
            width: 50,
            height: 40,
            type: 'terminal',
            interacted: false,
            message: "SYSTEM ALERT: Containment failure detected. Automatic shutdown failed. Manual intervention required."
        });

        // Medical supplies
        this.interactiveObjects.push({
            id: 'medical_kit',
            x: 400,
            y: 500,
            width: 30,
            height: 20,
            type: 'supplies',
            interacted: false,
            message: "Medical supplies - RadAway tablets and basic first aid. Won't help much against what's coming."
        });
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
     * Create enhanced NPCs with rich personalities and stories
     */
    createNPC(config) {
        if (config.type === 'dying_scientist') {
            const npc = new EnhancedNPC({
                id: 'dr_petrov',
                type: config.type,
                name: 'Dr. Alexei Petrov',
                x: config.x,
                y: config.y,
                width: 64,
                height: 64,
                personality: 'desperate_scientist',
                backstory: 'Lead nuclear physicist who tried to prevent the disaster',
                behaviorState: 'dying',
                emotionalState: 'desperate',
                dialogueTrees: {
                    default: [
                        "Thank God... you made it. I don't have much time left...",
                        "The reactor... it's going critical. The explosion will kill millions...",
                        "You three are our only hope. But the path ahead... it will demand everything.",
                        "Not all of you will make it to the end. Sacrifices must be made..."
                    ],
                    technical: [
                        "The containment systems failed at 14:23. We have maybe 6 hours.",
                        "The control rods are jammed. Manual shutdown is the only option.",
                        "Radiation levels are already lethal in the core chamber.",
                        "The emergency protocols... they require human sacrifice."
                    ],
                    personal: [
                        "I have a daughter... she's only eight years old.",
                        "We thought we were making the world better with nuclear power.",
                        "The guilt... it's eating me alive faster than the radiation.",
                        "Promise me... promise me you'll save them."
                    ]
                },
                color: '#ff6666',
                nameColor: '#ffff00',
                interactionRadius: 120
            });

            this.storyNPC = npc;
            return npc;
        }

        // Create additional survivor NPCs
        if (config.type === 'panicked_survivor') {
            return new EnhancedNPC({
                id: config.id || 'survivor_' + Date.now(),
                type: config.type,
                name: config.name || 'Survivor',
                x: config.x,
                y: config.y,
                width: 48,
                height: 48,
                personality: 'panicked_civilian',
                behaviorState: 'panicked',
                emotionalState: 'scared',
                dialogueTrees: {
                    default: [
                        "What's happening?! Why won't anyone tell us?!",
                        "I heard explosions... are we under attack?",
                        "My family... I need to find my family!",
                        "The alarms have been going for hours!"
                    ]
                },
                color: '#88aaff',
                interactionRadius: 80
            });
        }

        if (config.type === 'security_guard') {
            return new EnhancedNPC({
                id: config.id || 'guard_' + Date.now(),
                type: config.type,
                name: config.name || 'Security Guard',
                x: config.x,
                y: config.y,
                width: 52,
                height: 52,
                personality: 'duty_bound',
                behaviorState: 'helpful',
                emotionalState: 'determined',
                dialogueTrees: {
                    default: [
                        "I've been trying to evacuate civilians all day.",
                        "The main exits are blocked by debris.",
                        "I know the facility layout. I can help guide you.",
                        "Stay alert. Some of the contaminated... they've changed."
                    ],
                    tactical: [
                        "Avoid the east wing - radiation levels are critical there.",
                        "The emergency supplies are in Storage Room B-7.",
                        "I've seen things... the radiation does terrible things.",
                        "Stick together. Don't let anyone fall behind."
                    ]
                },
                color: '#4488ff',
                interactionRadius: 100
            });
        }

        return super.createNPC(config);
    }

    /**
     * Enhanced level update with rich story progression
     */
    updateLevel(deltaTime, players, gameEngine) {
        // Update tutorial markers
        this.updateTutorialMarkers(deltaTime);

        // Update story phase progression
        this.updateStoryPhase(deltaTime, players, gameEngine);

        // Update environmental storytelling
        this.updateEnvironmentalClues(players);

        // Update survivor NPCs
        this.updateSurvivorNPCs(deltaTime, players);

        // Update interactive objects
        this.updateInteractiveObjects(players);

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

    updateStoryPhase(deltaTime, players, gameEngine) {
        switch (this.storyPhase) {
            case 'arrival':
                // Players just arrived, let them explore a bit
                if (this.discoveredClues.size >= 2) {
                    this.storyPhase = 'exploration';
                    this.triggerStoryEvent('discovery', gameEngine);
                }
                break;

            case 'exploration':
                // Players are learning about the disaster
                if (this.hasInteractedWithNPC('dr_petrov')) {
                    this.storyPhase = 'revelation';
                    this.triggerStoryEvent('revelation', gameEngine);
                }
                break;

            case 'revelation':
                // Dr. Petrov has explained the situation
                if (this.discoveredClues.size >= 4) {
                    this.storyPhase = 'preparation';
                    this.triggerStoryEvent('preparation', gameEngine);
                }
                break;
        }
    }

    updateEnvironmentalClues(players) {
        for (const clue of this.environmentalClues) {
            if (clue.discovered) continue;

            for (const player of players) {
                if (!player.isAlive) continue;

                const distance = Math.sqrt(
                    Math.pow(player.x - clue.x, 2) + Math.pow(player.y - clue.y, 2)
                );

                if (distance < 50) {
                    clue.discovered = true;
                    this.discoveredClues.add(clue.type);
                    this.showClueMessage(clue);
                    break;
                }
            }
        }
    }

    showClueMessage(clue) {
        const messages = {
            bloodstain: "Dried blood on the floor... someone was hurt here recently.",
            abandoned_equipment: "Radiation detection equipment, abandoned in haste. The readings are off the charts.",
            warning_sign: "DANGER: HIGH RADIATION ZONE. AUTHORIZED PERSONNEL ONLY. Someone crossed out 'AUTHORIZED'.",
            emergency_kit: "Emergency supplies scattered on the ground. Someone left in a hurry."
        };

        // Show message to players (this would integrate with the dialogue system)
        console.log(`Environmental clue discovered: ${messages[clue.type]}`);
    }

    hasInteractedWithNPC(npcId) {
        return this.playerInteractions.has(npcId);
    }

    triggerStoryEvent(eventType, gameEngine) {
        console.log(`Story event triggered: ${eventType}`);
        // This would integrate with the story manager and dialogue system
    }

    /**
     * Set game engine reference for NPCs
     */
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
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
     * Get tutorial completion percentage
     */
    getTutorialProgress() {
        const totalSteps = 2; // movement + story
        let completedSteps = 0;

        if (this.playersCompletedMovement.size >= 3) completedSteps++;
        if (this.hasHeardStory) completedSteps++;

        return (completedSteps / totalSteps) * 100;
    }

    /**
     * Get detailed tutorial status
     */
    getTutorialStatus() {
        return {
            state: this.tutorialState,
            movementCompleted: this.playersCompletedMovement.size,
            movementRequired: 3,
            storyHeard: this.hasHeardStory,
            overallProgress: this.getTutorialProgress()
        };
    }

    /**
     * Render level-specific content
     */
    renderLevel(ctx, spriteRenderer) {
        // Render environmental clues
        this.renderEnvironmentalClues(ctx);

        // Render interactive objects
        this.renderInteractiveObjects(ctx);

        // Render story phase indicator
        this.renderStoryPhaseIndicator(ctx);

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

    updateSurvivorNPCs(deltaTime, players) {
        for (const npc of this.survivorNPCs) {
            if (npc.update) {
                npc.update(deltaTime, players, this.gameEngine);
            }
        }
    }

    updateInteractiveObjects(players) {
        for (const obj of this.interactiveObjects) {
            if (obj.interacted) continue;

            for (const player of players) {
                if (!player.isAlive) continue;

                const distance = Math.sqrt(
                    Math.pow(player.x - obj.x, 2) + Math.pow(player.y - obj.y, 2)
                );

                if (distance < 60) {
                    obj.interacted = true;
                    this.showObjectMessage(obj);
                    this.discoveredClues.add(obj.type);
                    break;
                }
            }
        }
    }

    showObjectMessage(obj) {
        console.log(`Interactive object: ${obj.message}`);
        // This would show in the dialogue system
    }



    renderEnvironmentalClues(ctx) {
        for (const clue of this.environmentalClues) {
            if (!clue.discovered) {
                // Render subtle visual hints
                ctx.save();
                ctx.globalAlpha = 0.7;

                switch (clue.type) {
                    case 'bloodstain':
                        ctx.fillStyle = '#660000';
                        ctx.fillRect(clue.x - 10, clue.y - 5, 20, 10);
                        break;
                    case 'abandoned_equipment':
                        ctx.fillStyle = '#888888';
                        ctx.fillRect(clue.x - 15, clue.y - 10, 30, 20);
                        break;
                    case 'warning_sign':
                        ctx.fillStyle = '#ffff00';
                        ctx.fillRect(clue.x - 20, clue.y - 15, 40, 30);
                        ctx.fillStyle = '#000000';
                        ctx.font = '8px monospace';
                        ctx.textAlign = 'center';
                        ctx.fillText('DANGER', clue.x, clue.y);
                        break;
                    case 'emergency_kit':
                        ctx.fillStyle = '#ff0000';
                        ctx.fillRect(clue.x - 12, clue.y - 8, 24, 16);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(clue.x - 2, clue.y - 6, 4, 12);
                        ctx.fillRect(clue.x - 6, clue.y - 2, 12, 4);
                        break;
                }

                ctx.restore();
            }
        }
    }

    renderInteractiveObjects(ctx) {
        for (const obj of this.interactiveObjects) {
            ctx.save();

            if (obj.interacted) {
                ctx.globalAlpha = 0.5;
            }

            switch (obj.type) {
                case 'radio':
                    ctx.fillStyle = '#333333';
                    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    ctx.fillStyle = obj.interacted ? '#666666' : '#00ff00';
                    ctx.fillRect(obj.x + 5, obj.y + 5, 8, 8);
                    break;
                case 'terminal':
                    ctx.fillStyle = '#444444';
                    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    ctx.fillStyle = obj.interacted ? '#666666' : '#0088ff';
                    ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, obj.height - 20);
                    break;
                case 'supplies':
                    ctx.fillStyle = '#ff4444';
                    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(obj.x + obj.width / 2 - 2, obj.y + 2, 4, obj.height - 8);
                    ctx.fillRect(obj.x + 2, obj.y + obj.height / 2 - 2, obj.width - 4, 4);
                    break;
            }

            // Show interaction prompt for nearby players
            if (!obj.interacted) {
                // This would be handled by the interaction system
            }

            ctx.restore();
        }
    }

    renderStoryPhaseIndicator(ctx) {
        // Show current story phase in debug mode
        if (this.gameEngine?.developerSettings?.settings?.showDebugInfo) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.fillText(`Story Phase: ${this.storyPhase}`, 10, 200);
            ctx.fillText(`Clues Found: ${this.discoveredClues.size}/4`, 10, 215);
        }
    }
}