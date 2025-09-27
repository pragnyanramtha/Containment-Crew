/**
 * TutorialManager handles tutorial mechanics, visual indicators, and completion tracking
 */
export class TutorialManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Tutorial state
        this.isActive = false;
        this.currentTutorial = null;
        this.tutorialSteps = [];
        this.currentStepIndex = 0;
        
        // Player progress tracking
        this.playerProgress = new Map(); // playerId -> Set of completed steps
        
        // Visual indicators
        this.indicators = [];
        this.animationTime = 0;
        
        // Tutorial UI
        this.tutorialUI = {
            x: 50,
            y: 50,
            width: 400,
            height: 150,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#00ff00',
            borderWidth: 2,
            padding: 15
        };
        
        // Text style
        this.textStyle = {
            font: '18px monospace',
            color: '#ffffff',
            titleColor: '#00ff00',
            lineHeight: 24
        };
    }
    
    /**
     * Start a tutorial
     */
    startTutorial(tutorialConfig) {
        console.log(`Starting tutorial: ${tutorialConfig.name}`);
        
        this.isActive = true;
        this.currentTutorial = tutorialConfig;
        this.tutorialSteps = tutorialConfig.steps || [];
        this.currentStepIndex = 0;
        
        // Initialize player progress
        this.playerProgress.clear();
        
        // Initialize visual indicators
        this.initializeIndicators();
        
        // Start first step
        if (this.tutorialSteps.length > 0) {
            this.activateStep(0);
        }
    }
    
    /**
     * Initialize visual indicators for tutorial steps
     */
    initializeIndicators() {
        this.indicators = this.tutorialSteps.map((step, index) => ({
            id: `indicator_${index}`,
            x: step.x || 0,
            y: step.y || 0,
            radius: step.radius || 50,
            isActive: false,
            isCompleted: false,
            pulseTime: 0,
            type: step.type || 'movement',
            instruction: step.instruction || '',
            color: step.color || '#00ff00'
        }));
    }
    
    /**
     * Activate a specific tutorial step
     */
    activateStep(stepIndex) {
        if (stepIndex >= this.tutorialSteps.length) return;
        
        // Deactivate previous indicators
        this.indicators.forEach(indicator => {
            indicator.isActive = false;
        });
        
        // Activate current step indicator
        if (this.indicators[stepIndex]) {
            this.indicators[stepIndex].isActive = true;
            this.indicators[stepIndex].pulseTime = 0;
        }
        
        this.currentStepIndex = stepIndex;
        console.log(`Tutorial step ${stepIndex + 1} activated`);
    }
    
    /**
     * Update tutorial system
     */
    update(deltaTime, players) {
        if (!this.isActive) return;
        
        this.animationTime += deltaTime;
        
        // Update indicator animations
        this.updateIndicators(deltaTime);
        
        // Check step completion for each player
        this.checkStepCompletion(players);
        
        // Check overall tutorial completion
        this.checkTutorialCompletion(players);
    }
    
    /**
     * Update visual indicator animations
     */
    updateIndicators(deltaTime) {
        this.indicators.forEach(indicator => {
            if (indicator.isActive) {
                indicator.pulseTime += deltaTime;
            }
        });
    }
    
    /**
     * Check if current step is completed by players
     */
    checkStepCompletion(players) {
        if (this.currentStepIndex >= this.tutorialSteps.length) return;
        
        const currentStep = this.tutorialSteps[this.currentStepIndex];
        const currentIndicator = this.indicators[this.currentStepIndex];
        
        if (!currentIndicator || currentIndicator.isCompleted) return;
        
        let playersCompleted = 0;
        
        players.forEach(player => {
            if (!player.isAlive) return;
            
            // Get or create player progress
            if (!this.playerProgress.has(player.id)) {
                this.playerProgress.set(player.id, new Set());
            }
            
            const playerSteps = this.playerProgress.get(player.id);
            
            // Check if player already completed this step
            if (playerSteps.has(this.currentStepIndex)) {
                playersCompleted++;
                return;
            }
            
            // Check step completion condition
            if (this.checkStepCondition(currentStep, player)) {
                playerSteps.add(this.currentStepIndex);
                playersCompleted++;
                console.log(`Player ${player.id} completed tutorial step ${this.currentStepIndex + 1}`);
            }
        });
        
        // Check if all players completed the step
        if (playersCompleted >= players.length) {
            this.completeStep(this.currentStepIndex);
        }
    }
    
    /**
     * Check if a player meets the condition for a tutorial step
     */
    checkStepCondition(step, player) {
        switch (step.type) {
            case 'movement':
                return this.checkMovementCondition(step, player);
            case 'interaction':
                return this.checkInteractionCondition(step, player);
            case 'position':
                return this.checkPositionCondition(step, player);
            default:
                return false;
        }
    }
    
    /**
     * Check movement-based tutorial condition
     */
    checkMovementCondition(step, player) {
        // Check if player moved to target position
        if (step.targetX !== undefined && step.targetY !== undefined) {
            const distance = Math.sqrt(
                Math.pow(player.x - step.targetX, 2) + 
                Math.pow(player.y - step.targetY, 2)
            );
            return distance <= (step.radius || 50);
        }
        
        // Check if player has moved at all
        if (step.requireMovement) {
            return player.isMoving || Math.abs(player.velocityX) > 0 || Math.abs(player.velocityY) > 0;
        }
        
        return false;
    }
    
    /**
     * Check interaction-based tutorial condition
     */
    checkInteractionCondition(step, player) {
        // This would check if player interacted with specific objects
        // For now, return false as interaction system needs more integration
        return false;
    }
    
    /**
     * Check position-based tutorial condition
     */
    checkPositionCondition(step, player) {
        if (step.x === undefined || step.y === undefined) return false;
        
        const distance = Math.sqrt(
            Math.pow(player.x - step.x, 2) + 
            Math.pow(player.y - step.y, 2)
        );
        
        return distance <= (step.radius || 50);
    }
    
    /**
     * Complete a tutorial step
     */
    completeStep(stepIndex) {
        if (stepIndex >= this.indicators.length) return;
        
        const indicator = this.indicators[stepIndex];
        indicator.isCompleted = true;
        indicator.isActive = false;
        
        console.log(`Tutorial step ${stepIndex + 1} completed by all players`);
        
        // Activate next step
        const nextStepIndex = stepIndex + 1;
        if (nextStepIndex < this.tutorialSteps.length) {
            setTimeout(() => {
                this.activateStep(nextStepIndex);
            }, 500); // Small delay between steps
        }
    }
    
    /**
     * Check if entire tutorial is completed
     */
    checkTutorialCompletion(players) {
        if (!this.currentTutorial) return;
        
        // Check if all steps are completed
        const allStepsCompleted = this.indicators.every(indicator => indicator.isCompleted);
        
        if (allStepsCompleted) {
            this.completeTutorial();
        }
    }
    
    /**
     * Complete the tutorial
     */
    completeTutorial() {
        console.log(`Tutorial "${this.currentTutorial.name}" completed!`);
        
        this.isActive = false;
        
        // Notify tutorial completion
        if (this.currentTutorial.onComplete) {
            this.currentTutorial.onComplete();
        }
        
        // Clear tutorial data
        this.currentTutorial = null;
        this.tutorialSteps = [];
        this.indicators = [];
        this.playerProgress.clear();
    }
    
    /**
     * Render tutorial system
     */
    render(ctx) {
        if (!this.isActive) return;
        
        // Render visual indicators
        this.renderIndicators(ctx);
        
        // Render tutorial UI
        this.renderTutorialUI(ctx);
    }
    
    /**
     * Render visual indicators
     */
    renderIndicators(ctx) {
        this.indicators.forEach((indicator, index) => {
            if (!indicator.isActive && !indicator.isCompleted) return;
            
            if (indicator.isCompleted) {
                // Render completed indicator
                this.renderCompletedIndicator(ctx, indicator);
            } else if (indicator.isActive) {
                // Render active indicator
                this.renderActiveIndicator(ctx, indicator);
            }
        });
    }
    
    /**
     * Render active tutorial indicator
     */
    renderActiveIndicator(ctx, indicator) {
        // Pulsing circle animation
        const pulseScale = 1 + Math.sin(indicator.pulseTime * 3) * 0.3;
        const radius = indicator.radius * pulseScale;
        const alpha = 0.4 + Math.sin(indicator.pulseTime * 2) * 0.3;
        
        // Draw outer circle
        ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(indicator.x, indicator.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner circle
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(indicator.x, indicator.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw instruction text
        if (indicator.instruction) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                indicator.instruction,
                indicator.x,
                indicator.y - radius - 20
            );
            ctx.textAlign = 'left';
        }
        
        // Draw step number
        ctx.fillStyle = '#ffff00';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.currentStepIndex + 1}`,
            indicator.x,
            indicator.y + 6
        );
        ctx.textAlign = 'left';
    }
    
    /**
     * Render completed tutorial indicator
     */
    renderCompletedIndicator(ctx, indicator) {
        // Static green checkmark
        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(indicator.x, indicator.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw checkmark
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(indicator.x - 8, indicator.y);
        ctx.lineTo(indicator.x - 2, indicator.y + 6);
        ctx.lineTo(indicator.x + 8, indicator.y - 6);
        ctx.stroke();
    }
    
    /**
     * Render tutorial UI panel
     */
    renderTutorialUI(ctx) {
        if (!this.currentTutorial) return;
        
        const ui = this.tutorialUI;
        
        // Draw background
        ctx.fillStyle = ui.backgroundColor;
        ctx.fillRect(ui.x, ui.y, ui.width, ui.height);
        
        // Draw border
        ctx.strokeStyle = ui.borderColor;
        ctx.lineWidth = ui.borderWidth;
        ctx.strokeRect(ui.x, ui.y, ui.width, ui.height);
        
        // Draw tutorial title
        ctx.fillStyle = this.textStyle.titleColor;
        ctx.font = '20px monospace';
        ctx.fillText(
            this.currentTutorial.name,
            ui.x + ui.padding,
            ui.y + ui.padding + 20
        );
        
        // Draw current step info
        if (this.currentStepIndex < this.tutorialSteps.length) {
            const currentStep = this.tutorialSteps[this.currentStepIndex];
            
            ctx.fillStyle = this.textStyle.color;
            ctx.font = this.textStyle.font;
            
            // Step number and total
            ctx.fillText(
                `Step ${this.currentStepIndex + 1} of ${this.tutorialSteps.length}`,
                ui.x + ui.padding,
                ui.y + ui.padding + 50
            );
            
            // Step instruction
            if (currentStep.instruction) {
                ctx.fillText(
                    currentStep.instruction,
                    ui.x + ui.padding,
                    ui.y + ui.padding + 80
                );
            }
        }
        
        // Draw progress bar
        this.renderProgressBar(ctx);
    }
    
    /**
     * Render tutorial progress bar
     */
    renderProgressBar(ctx) {
        const ui = this.tutorialUI;
        const barWidth = ui.width - (ui.padding * 2);
        const barHeight = 8;
        const barX = ui.x + ui.padding;
        const barY = ui.y + ui.height - ui.padding - barHeight;
        
        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress
        const progress = this.indicators.filter(i => i.isCompleted).length / this.indicators.length;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    /**
     * Get tutorial completion percentage
     */
    getCompletionPercentage() {
        if (this.indicators.length === 0) return 0;
        
        const completedSteps = this.indicators.filter(i => i.isCompleted).length;
        return (completedSteps / this.indicators.length) * 100;
    }
    
    /**
     * Check if tutorial is active
     */
    isTutorialActive() {
        return this.isActive;
    }
    
    /**
     * Get current tutorial info
     */
    getCurrentTutorial() {
        return this.currentTutorial;
    }
    
    /**
     * Skip current tutorial
     */
    skipTutorial() {
        if (this.isActive) {
            console.log('Skipping tutorial');
            this.completeTutorial();
        }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.isActive = false;
        this.currentTutorial = null;
        this.tutorialSteps = [];
        this.indicators = [];
        this.playerProgress.clear();
    }
}