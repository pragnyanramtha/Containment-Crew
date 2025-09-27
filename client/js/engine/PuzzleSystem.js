/**
 * Puzzle System for cooperative puzzle mechanics in Levels 3-4
 * Handles dual-switch puzzles and hold-mechanism sacrifice systems
 */

/**
 * Base Puzzle class with state management
 */
export class Puzzle {
    constructor(type, config) {
        this.type = type;
        this.config = config;
        
        // Puzzle state
        this.isActive = false;
        this.isCompleted = false;
        this.isSolved = false;
        
        // Visual feedback
        this.visualState = 'inactive'; // 'inactive', 'active', 'solving', 'solved'
        this.feedbackTimer = 0;
        this.feedbackDuration = 0.5;
        
        // Player interactions
        this.interactingPlayers = new Set();
        this.requiredPlayers = config.requiredPlayers || 2;
        
        // Puzzle elements (switches, mechanisms, etc.)
        this.elements = [];
        
        // Initialize puzzle elements from config
        this.initializeElements();
    }
    
    /**
     * Initialize puzzle elements from configuration
     */
    initializeElements() {
        if (this.config.elements) {
            this.config.elements.forEach(elementConfig => {
                const element = this.createElement(elementConfig);
                if (element) {
                    this.elements.push(element);
                }
            });
        }
    }
    
    /**
     * Create a puzzle element from configuration
     * Override in subclasses for specific element types
     */
    createElement(config) {
        return {
            id: config.id,
            type: config.type,
            x: config.x,
            y: config.y,
            width: config.width || 40,
            height: config.height || 40,
            state: 'inactive', // 'inactive', 'active', 'held'
            interactingPlayer: null,
            requiresContinuousInteraction: config.requiresContinuousInteraction || false
        };
    }
    
    /**
     * Activate the puzzle
     */
    activate() {
        this.isActive = true;
        this.visualState = 'active';
        console.log(`Puzzle ${this.type} activated`);
    }
    
    /**
     * Deactivate the puzzle
     */
    deactivate() {
        this.isActive = false;
        this.visualState = 'inactive';
        this.reset();
    }
    
    /**
     * Update puzzle state
     */
    update(deltaTime, players, gameEngine) {
        if (!this.isActive || this.isCompleted) return;
        
        // Update feedback timer
        if (this.feedbackTimer > 0) {
            this.feedbackTimer -= deltaTime;
        }
        
        // Update player interactions with puzzle elements
        this.updatePlayerInteractions(players);
        
        // Check puzzle state
        this.checkPuzzleState();
        
        // Update visual state
        this.updateVisualState();
        
        // Puzzle-specific update logic
        this.updatePuzzle(deltaTime, players, gameEngine);
    }
    
    /**
     * Update player interactions with puzzle elements
     */
    updatePlayerInteractions(players) {
        // Clear previous interactions
        this.interactingPlayers.clear();
        
        // Check each element for player interactions
        for (const element of this.elements) {
            element.interactingPlayer = null;
            element.state = 'inactive';
            
            // Check if any player is interacting with this element
            for (const player of players) {
                if (!player.isAlive) continue;
                
                if (this.isPlayerInteractingWithElement(player, element)) {
                    element.interactingPlayer = player;
                    element.state = element.requiresContinuousInteraction ? 'held' : 'active';
                    this.interactingPlayers.add(player.id);
                    break;
                }
            }
        }
    }
    
    /**
     * Check if a player is interacting with a puzzle element
     */
    isPlayerInteractingWithElement(player, element) {
        // Check if player is within interaction range
        const distance = Math.sqrt(
            Math.pow(player.x + player.width/2 - (element.x + element.width/2), 2) +
            Math.pow(player.y + player.height/2 - (element.y + element.height/2), 2)
        );
        
        return distance < 50; // Interaction range
    }
    
