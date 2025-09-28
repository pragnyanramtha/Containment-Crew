/**
 * DialogueUI - Bottom dialogue box for NPC interactions
 */
export class DialogueUI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isVisible = false;
        this.currentDialogue = null;
        this.currentSpeaker = '';
        this.currentText = '';
        this.textIndex = 0;
        this.typewriterSpeed = 50; // Characters per second
        this.typewriterTimer = 0;
        this.isTyping = false;
        this.dialogueQueue = [];
        this.currentNPC = null;
        
        // UI styling
        this.boxHeight = 120;
        this.boxPadding = 20;
        this.textPadding = 15;
        this.speakerHeight = 25;
        
        // Animation
        this.animationTimer = 0;
        this.slideAnimation = 0; // 0 = hidden, 1 = visible
        this.slideSpeed = 5;
    }

    /**
     * Show dialogue from an NPC
     */
    showDialogue(npc, dialogueTree = 'default') {
        this.currentNPC = npc;
        this.currentSpeaker = npc.name || 'Unknown';
        
        // Get dialogue from NPC's dialogue trees
        const dialogue = npc.dialogueTrees[dialogueTree] || npc.dialogueTrees.default || [];
        
        if (dialogue.length === 0) {
            this.showSingleMessage(this.currentSpeaker, "...");
            return;
        }

        // Queue all dialogue lines
        this.dialogueQueue = dialogue.map(text => ({
            speaker: this.currentSpeaker,
            text: text
        }));

        this.showNextDialogue();
    }

    /**
     * Show a single message
     */
    showSingleMessage(speaker, text) {
        this.currentSpeaker = speaker;
        this.currentText = text;
        this.textIndex = 0;
        this.isTyping = true;
        this.typewriterTimer = 0;
        this.isVisible = true;
        this.slideAnimation = 0;
    }

    /**
     * Show next dialogue in queue
     */
    showNextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.hideDialogue();
            return;
        }

        const dialogue = this.dialogueQueue.shift();
        this.showSingleMessage(dialogue.speaker, dialogue.text);
    }

    /**
     * Hide dialogue box
     */
    hideDialogue() {
        this.isVisible = false;
        this.slideAnimation = 1;
        this.currentNPC = null;
        this.dialogueQueue = [];
    }

    /**
     * Handle input for dialogue progression
     */
    handleInput(key) {
        if (!this.isVisible) return false;

        switch (key) {
            case 'KeyE':
            case 'Space':
            case 'Enter':
                if (this.isTyping) {
                    // Skip typewriter effect
                    this.completeTypewriter();
                } else {
                    // Show next dialogue or close
                    this.showNextDialogue();
                }
                return true;

            case 'Escape':
                this.hideDialogue();
                return true;
        }

        return false;
    }

    /**
     * Complete typewriter effect immediately
     */
    completeTypewriter() {
        this.textIndex = this.currentText.length;
        this.isTyping = false;
    }

    /**
     * Update dialogue system
     */
    update(deltaTime) {
        // Update slide animation
        if (this.isVisible && this.slideAnimation < 1) {
            this.slideAnimation = Math.min(1, this.slideAnimation + this.slideSpeed * deltaTime);
        } else if (!this.isVisible && this.slideAnimation > 0) {
            this.slideAnimation = Math.max(0, this.slideAnimation - this.slideSpeed * deltaTime);
        }

        // Update typewriter effect
        if (this.isTyping && this.isVisible) {
            this.typewriterTimer += deltaTime;
            const charactersToShow = Math.floor(this.typewriterTimer * this.typewriterSpeed);
            
            if (charactersToShow >= this.currentText.length) {
                this.textIndex = this.currentText.length;
                this.isTyping = false;
            } else {
                this.textIndex = charactersToShow;
            }
        }

        // Update animation timer for effects
        this.animationTimer += deltaTime;
    }

    /**
     * Render dialogue UI
     */
    render(ctx) {
        if (this.slideAnimation <= 0) return;

        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Calculate positions
        const boxY = canvasHeight - (this.boxHeight * this.slideAnimation);
        const boxWidth = canvasWidth - (this.boxPadding * 2);
        const boxX = this.boxPadding;

        ctx.save();

        // Draw dialogue box background
        this.drawDialogueBox(ctx, boxX, boxY, boxWidth, this.boxHeight);

        // Draw speaker name
        this.drawSpeakerName(ctx, boxX, boxY, boxWidth);

        // Draw dialogue text
        this.drawDialogueText(ctx, boxX, boxY, boxWidth);

        // Draw interaction prompt
        if (!this.isTyping) {
            this.drawInteractionPrompt(ctx, boxX, boxY, boxWidth);
        }

        ctx.restore();
    }

    /**
     * Draw the dialogue box background
     */
    drawDialogueBox(ctx, x, y, width, height) {
        // Main background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(x, y, width, height);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Inner border
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, width - 6, height - 6);

        // Corner decorations
        const cornerSize = 10;
        ctx.fillStyle = '#444444';
        // Top corners
        ctx.fillRect(x + 5, y + 5, cornerSize, cornerSize);
        ctx.fillRect(x + width - 15, y + 5, cornerSize, cornerSize);
        // Bottom corners
        ctx.fillRect(x + 5, y + height - 15, cornerSize, cornerSize);
        ctx.fillRect(x + width - 15, y + height - 15, cornerSize, cornerSize);
    }

    /**
     * Draw speaker name
     */
    drawSpeakerName(ctx, x, y, width) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(this.currentSpeaker, x + this.textPadding, y + this.textPadding + 16);

        // Underline
        const textWidth = ctx.measureText(this.currentSpeaker).width;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + this.textPadding, y + this.textPadding + 20);
        ctx.lineTo(x + this.textPadding + textWidth, y + this.textPadding + 20);
        ctx.stroke();
    }

    /**
     * Draw dialogue text with typewriter effect
     */
    drawDialogueText(ctx, x, y, width) {
        const textY = y + this.speakerHeight + this.textPadding + 10;
        const maxWidth = width - (this.textPadding * 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';

        // Get text to display (with typewriter effect)
        const displayText = this.currentText.substring(0, this.textIndex);
        
        // Word wrap the text
        const lines = this.wrapText(ctx, displayText, maxWidth);
        
        // Draw each line
        lines.forEach((line, index) => {
            ctx.fillText(line, x + this.textPadding, textY + (index * 18));
        });

        // Draw cursor if typing
        if (this.isTyping && Math.sin(this.animationTimer * 8) > 0) {
            const lastLine = lines[lines.length - 1] || '';
            const cursorX = x + this.textPadding + ctx.measureText(lastLine).width;
            const cursorY = textY + ((lines.length - 1) * 18);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cursorX + 2, cursorY - 12, 2, 14);
        }
    }

    /**
     * Draw interaction prompt
     */
    drawInteractionPrompt(ctx, x, y, width) {
        const promptText = this.dialogueQueue.length > 0 ? 
            'Press E to continue...' : 'Press E to close';
        
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(promptText, x + width - this.textPadding, y + this.boxHeight - 10);

        // Blinking effect
        if (Math.sin(this.animationTimer * 4) > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText('▶', x + width - this.textPadding - ctx.measureText(promptText).width - 15, y + this.boxHeight - 10);
        }
    }

    /**
     * Wrap text to fit within specified width
     */
    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * Check if dialogue is currently active
     */
    isActive() {
        return this.isVisible || this.slideAnimation > 0;
    }
}