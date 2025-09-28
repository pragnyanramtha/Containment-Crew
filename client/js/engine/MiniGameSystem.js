/**
 * MiniGameSystem - Fun mini-games and puzzles to make levels more engaging
 */
export class MiniGameSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.activeMiniGame = null;
        this.miniGameTimer = 0;
        this.miniGameResults = new Map();
    }

    startMiniGame(type, config = {}) {
        switch (type) {
            case 'memory_sequence':
                this.activeMiniGame = new MemorySequenceGame(config);
                break;
            case 'wire_puzzle':
                this.activeMiniGame = new WirePuzzleGame(config);
                break;
            case 'reactor_calibration':
                this.activeMiniGame = new ReactorCalibrationGame(config);
                break;
            case 'code_breaking':
                this.activeMiniGame = new CodeBreakingGame(config);
                break;
        }

        if (this.activeMiniGame) {
            this.miniGameTimer = 0;
            console.log(`Started mini-game: ${type}`);
        }
    }

    update(deltaTime, players) {
        if (!this.activeMiniGame) return;

        this.miniGameTimer += deltaTime;
        this.activeMiniGame.update(deltaTime, players);

        // Check if mini-game is complete
        if (this.activeMiniGame.isComplete()) {
            const result = this.activeMiniGame.getResult();
            this.miniGameResults.set(this.activeMiniGame.type, result);
            console.log(`Mini-game completed: ${this.activeMiniGame.type}, Success: ${result.success}`);
            this.activeMiniGame = null;
        }
    }

    render(ctx) {
        if (this.activeMiniGame) {
            this.activeMiniGame.render(ctx);
        }
    }

    handleInput(key, players) {
        if (this.activeMiniGame) {
            return this.activeMiniGame.handleInput(key, players);
        }
        return false;
    }

    isActive() {
        return this.activeMiniGame !== null;
    }
}

/**
 * Memory Sequence Mini-Game
 */
class MemorySequenceGame {
    constructor(config) {
        this.type = 'memory_sequence';
        this.sequence = this.generateSequence(config.length || 6);
        this.playerSequence = [];
        this.showingSequence = true;
        this.sequenceIndex = 0;
        this.sequenceTimer = 0;
        this.complete = false;
        this.success = false;
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        this.positions = [
            { x: 300, y: 200 }, { x: 400, y: 200 }, { x: 500, y: 200 },
            { x: 300, y: 300 }, { x: 400, y: 300 }, { x: 500, y: 300 }
        ];
    }