    /**
     * Check puzzle state and completion
     */
    checkPuzzleState() {
        const wasCompleted = this.isSolved;
        this.isSolved = this.checkSolutionCondition();
        
        // Trigger feedback if state changed
        if (this.isSolved !== wasCompleted) {
            this.feedbackTimer = this.feedbackDuration;
            
            if (this.isSolved) {
                this.onPuzzleSolved();
            } else {
                this.onPuzzleReset();
            }
        }
    }
    
    /**
     * Check if puzzle solution condition is met
     * Override in subclasses
     */
    checkSolutionCondition() {
        // Base implementation - all elements must be active
        return this.elements.every(element => element.state === 'active' || element.state === 'held');
    }
    
    /**
     * Update visual state based on puzzle progress
     */
    updateVisualState() {
        if (this.isCompleted) {
            this.visualState = 'solved';
        } else if (this.isSolved) {
            this.visualState = 'solving';
        } else if (this.interactingPlayers.size > 0) {
            this.visualState = 'active';
        } else {
            this.visualState = 'inactive';
        }
    }
    
    /**
     * Puzzle-specific update logic
     * Override in subclasses
     */
    updatePuzzle(deltaTime, players, gameEngine) {
        // Base implementation - override in subclasses
    }
    
    /**
     * Called when puzzle is solved
     */
    onPuzzleSolved() {
        console.log(`Puzzle ${this.type} solved!`);
        this.visualState = 'solving';
    }
    
    /**
     * Called when puzzle is reset (no longer solved)
     */
    onPuzzleReset() {
        console.log(`Puzzle ${this.type} reset`);
    }
    
    /**
     * Complete the puzzle permanently
     */
    complete() {
        if (this.isCompleted) return;
        
        this.isCompleted = true;
        this.isSolved = true;
        this.visualState = 'solved';
        console.log(`Puzzle ${this.type} completed!`);
        this.onPuzzleCompleted();
    }
    
    /**
     * Called when puzzle is permanently completed
     * Override in subclasses
     */
    onPuzzleCompleted() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Reset puzzle to initial state
     */
    reset() {
        this.isSolved = false;
        this.isCompleted = false;
        this.interactingPlayers.clear();
        this.feedbackTimer = 0;
        
        // Reset all elements
        for (const element of this.elements) {
            element.state = 'inactive';
            element.interactingPlayer = null;
        }
        
        this.onReset();
    }
    
    /**
     * Called when puzzle is reset
     * Override in subclasses
     */
    onReset() {
        // Base implementation - override in subclasses
    }
    
    /**
     * Render puzzle elements and visual feedback
     */
    render(ctx, spriteRenderer) {
        if (!this.isActive) return;
        
        // Render puzzle elements
        for (const element of this.elements) {
            this.renderElement(ctx, element);
        }
        
        // Render puzzle-specific content
        this.renderPuzzle(ctx, spriteRenderer);
        
        // Render visual feedback
        this.renderFeedback(ctx);
    }
    
    /**
     * Render a puzzle element
     */
    renderElement(ctx, element) {
        // Determine element color based on state
        let color;
        switch (element.state) {
            case 'active':
                color = '#00ff00';
                break;
            case 'held':
                color = '#ffff00';
                break;
            case 'inactive':
            default:
                color = '#666666';
                break;
        }
        
        // Render element
        ctx.fillStyle = color;
        ctx.fillRect(element.x, element.y, element.width, element.height);
        
        // Render element border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        
        // Render element label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(element.type.toUpperCase(), 
                    element.x + element.width / 2, 
                    element.y - 5);
        
