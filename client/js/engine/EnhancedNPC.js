import { NPC } from './NPC.js';

/**
 * EnhancedNPC - Rich NPCs with personality, multiple dialogue trees, and interactive behaviors
 */
export class EnhancedNPC extends NPC {
    constructor(config) {
        super(config);

        // Enhanced properties
        this.personality = config.personality || 'neutral';
        this.backstory = config.backstory || '';
        this.currentMood = config.mood || 'normal';
        this.dialogueTrees = config.dialogueTrees || {};
        this.currentDialogueTree = 'default';
        this.hasMetPlayers = false;
        this.relationshipWithPlayers = new Map(); // playerId -> relationship level
        this.questsGiven = [];
        this.itemsToGive = config.items || [];

        // Behavioral states
        this.behaviorState = 'idle'; // idle, talking, panicked, dying, helpful
        this.emotionalState = 'calm'; // calm, scared, desperate, hopeful, angry
        this.movementPattern = config.movementPattern || 'stationary';
        this.patrolPoints = config.patrolPoints || [];
        this.currentPatrolIndex = 0;

        // Visual enhancements
        this.speechBubbleTimer = 0;
        this.speechBubbleText = '';
        this.emotionIcon = '';
        this.statusEffects = [];
    }

    /**
     * Enhanced update with personality-driven behavior
     */
    update(deltaTime, players, gameEngine) {
        super.update(deltaTime, players, gameEngine);

        // Update behavioral AI
        this.updateBehavior(deltaTime, players);

        // Update emotional responses
        this.updateEmotionalState(deltaTime, players);

        // Update movement patterns
        this.updateMovementPattern(deltaTime);

        // Update speech bubbles
        this.updateSpeechBubble(deltaTime);
    }

    updateBehavior(deltaTime, players) {
        switch (this.behaviorState) {
            case 'idle':
                this.handleIdleBehavior(deltaTime, players);
                break;
            case 'panicked':
                this.handlePanickedBehavior(deltaTime, players);
                break;
            case 'dying':
                this.handleDyingBehavior(deltaTime, players);
                break;
            case 'helpful':
                this.handleHelpfulBehavior(deltaTime, players);
                break;
        }
    }

    handleIdleBehavior(deltaTime, players) {
        // Look around occasionally
        if (Math.random() < 0.01) {
            this.showSpeechBubble(this.getIdleComment(), 2.0);
        }

        // React to nearby players
        const nearbyPlayer = this.findNearestPlayer(players);
        if (nearbyPlayer && this.getDistanceToPlayer(nearbyPlayer) < this.interactionRadius) {
            if (!this.hasMetPlayers) {
                this.hasMetPlayers = true;
                this.showSpeechBubble("Oh! Survivors!", 3.0);
                this.behaviorState = 'helpful';
            }
        }
    }

    handlePanickedBehavior(deltaTime, players) {
        // Move erratically
        this.velocityX = (Math.random() - 0.5) * 50;
        this.velocityY = (Math.random() - 0.5) * 50;

        // Panic speech
        if (Math.random() < 0.02) {
            const panicPhrases = [
                "We're all going to die!",
                "The radiation is everywhere!",
                "Why did this happen?!",
                "Someone help us!"
            ];
            this.showSpeechBubble(panicPhrases[Math.floor(Math.random() * panicPhrases.length)], 2.5);
        }
    }

    handleDyingBehavior(deltaTime, players) {
        // Gradually fade and speak final words
        this.health -= deltaTime * 5; // Slowly dying

        if (this.health <= 0) {
            this.isAlive = false;
            this.showSpeechBubble("Tell them... tell them we tried...", 4.0);
        }
    }

    handleHelpfulBehavior(deltaTime, players) {
        // Offer assistance and information
        const nearbyPlayer = this.findNearestPlayer(players);
        if (nearbyPlayer && Math.random() < 0.005) {
            const helpfulPhrases = [
                "I know this facility well.",
                "Be careful of the radiation zones.",
                "There are supplies in the storage room.",
                "The reactor is through the main corridor."
            ];
            this.showSpeechBubble(helpfulPhrases[Math.floor(Math.random() * helpfulPhrases.length)], 3.0);
        }
    }

    showSpeechBubble(text, duration) {
        this.speechBubbleText = text;
        this.speechBubbleTimer = duration;
    }

    updateSpeechBubble(deltaTime) {
        if (this.speechBubbleTimer > 0) {
            this.speechBubbleTimer -= deltaTime;
        }
    }

    getIdleComment() {
        const comments = [
            "...",
            "*sigh*",
            "When will this end?",
            "I miss the old days.",
            "*cough*"
        ];
        return comments[Math.floor(Math.random() * comments.length)];
    }

    findNearestPlayer(players) {
        let nearest = null;
        let minDistance = Infinity;

        for (const player of players) {
            if (!player.isAlive) continue;
            const distance = this.getDistanceToPlayer(player);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = player;
            }
        }