    generateSequence(length) {
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(Math.floor(Math.random() * 6));
        }
        return sequence;
    }

    update(deltaTime, players) {
        if (this.showingSequence) {
            this.sequenceTimer += deltaTime;
            if (this.sequenceTimer >= 1.0) {
                this.sequenceTimer = 0;
                this.sequenceIndex++;
                if (this.sequenceIndex >= this.sequence.length) {
                    this.showingSequence = false;
                    this.sequenceIndex = 0;
                }
            }
        }
    }

    handleInput(key, players) {
        if (this.showingSequence || this.complete) return false;

        let buttonIndex = -1;
        switch (key) {
            case '1': buttonIndex = 0; break;
            case '2': buttonIndex = 1; break;
            case '3': buttonIndex = 2; break;
            case '4': buttonIndex = 3; break;
            case '5': buttonIndex = 4; break;
            case '6': buttonIndex = 5; break;
        }

        if (buttonIndex >= 0) {
            this.playerSequence.push(buttonIndex);

            // Check if correct so far
            if (this.playerSequence[this.playerSequence.length - 1] !== this.sequence[this.playerSequence.length - 1]) {
                // Wrong! Reset
                this.playerSequence = [];
                return true;
            }

            // Check if complete
            if (this.playerSequence.length === this.sequence.length) {
                this.success = true;
                this.complete = true;
            }

            return true;
        }

        return false;
    }

    render(ctx) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(200, 150, 400, 300);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Memory Sequence', 400, 180);

        // Instructions
        ctx.font = '12px monospace';
        if (this.showingSequence) {
            ctx.fillText('Watch the sequence...', 400, 200);
        } else {
            ctx.fillText('Repeat the sequence using keys 1-6', 400, 200);
        }

        // Buttons
        for (let i = 0; i < 6; i++) {
            const pos = this.positions[i];
            let color = this.colors[i];

            // Highlight if showing sequence
            if (this.showingSequence && this.sequenceIndex < this.sequence.length && this.sequence[this.sequenceIndex] === i) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = color;
            }

            ctx.fillRect(pos.x, pos.y, 40, 40);

            // Button number
            ctx.fillStyle = '#000000';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText((i + 1).toString(), pos.x + 20, pos.y + 25);
        }

        // Progress
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Progress: ${this.playerSequence.length} of ${this.sequence.length}`, 400, 420);

        if (this.complete) {
            ctx.fillStyle = this.success ? '#00ff00' : '#ff0000';
            ctx.font = '16px monospace';
            ctx.fillText(this.success ? 'SUCCESS!' : 'FAILED!', 400, 440);
        }
    }

    isComplete() {
        return this.complete;
    }

    getResult() {
        return {
            success: this.success,
            attempts: 1,
            timeSpent: this.sequenceTimer
        };
    }
}

/**
 * Wire Puzzle Mini-Game
 */
class WirePuzzleGame {
    constructor(config) {
        this.type = 'wire_puzzle';
        this.wires = this.generateWires(config.wireCount || 8);
        this.connections = new Map();
        this.complete = false;
        this.success = false;
        this.selectedWire = null;
    }

    generateWires(count) {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
        const leftWires = [];
        const rightWires = [];

        for (let i = 0; i < count; i++) {
            leftWires.push({ id: i, color: colors[i], x: 250, y: 200 + i * 30 });
            rightWires.push({ id: i, color: colors[i], x: 550, y: 200 + Math.random() * 200 });
        }

        // Shuffle right wires
        for (let i = rightWires.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rightWires[i], rightWires[j]] = [rightWires[j], rightWires[i]];
        }

        return { left: leftWires, right: rightWires };
    }

    update(deltaTime, players) {
        // Check if puzzle is solved
        if (this.connections.size === this.wires.left.length) {
            this.success = true;
            for (const [leftId, rightId] of this.connections) {
                if (this.wires.left[leftId].color !== this.wires.right.find(w => w.id === rightId).color) {
                    this.success = false;
                    break;
                }
            }
            this.complete = true;
        }
    }

    handleInput(key, players) {
        // This would be handled by mouse clicks in a real implementation
        return false;
    }

    render(ctx) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(200, 150, 400, 300);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Wire Puzzle', 400, 180);

        // Instructions
        ctx.font = '12px monospace';
        ctx.fillText('Connect wires of the same color', 400, 200);

        // Draw wires
        for (const wire of this.wires.left) {
            ctx.fillStyle = wire.color;
            ctx.fillRect(wire.x, wire.y, 20, 10);
        }

        for (const wire of this.wires.right) {
            ctx.fillStyle = wire.color;
            ctx.fillRect(wire.x, wire.y, 20, 10);
        }

        // Draw connections
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (const [leftId, rightId] of this.connections) {
            const leftWire = this.wires.left[leftId];
            const rightWire = this.wires.right.find(w => w.id === rightId);

            ctx.beginPath();
            ctx.moveTo(leftWire.x + 20, leftWire.y + 5);
            ctx.lineTo(rightWire.x, rightWire.y + 5);
            ctx.stroke();
        }

        if (this.complete) {
            ctx.fillStyle = this.success ? '#00ff00' : '#ff0000';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.success ? 'WIRES CONNECTED!' : 'INCORRECT CONNECTIONS!', 400, 420);
        }
    }

    isComplete() {
        return this.complete;
    }

    getResult() {
        return {
            success: this.success,
            connections: this.connections.size,
            correctConnections: Array.from(this.connections).filter(([leftId, rightId]) =>
                this.wires.left[leftId].color === this.wires.right.find(w => w.id === rightId).color
            ).length
        };
    }
}

/**
 * Reactor Calibration Mini-Game
 */
class ReactorCalibrationGame {
    constructor(config) {
        this.type = 'reactor_calibration';
        this.targetValues = [50, 75, 25, 90]; // Target values for 4 dials
        this.currentValues = [0, 0, 0, 0];
        this.selectedDial = 0;
        this.complete = false;
        this.success = false;
        this.tolerance = 5; // How close values need to be
    }

    update(deltaTime, players) {
        // Check if all dials are within tolerance
        let allCorrect = true;
        for (let i = 0; i < this.targetValues.length; i++) {
            if (Math.abs(this.currentValues[i] - this.targetValues[i]) > this.tolerance) {
                allCorrect = false;
                break;
            }
        }

        if (allCorrect) {
            this.success = true;
            this.complete = true;
        }
    }

    handleInput(key, players) {
        switch (key) {
            case 'ArrowLeft':
                this.selectedDial = Math.max(0, this.selectedDial - 1);
                return true;
            case 'ArrowRight':
                this.selectedDial = Math.min(3, this.selectedDial + 1);
                return true;
            case 'ArrowUp':
                this.currentValues[this.selectedDial] = Math.min(100, this.currentValues[this.selectedDial] + 5);
                return true;
            case 'ArrowDown':
                this.currentValues[this.selectedDial] = Math.max(0, this.currentValues[this.selectedDial] - 5);
                return true;
        }
        return false;
    }

    render(ctx) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(200, 150, 400, 300);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Reactor Calibration', 400, 180);

        // Instructions
        ctx.font = '12px monospace';
        ctx.fillText('Use arrow keys to adjust dials to target values', 400, 200);

        // Draw dials
        for (let i = 0; i < 4; i++) {
            const x = 250 + i * 80;
            const y = 250;

            // Dial background
            ctx.fillStyle = i === this.selectedDial ? '#444444' : '#222222';
            ctx.fillRect(x, y, 60, 100);

            // Target line
            const targetPercent = this.targetValues[i] / 100;
            const targetY = y + 80 - (targetPercent * 80);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, targetY);
            ctx.lineTo(x + 60, targetY);
            ctx.stroke();

            // Current value bar
            const currentPercent = this.currentValues[i] / 100;
            const currentHeight = currentPercent * 80;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(x + 10, y + 80 - currentHeight, 40, currentHeight);

            // Values
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`T:${this.targetValues[i]}`, x + 30, y + 95);
            ctx.fillText(`C:${this.currentValues[i]}`, x + 30, y + 105);

            // Selection indicator
            if (i === this.selectedDial) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 2, y - 2, 64, 104);
            }
        }

        if (this.complete) {
            ctx.fillStyle = this.success ? '#00ff00' : '#ff0000';
            ctx.font = '16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.success ? 'REACTOR CALIBRATED!' : 'CALIBRATION FAILED!', 400, 420);
        }
    }

    isComplete() {
        return this.complete;
    }

    getResult() {
        const accuracyScores = this.currentValues.map((val, i) => {
            return Math.max(0, 100 - Math.abs(val - this.targetValues[i]));
        });
        const totalAccuracy = accuracyScores.reduce((a, b) => a + b, 0);
        const averageAccuracy = totalAccuracy / 4;

        return {
            success: this.success,
            accuracy: averageAccuracy
        };
    }
}