        // Show interacting player
        if (element.interactingPlayer) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px monospace';
            ctx.fillText(element.interactingPlayer.id, 
                        element.x + element.width / 2, 
                        element.y + element.height + 15);
        }
        
        ctx.textAlign = 'left';
    }
    
    /**
     * Render puzzle-specific content
     * Override in subclasses
     */
    renderPuzzle(ctx, spriteRenderer) {
        // Base implementation - override in subclasses
    }
    
    /**
     * Render visual feedback
     */
    renderFeedback(ctx) {
        if (this.feedbackTimer <= 0) return;
        
        const alpha = this.feedbackTimer / this.feedbackDuration;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Render feedback based on visual state
        switch (this.visualState) {
            case 'solving':
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('PUZZLE SOLVED!', ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
                break;
                
            case 'active':
                // Show progress indicator
                const progress = this.interactingPlayers.size / this.requiredPlayers;
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`PROGRESS: ${Math.round(progress * 100)}%`, 
                            ctx.canvas.width / 2, ctx.canvas.height - 100);
                break;
        }
        
        ctx.restore();
        ctx.textAlign = 'left';
    }
    
    /**
     * Get puzzle status for UI display
     */
    getStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            isSolved: this.isSolved,
            isCompleted: this.isCompleted,
            interactingPlayers: Array.from(this.interactingPlayers),
            requiredPlayers: this.requiredPlayers,
            progress: this.interactingPlayers.size / this.requiredPlayers
        };
    }
}

/**
 * Dual Switch Puzzle for Level 3
 * Requires two players to simultaneously hold switches
 */
export class DualSwitchPuzzle extends Puzzle {
    constructor(config) {
        super('dual_switch', config);
        
        // Dual switch specific state
        this.holdTimer = 0;
        this.requiredHoldTime = config.requiredHoldTime || 3.0; // 3 seconds
        this.currentHoldTime = 0;
    }
    
    createElement(config) {
        const element = super.createElement(config);
        element.requiresContinuousInteraction = true;
        return element;
    }
    
    updatePuzzle(deltaTime, players, gameEngine) {
        // Check if both switches are being held
        const activeElements = this.elements.filter(element => element.state === 'held');
        
        if (activeElements.length >= 2) {
            // Both switches held - increment timer
            this.currentHoldTime += deltaTime;
            
            if (this.currentHoldTime >= this.requiredHoldTime && !this.isCompleted) {
                this.complete();
            }
        } else {
            // Not both switches held - reset timer
            this.currentHoldTime = 0;
        }
    }
    
    checkSolutionCondition() {
        // Puzzle is solved when both switches are held for required time
        return this.currentHoldTime >= this.requiredHoldTime;
    }
    
    renderPuzzle(ctx, spriteRenderer) {
        // Render connection between switches
        if (this.elements.length >= 2) {
            const switch1 = this.elements[0];
            const switch2 = this.elements[1];
            
            // Draw connection line
            ctx.strokeStyle = this.isSolved ? '#00ff00' : '#666666';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 10]);
            
            ctx.beginPath();
            ctx.moveTo(switch1.x + switch1.width / 2, switch1.y + switch1.height / 2);
            ctx.lineTo(switch2.x + switch2.width / 2, switch2.y + switch2.height / 2);
            ctx.stroke();
            
