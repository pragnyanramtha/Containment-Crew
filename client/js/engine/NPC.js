/**
 * NPC (Non-Player Character) class for story and dialogue interactions
 */
export class NPC {
    constructor(config) {
        this.id = config.id || `npc_${Date.now()}`;
        this.type = config.type || 'generic';
        this.name = config.name || 'Unknown';
        
        // Position and size
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 64;
        this.height = config.height || 64;
        
        // Dialogue system
        this.dialogue = config.dialogue || [];
        this.currentDialogueIndex = 0;
        this.hasSpokenTo = false;
        this.isInteractable = true;
        
        // Interaction properties
        this.interactionRadius = config.interactionRadius || 80;
        this.isPlayerNearby = false;
        this.nearbyPlayers = new Set();
        
        // Visual properties
        this.color = config.color || '#ffaa00';
        this.textColor = config.textColor || '#ffffff';
        this.nameColor = config.nameColor || '#ffff00';
        
        // Animation properties
        this.animationTime = 0;
        this.bobOffset = 0;
        this.bobSpeed = 2;
        this.bobAmount = 3;
        
        // State
        this.isActive = true;
        this.isVisible = true;
    }
    
    /**
     * Update NPC state
     */
    update(deltaTime, players, gameEngine) {
        if (!this.isActive) return;
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Check for nearby players
        this.checkPlayerProximity(players);
        
        // Handle interactions
        this.handleInteractions(players, gameEngine);
    }
    
    /**
     * Update NPC animations
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // Simple bobbing animation
        this.bobOffset = Math.sin(this.animationTime * this.bobSpeed) * this.bobAmount;
    }
    
    /**
     * Check if players are nearby for interaction
     */
    checkPlayerProximity(players) {
        this.nearbyPlayers.clear();
        this.isPlayerNearby = false;
        
        for (const player of players) {
            if (!player.isAlive) continue;
            
            const distance = this.getDistanceToPlayer(player);
            if (distance <= this.interactionRadius) {
                this.nearbyPlayers.add(player);
                this.isPlayerNearby = true;
            }
        }
    }
    
    /**
     * Get distance to a player
     */
    getDistanceToPlayer(player) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        return Math.sqrt(
            Math.pow(centerX - playerCenterX, 2) + 
            Math.pow(centerY - playerCenterY, 2)
        );
    }
    
    /**
     * Handle player interactions
     */
    handleInteractions(players, gameEngine) {
        // This will be handled by the dialogue system
        // For now, just track if we should show interaction prompt
    }
    
    /**
     * Start dialogue with this NPC
     */
    startDialogue() {
        if (!this.isInteractable || this.dialogue.length === 0) {
            return null;
        }
        
        this.currentDialogueIndex = 0;
        this.hasSpokenTo = true;
        
        return {
            npc: this,
            dialogue: this.dialogue,
            currentIndex: this.currentDialogueIndex
        };
    }
    
    /**
     * Get current dialogue line
     */
    getCurrentDialogue() {
        if (this.currentDialogueIndex >= this.dialogue.length) {
            return null;
        }
        
        return this.dialogue[this.currentDialogueIndex];
    }
    
    /**
     * Advance to next dialogue line
     */
    nextDialogue() {
        this.currentDialogueIndex++;
        return this.getCurrentDialogue();
    }
    
    /**
     * Check if dialogue is finished
     */
    isDialogueFinished() {
        return this.currentDialogueIndex >= this.dialogue.length;
    }
    
    /**
     * Reset dialogue to beginning
     */
    resetDialogue() {
        this.currentDialogueIndex = 0;
        this.hasSpokenTo = false;
    }
    
    /**
     * Render NPC
     */
    render(ctx, spriteRenderer) {
        if (!this.isVisible) return;
        
        // Calculate render position with bobbing
        const renderY = this.y + this.bobOffset;
        
        // Draw NPC body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, renderY, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, renderY, this.width, this.height);
        
        // Draw name above NPC
        this.renderName(ctx);
        
        // Draw interaction indicator if player is nearby
        if (this.isPlayerNearby && this.isInteractable) {
            this.renderInteractionIndicator(ctx);
        }
        
        // Draw interaction radius in debug mode (optional)
        if (false) { // Set to true for debugging
            this.renderInteractionRadius(ctx);
        }
    }
    
    /**
     * Render NPC name
     */
    renderName(ctx) {
        ctx.fillStyle = this.nameColor;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        
        const textX = this.x + this.width / 2;
        const textY = this.y - 10;
        
        ctx.fillText(this.name, textX, textY);
        
        // Reset text alignment
        ctx.textAlign = 'left';
    }
    
    /**
     * Render interaction indicator
     */
    renderInteractionIndicator(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y - 30;
        
        // Draw pulsing interaction icon
        const pulseScale = 1 + Math.sin(this.animationTime * 4) * 0.2;
        const iconSize = 16 * pulseScale;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            centerX - iconSize / 2, 
            centerY - iconSize / 2, 
            iconSize, 
            iconSize
        );
        
        // Draw "E" for interact
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.floor(iconSize * 0.6)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('E', centerX, centerY + iconSize * 0.2);
        ctx.textAlign = 'left';
    }
    
    /**
     * Render interaction radius (debug)
     */
    renderInteractionRadius(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.interactionRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * Get collision bounds
     */
    getCollisionBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Reset NPC to initial state
     */
    reset() {
        this.currentDialogueIndex = 0;
        this.hasSpokenTo = false;
        this.isActive = true;
        this.isVisible = true;
        this.animationTime = 0;
    }
    
    /**
     * Destroy NPC and clean up resources
     */
    destroy() {
        this.nearbyPlayers.clear();
        this.isActive = false;
        this.isVisible = false;
    }
}