        return nearest;
    }

    getDistanceToPlayer(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Enhanced render method with emotional indicators (no speech bubbles)
     */
    render(ctx, spriteRenderer) {
        // Call parent render method
        super.render(ctx, spriteRenderer);

        // Render emotion icon
        if (this.emotionIcon) {
            this.renderEmotionIcon(ctx);
        }

        // Render interaction prompt if player is nearby
        this.renderInteractionPrompt(ctx);
    }

    renderSpeechBubble(ctx) {
        if (!this.speechBubbleText || this.speechBubbleTimer <= 0) return;

        const bubbleX = this.x + this.width / 2;
        const bubbleY = this.y - 40;
        const bubbleWidth = Math.max(100, this.speechBubbleText.length * 6);
        const bubbleHeight = 30;

        // Speech bubble background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(bubbleX - bubbleWidth / 2, bubbleY, bubbleWidth, bubbleHeight);

        // Speech bubble border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(bubbleX - bubbleWidth / 2, bubbleY, bubbleWidth, bubbleHeight);

        // Speech bubble tail
        ctx.beginPath();
        ctx.moveTo(bubbleX - 10, bubbleY + bubbleHeight);
        ctx.lineTo(bubbleX, bubbleY + bubbleHeight + 10);
        ctx.lineTo(bubbleX + 10, bubbleY + bubbleHeight);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Speech text
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.speechBubbleText, bubbleX, bubbleY + 20);
        ctx.textAlign = 'left';
    }

    renderEmotionIcon(ctx) {
        const iconX = this.x + this.width + 5;
        const iconY = this.y - 5;

        ctx.fillStyle = '#ffff00';
        ctx.font = '16px monospace';
        ctx.fillText(this.emotionIcon, iconX, iconY);
    }

    /**
     * Update movement pattern
     */
    updateMovementPattern(deltaTime) {
        switch (this.movementPattern) {
            case 'patrol':
                this.updatePatrolMovement(deltaTime);
                break;
            case 'wander':
                this.updateWanderMovement(deltaTime);
                break;
            case 'stationary':
            default:
                // No movement
                break;
        }
    }

    updatePatrolMovement(deltaTime) {
        if (this.patrolPoints.length < 2) return;

        const target = this.patrolPoints[this.currentPatrolIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            // Reached patrol point, move to next
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            // Move towards patrol point
            const speed = 30; // pixels per second
            this.x += (dx / distance) * speed * deltaTime;
            this.y += (dy / distance) * speed * deltaTime;
        }
    }

    updateWanderMovement(deltaTime) {
        // Random wandering movement
        if (Math.random() < 0.1) {
            this.velocityX = (Math.random() - 0.5) * 20;
            this.velocityY = (Math.random() - 0.5) * 20;
        }

        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Gradually slow down
        this.velocityX *= 0.95;
        this.velocityY *= 0.95;
    }

    /**
     * Update emotional state based on circumstances
     */
    updateEmotionalState(deltaTime, players) {
        // Update emotion based on nearby players and events
        const nearbyPlayer = this.findNearestPlayer(players);
        const distance = nearbyPlayer ? this.getDistanceToPlayer(nearbyPlayer) : Infinity;

        if (distance < this.interactionRadius) {
            switch (this.personality) {
                case 'panicked_civilian':
                    this.emotionalState = 'scared';
                    this.emotionIcon = '😰';
                    break;
                case 'battle_hardened':
                    this.emotionalState = 'determined';
                    this.emotionIcon = '💪';
                    break;
                case 'desperate_scientist':
                    this.emotionalState = 'desperate';
                    this.emotionIcon = '😵';
                    break;
                default:
                    this.emotionalState = 'calm';
                    this.emotionIcon = '';
            }
        } else {
            this.emotionIcon = '';
        }
    }

    /**
     * Check if dialogue is finished
     */
    isDialogueFinished() {
        return this.hasSpokenTo && this.currentDialogueIndex >= this.dialogue.length;
    }

    /**
     * Reset dialogue state
     */
    resetDialogue() {
        this.hasSpokenTo = false;
        this.currentDialogueIndex = 0;
        this.speechBubbleTimer = 0;
        this.speechBubbleText = '';
    }

    /**
     * Start dialogue interaction
     */
    startDialogue(dialogueTree = 'default') {
        this.currentDialogueTree = dialogueTree;
        this.hasSpokenTo = true;
        this.currentDialogueIndex = 0;

        const tree = this.dialogueTrees[dialogueTree];
        if (tree && tree.length > 0) {
            this.showSpeechBubble(tree[0], 4.0);
        }
    }

    /**
     * Continue to next dialogue line
     */
    nextDialogue() {
        const tree = this.dialogueTrees[this.currentDialogueTree];
        if (!tree) return false;

        this.currentDialogueIndex++;
        if (this.currentDialogueIndex < tree.length) {
            this.showSpeechBubble(tree[this.currentDialogueIndex], 4.0);
            return true;
        }

        return false; // Dialogue finished
    }

    /**
     * Render interaction prompt when player is nearby
     */
    renderInteractionPrompt(ctx) {
        if (!this.isPlayerNearby) return;

        const promptX = this.x + this.width / 2;
        const promptY = this.y - 15;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(promptX - 15, promptY - 10, 30, 15);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(promptX - 15, promptY - 10, 30, 15);

        // "E" key indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('E', promptX, promptY);
        ctx.textAlign = 'left';
    }

    /**
     * Update player proximity for interaction prompts
     */
    updatePlayerProximity(players) {
        this.isPlayerNearby = false;
        if (!this.nearbyPlayers) {
            this.nearbyPlayers = new Set();
        }
        this.nearbyPlayers.clear();

        for (const player of players) {
            if (!player.isAlive) continue;

            const distance = this.getDistanceToPlayer(player);
            if (distance < this.interactionRadius) {
                this.isPlayerNearby = true;
                this.nearbyPlayers.add(player.id);
            }
        }
    }

    /**
     * Override update to include proximity checking
     */
    update(deltaTime, players, gameEngine) {
        super.update(deltaTime, players, gameEngine);

        // Update player proximity
        this.updatePlayerProximity(players);

        // Update behavioral AI
        this.updateBehavior(deltaTime, players);

        // Update emotional responses
        this.updateEmotionalState(deltaTime, players);

        // Update movement patterns
        this.updateMovementPattern(deltaTime);

        // Update speech bubbles (now just for internal state)
        this.updateSpeechBubble(deltaTime);
    }
}