            ctx.setLineDash([]); // Reset line dash
        }
        
        // Render hold progress
        if (this.currentHoldTime > 0) {
            const progress = this.currentHoldTime / this.requiredHoldTime;
            const barWidth = 200;
            const barHeight = 20;
            const barX = ctx.canvas.width / 2 - barWidth / 2;
            const barY = ctx.canvas.height / 2 + 50;
            
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
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Hold both switches: ${Math.ceil(this.requiredHoldTime - this.currentHoldTime)}s`, 
                        ctx.canvas.width / 2, barY - 10);
            
            ctx.textAlign = 'left';
        }
    }
    
    onPuzzleCompleted() {
        console.log('Dual switch puzzle completed! Both players worked together.');
    }
}

/**
 * Hold Mechanism Puzzle for Level 4
 * Requires one player to permanently hold a mechanism while other advances
 */
export class HoldMechanismPuzzle extends Puzzle {
    constructor(config) {
        super('hold_mechanism', config);
        
        // Hold mechanism specific state
        this.sacrificePhase = false;
        this.sacrificeTimer = 0;
        this.sacrificeDelay = config.sacrificeDelay || 5.0; // 5 seconds to decide
        this.sacrificedPlayer = null;
        this.advancingPlayer = null;
        
        // Mechanism and exit door
        this.mechanism = null;
        this.exitDoor = null;
        
        this.initializeMechanismElements();
    }
    
    initializeMechanismElements() {
        // Create mechanism that must be held
        this.mechanism = {
            id: 'hold_mechanism',
            type: 'mechanism',
            x: this.config.mechanismX || 100,
            y: this.config.mechanismY || 300,
            width: 60,
            height: 60,
            state: 'inactive',
            interactingPlayer: null,
            requiresContinuousInteraction: true
        };
        
        // Create exit door that opens when mechanism is held
        this.exitDoor = {
            id: 'exit_door',
            type: 'door',
            x: this.config.doorX || 700,
            y: this.config.doorY || 250,
            width: 80,
            height: 100,
            state: 'closed', // 'closed', 'open'
            playersNear: []
        };
        
        this.elements = [this.mechanism];
    }
    
    updatePuzzle(deltaTime, players, gameEngine) {
        // Update mechanism state
        this.updateMechanism(players);
        
        // Update exit door state
        this.updateExitDoor(players);
        
        // Handle sacrifice phase
        if (this.sacrificePhase && !this.isCompleted) {
            this.updateSacrificePhase(deltaTime, players, gameEngine);
        }
    }
    
    updateMechanism(players) {
        this.mechanism.interactingPlayer = null;
        this.mechanism.state = 'inactive';
        
        // Check if any player is holding the mechanism
        for (const player of players) {
            if (!player.isAlive) continue;
            
            if (this.isPlayerInteractingWithElement(player, this.mechanism)) {
                this.mechanism.interactingPlayer = player;
                this.mechanism.state = 'held';
                break;
            }
        }
    }
    
    updateExitDoor(players) {
        // Door is open when mechanism is held
        this.exitDoor.state = this.mechanism.state === 'held' ? 'open' : 'closed';
        
        // Check which players are near the exit door
        this.exitDoor.playersNear = [];
        
        for (const player of players) {
            if (!player.isAlive) continue;
            
            const distance = Math.sqrt(
                Math.pow(player.x + player.width/2 - (this.exitDoor.x + this.exitDoor.width/2), 2) +
                Math.pow(player.y + player.height/2 - (this.exitDoor.y + this.exitDoor.height/2), 2)
            );
            
            if (distance < 60) {
                this.exitDoor.playersNear.push(player);
            }
        }
        
        // Check if sacrifice phase should begin
        if (!this.sacrificePhase && this.mechanism.state === 'held' && this.exitDoor.playersNear.length > 0) {
            // Make sure the player at the door is not the same as the one holding the mechanism
            const mechanismPlayer = this.mechanism.interactingPlayer;
            const doorPlayers = this.exitDoor.playersNear.filter(p => p.id !== mechanismPlayer.id);
            
            if (doorPlayers.length > 0) {
                this.startSacrificePhase();
            }
        }
    }
    
    startSacrificePhase() {
        if (this.sacrificePhase) return;
        
        console.log('Hold mechanism sacrifice phase started');
        this.sacrificePhase = true;
        this.sacrificeTimer = 0;
    }
    
    updateSacrificePhase(deltaTime, players, gameEngine) {
        this.sacrificeTimer += deltaTime;
        
        // Auto-complete sacrifice after delay
        if (this.sacrificeTimer >= this.sacrificeDelay) {
            this.completeSacrifice(gameEngine);
        }
    }
    
    completeSacrifice(gameEngine) {
        if (this.isCompleted) return;
        
        console.log('Completing hold mechanism sacrifice...');
        
        // The player holding the mechanism is sacrificed
        this.sacrificedPlayer = this.mechanism.interactingPlayer;
        
        // The player(s) near the door advance
        this.advancingPlayer = this.exitDoor.playersNear.find(p => p.id !== this.sacrificedPlayer.id);
        
        if (this.sacrificedPlayer) {
            console.log(`Player ${this.sacrificedPlayer.id} sacrificed themselves to hold the mechanism`);
            
            // Remove the sacrificed player
            this.sacrificedPlayer.isAlive = false;
            this.sacrificedPlayer.health = 0;
            
            // Create sacrifice effect
            this.createSacrificeEffect(this.sacrificedPlayer);
        }
        
        if (this.advancingPlayer) {
            console.log(`Player ${this.advancingPlayer.id} advances to the final level`);
        }
        
        // Complete the puzzle
        this.complete();
    }
    
    createSacrificeEffect(player) {
        // Create dramatic sacrifice effect
        const effect = {
            type: 'sacrifice',
            x: player.x + player.width / 2,
            y: player.y + player.height / 2,
            timeLeft: 4.0,
            maxTime: 4.0,
            message: 'FINAL SACRIFICE'
        };
        
        // Add to level effects if available
        const currentLevel = this.gameEngine?.getCurrentLevel();
        if (currentLevel && currentLevel.effects) {
            currentLevel.effects.push(effect);
        }
    }
    
    checkSolutionCondition() {
        // Puzzle is solved when sacrifice is completed
        return this.isCompleted;
    }
    
    renderPuzzle(ctx, spriteRenderer) {
        // Render mechanism
        this.renderMechanism(ctx);
        
        // Render exit door
        this.renderExitDoor(ctx);
        
        // Render sacrifice phase UI
        if (this.sacrificePhase && !this.isCompleted) {
            this.renderSacrificePhase(ctx);
        }
    }
    
    renderMechanism(ctx) {
        const mechanism = this.mechanism;
        
        // Mechanism color based on state
        const color = mechanism.state === 'held' ? '#ffff00' : '#666666';
        
        // Render mechanism body
        ctx.fillStyle = color;
        ctx.fillRect(mechanism.x, mechanism.y, mechanism.width, mechanism.height);
        
        // Mechanism border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(mechanism.x, mechanism.y, mechanism.width, mechanism.height);
        
        // Mechanism label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MECHANISM', mechanism.x + mechanism.width / 2, mechanism.y - 5);
        
        // Show interacting player
        if (mechanism.interactingPlayer) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '10px monospace';
            ctx.fillText(`${mechanism.interactingPlayer.id} HOLDING`, 
                        mechanism.x + mechanism.width / 2, 
                        mechanism.y + mechanism.height + 15);
        }
        
        ctx.textAlign = 'left';
    }
    
    renderExitDoor(ctx) {
        const door = this.exitDoor;
        
        // Door color based on state
        const color = door.state === 'open' ? '#00ff00' : '#aa0000';
        
        // Render door
        ctx.fillStyle = color;
        ctx.fillRect(door.x, door.y, door.width, door.height);
        
        // Door border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(door.x, door.y, door.width, door.height);
        
        // Door label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(door.state === 'open' ? 'EXIT OPEN' : 'EXIT CLOSED', 
                    door.x + door.width / 2, door.y - 5);
        
        // Show players near door
        if (door.playersNear.length > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.font = '10px monospace';
            door.playersNear.forEach((player, index) => {
                ctx.fillText(player.id, 
                            door.x + door.width / 2, 
                            door.y + door.height + 15 + (index * 12));
            });
        }
        
        ctx.textAlign = 'left';
    }
    
    renderSacrificePhase(ctx) {
        const timeLeft = Math.ceil(this.sacrificeDelay - this.sacrificeTimer);
        
        // Background overlay
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = 'rgba(100, 0, 0, 0.5)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
        
        // Sacrifice message
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SACRIFICE REQUIRED', ctx.canvas.width / 2, ctx.canvas.height / 2 - 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        ctx.fillText('One player must hold the mechanism permanently', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
        ctx.fillText('The other can escape through the door', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
        
        // Countdown
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`Decision in: ${timeLeft}s`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 20);
        
        // Show current situation
        if (this.mechanism.interactingPlayer) {
            ctx.fillStyle = '#ff6666';
            ctx.font = '16px monospace';
            ctx.fillText(`${this.mechanism.interactingPlayer.id} will be sacrificed`, 
                        ctx.canvas.width / 2, ctx.canvas.height / 2 + 60);
        }
        
        if (this.exitDoor.playersNear.length > 0) {
            const advancingPlayer = this.exitDoor.playersNear.find(p => 
                p.id !== this.mechanism.interactingPlayer?.id);
            if (advancingPlayer) {
                ctx.fillStyle = '#66ff66';
                ctx.fillText(`${advancingPlayer.id} will advance to Level 5`, 
                            ctx.canvas.width / 2, ctx.canvas.height / 2 + 80);
            }
        }
        
        ctx.textAlign = 'left';
    }
    
    onPuzzleCompleted() {
        console.log('Hold mechanism puzzle completed! Final sacrifice made.');
    }
}

/**
 * Puzzle Manager for handling multiple puzzles in a level
 */
export class PuzzleManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.puzzles = new Map();
        this.activePuzzle = null;
    }
    
    /**
     * Add a puzzle to the manager
     */
    addPuzzle(id, puzzle) {
        this.puzzles.set(id, puzzle);
        puzzle.gameEngine = this.gameEngine;
    }
    
    /**
     * Remove a puzzle from the manager
     */
    removePuzzle(id) {
        const puzzle = this.puzzles.get(id);
        if (puzzle) {
            puzzle.deactivate();
        }
        this.puzzles.delete(id);
    }
    
    /**
     * Activate a specific puzzle
     */
    activatePuzzle(id) {
        // Deactivate current puzzle
        if (this.activePuzzle) {
            this.activePuzzle.deactivate();
        }
        
        // Activate new puzzle
        const puzzle = this.puzzles.get(id);
        if (puzzle) {
            puzzle.activate();
            this.activePuzzle = puzzle;
            console.log(`Activated puzzle: ${id}`);
        }
    }
    
    /**
     * Get the currently active puzzle
     */
    getActivePuzzle() {
        return this.activePuzzle;
    }
    
    /**
     * Get a specific puzzle by ID
     */
    getPuzzle(id) {
        return this.puzzles.get(id);
    }
    
    /**
     * Update all puzzles
     */
    update(deltaTime, players) {
        for (const puzzle of this.puzzles.values()) {
            puzzle.update(deltaTime, players, this.gameEngine);
        }
    }
    
    /**
     * Render all active puzzles
     */
    render(ctx, spriteRenderer) {
        for (const puzzle of this.puzzles.values()) {
            if (puzzle.isActive) {
                puzzle.render(ctx, spriteRenderer);
            }
        }
    }
    
    /**
     * Check if any puzzle is completed
     */
    hasCompletedPuzzle() {
        for (const puzzle of this.puzzles.values()) {
            if (puzzle.isCompleted) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get all completed puzzles
     */
    getCompletedPuzzles() {
        return Array.from(this.puzzles.values()).filter(puzzle => puzzle.isCompleted);
    }
    
    /**
     * Reset all puzzles
     */
    reset() {
        for (const puzzle of this.puzzles.values()) {
            puzzle.reset();
        }
        this.activePuzzle = null;
    }
    
    /**
     * Clean up all puzzles
     */
    destroy() {
        for (const puzzle of this.puzzles.values()) {
            puzzle.deactivate();
        }
        this.puzzles.clear();
        this.activePuzzle = null;
    }
}