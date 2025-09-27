/**
 * DialogueSystem handles NPC interactions and story dialogue display
 */
export class DialogueSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Dialogue state
        this.isActive = false;
        this.currentDialogue = null;
        this.currentNPC = null;
        this.currentText = '';
        this.fullText = '';
        
        // Typewriter effect
        this.typewriterSpeed = 50; // characters per second
        this.typewriterProgress = 0;
        this.isTyping = false;
        
        // UI properties
        this.dialogueBox = {
            x: 100,
            y: 700,
            width: 1720,
            height: 280,
            padding: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#ffffff',
            borderWidth: 3
        };
        
        // Text properties
        this.textStyle = {
            font: '24px monospace',
            color: '#ffffff',
            lineHeight: 32,
            maxLines: 6
        };
        
        // Name box properties
        this.nameBox = {
            width: 300,
            height: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#ffff00',
            borderWidth: 2
        };
        
        // Input handling
        this.lastInteractTime = 0;
        this.interactCooldown = 200; // milliseconds
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        // Set up input listeners
        this.setupInputListeners();
    }
    
    /**
     * Set up input event listeners
     */
    setupInputListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    /**
     * Handle keyboard input for dialogue
     */
    handleKeyDown(event) {
        if (!this.isActive) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastInteractTime < this.interactCooldown) {
            return;
        }
        
        // Handle dialogue progression
        if (event.code === 'KeyE' || event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            this.lastInteractTime = currentTime;
            
            if (this.isTyping) {
                // Skip typewriter effect
                this.skipTypewriter();
            } else {
                // Advance to next dialogue line
                this.nextDialogue();
            }
        }
        
        // Handle dialogue exit
        if (event.code === 'Escape') {
            event.preventDefault();
            this.endDialogue();
        }
    }
    
    /**
     * Update dialogue system
     */
    update(deltaTime, players) {
        if (!this.isActive) {
            // Check for NPC interactions
            this.checkForInteractions(players);
            return;
        }
        
        // Update typewriter effect
        if (this.isTyping) {
            this.updateTypewriter(deltaTime);
        }
    }
    
    /**
     * Check for player interactions with NPCs
     */
    checkForInteractions(players) {
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (!currentLevel || !currentLevel.npcs) return;
        
        // Check each NPC for nearby players
        for (const npc of currentLevel.npcs) {
            if (!npc.isInteractable || !npc.isPlayerNearby) continue;
            
            // Check if any player pressed interact key
            if (this.gameEngine.isKeyPressed('KeyE')) {
                const currentTime = Date.now();
                if (currentTime - this.lastInteractTime >= this.interactCooldown) {
                    this.startDialogue(npc);
                    this.lastInteractTime = currentTime;
                    break;
                }
            }
        }
    }
    
    /**
     * Start dialogue with an NPC
     */
    startDialogue(npc) {
        if (this.isActive) return;
        
        const dialogueData = npc.startDialogue();
        if (!dialogueData) return;
        
        console.log(`Starting dialogue with ${npc.name}`);
        
        this.isActive = true;
        this.currentNPC = npc;
        this.currentDialogue = dialogueData;
        
        // Start first dialogue line
        this.showDialogueLine(npc.getCurrentDialogue());
    }
    
    /**
     * Show a dialogue line with typewriter effect
     */
    showDialogueLine(text) {
        if (!text) {
            this.endDialogue();
            return;
        }
        
        this.fullText = text;
        this.currentText = '';
        this.typewriterProgress = 0;
        this.isTyping = true;
    }
    
    /**
     * Update typewriter effect
     */
    updateTypewriter(deltaTime) {
        if (!this.isTyping) return;
        
        this.typewriterProgress += deltaTime * this.typewriterSpeed;
        const targetLength = Math.floor(this.typewriterProgress);
        
        if (targetLength >= this.fullText.length) {
            // Typewriter complete
            this.currentText = this.fullText;
            this.isTyping = false;
        } else {
            // Update current text
            this.currentText = this.fullText.substring(0, targetLength);
        }
    }
    
    /**
     * Skip typewriter effect and show full text
     */
    skipTypewriter() {
        this.currentText = this.fullText;
        this.isTyping = false;
    }
    
    /**
     * Advance to next dialogue line
     */
    nextDialogue() {
        if (!this.currentNPC) return;
        
        const nextLine = this.currentNPC.nextDialogue();
        if (nextLine) {
            this.showDialogueLine(nextLine);
        } else {
            this.endDialogue();
        }
    }
    
    /**
     * End current dialogue
     */
    endDialogue() {
        console.log('Ending dialogue');
        
        this.isActive = false;
        this.currentDialogue = null;
        this.currentNPC = null;
        this.currentText = '';
        this.fullText = '';
        this.isTyping = false;
    }
    
    /**
     * Render dialogue system
     */
    render(ctx) {
        if (!this.isActive) return;
        
        // Render dialogue box
        this.renderDialogueBox(ctx);
        
        // Render NPC name
        this.renderNPCName(ctx);
        
        // Render dialogue text
        this.renderDialogueText(ctx);
        
        // Render continue indicator
        this.renderContinueIndicator(ctx);
    }
    
    /**
     * Render dialogue box background
     */
    renderDialogueBox(ctx) {
        const box = this.dialogueBox;
        
        // Draw background
        ctx.fillStyle = box.backgroundColor;
        ctx.fillRect(box.x, box.y, box.width, box.height);
        
        // Draw border
        ctx.strokeStyle = box.borderColor;
        ctx.lineWidth = box.borderWidth;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
    
    /**
     * Render NPC name box
     */
    renderNPCName(ctx) {
        if (!this.currentNPC) return;
        
        const box = this.dialogueBox;
        const nameBox = this.nameBox;
        
        // Position name box above dialogue box
        const nameX = box.x;
        const nameY = box.y - nameBox.height;
        
        // Draw name box background
        ctx.fillStyle = nameBox.backgroundColor;
        ctx.fillRect(nameX, nameY, nameBox.width, nameBox.height);
        
        // Draw name box border
        ctx.strokeStyle = nameBox.borderColor;
        ctx.lineWidth = nameBox.borderWidth;
        ctx.strokeRect(nameX, nameY, nameBox.width, nameBox.height);
        
        // Draw NPC name
        ctx.fillStyle = this.currentNPC.nameColor;
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.currentNPC.name,
            nameX + nameBox.width / 2,
            nameY + nameBox.height / 2 + 7
        );
        ctx.textAlign = 'left';
    }
    
    /**
     * Render dialogue text with word wrapping
     */
    renderDialogueText(ctx) {
        if (!this.currentText) return;
        
        const box = this.dialogueBox;
        const textStyle = this.textStyle;
        
        // Set text style
        ctx.fillStyle = textStyle.color;
        ctx.font = textStyle.font;
        
        // Calculate text area
        const textX = box.x + box.padding;
        const textY = box.y + box.padding;
        const textWidth = box.width - (box.padding * 2);
        
        // Word wrap the text
        const lines = this.wrapText(ctx, this.currentText, textWidth);
        
        // Render each line
        for (let i = 0; i < Math.min(lines.length, textStyle.maxLines); i++) {
            const lineY = textY + (i + 1) * textStyle.lineHeight;
            ctx.fillText(lines[i], textX, lineY);
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
     * Render continue indicator
     */
    renderContinueIndicator(ctx) {
        if (this.isTyping) return;
        
        const box = this.dialogueBox;
        
        // Pulsing continue arrow
        const time = Date.now() / 1000;
        const alpha = 0.5 + Math.sin(time * 3) * 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '20px monospace';
        ctx.textAlign = 'right';
        
        const arrowX = box.x + box.width - box.padding;
        const arrowY = box.y + box.height - box.padding;
        
        if (this.currentNPC && !this.currentNPC.isDialogueFinished()) {
            ctx.fillText('▼', arrowX, arrowY);
        } else {
            ctx.fillText('✕', arrowX, arrowY);
        }
        
        ctx.textAlign = 'left';
        
        // Show controls hint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px monospace';
        ctx.fillText(
            'E/Space: Continue | Esc: Exit',
            box.x + box.padding,
            box.y + box.height - 10
        );
    }
    
    /**
     * Check if dialogue system is active
     */
    isDialogueActive() {
        return this.isActive;
    }
    
    /**
     * Get current NPC
     */
    getCurrentNPC() {
        return this.currentNPC;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        this.endDialogue();
    }
}