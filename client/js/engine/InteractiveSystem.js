/**
 * InteractiveSystem - Handles interactive objects, puzzles, and environmental elements
 */
export class InteractiveSystem {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.interactiveObjects = new Map();
        this.puzzles = new Map();
        this.secrets = new Map();
        this.playerInteractions = new Map();
    }

    /**
     * Register an interactive object
     */
    registerObject(id, config) {
        const obj = {
            id: id,
            x: config.x,
            y: config.y,
            width: config.width || 40,
            height: config.height || 40,
            type: config.type,
            interactionRadius: config.interactionRadius || 60,
            isActive: config.isActive !== false,
            requiresKey: config.requiresKey || false,
            keyItem: config.keyItem || null,
            onInteract: config.onInteract || null,
            visualState: config.visualState || 'normal',
            message: config.message || '',
            cooldown: 0,
            maxCooldown: config.cooldown || 0
        };

        this.interactiveObjects.set(id, obj);
        return obj;
    }

    /**
     * Create fun interactive elements for levels
     */
    createLevelInteractives(levelNumber) {
        switch (levelNumber) {
            case 0:
                this.createTutorialInteractives();
                break;
            case 1:
                this.createCombatInteractives();
                break;
            case 2:
                this.createBossInteractives();
                break;
            case 3:
                this.createPuzzleInteractives();
                break;
            case 4:
                this.createSacrificeInteractives();
                break;
            case 5:
                this.createFinalInteractives();
                break;
        }
    }

    createTutorialInteractives() {
        // Hidden supply cache
        this.registerObject('secret_cache', {
            x: 750, y: 500,
            type: 'supply_cache',
            message: "Hidden supply cache! Contains extra medical supplies.",
            onInteract: (player) => {
                player.health = Math.min(player.maxHealth, player.health + 25);
                return "You found medical supplies! Health restored.";
            }
        });

        // Computer terminal with facility map
        this.registerObject('facility_map', {
            x: 400, y: 100,
            type: 'computer',
            message: "Facility layout downloaded to your device.",
            onInteract: () => "Facility map acquired! You now know the layout."
        });

        // Emergency phone
        this.registerObject('emergency_phone', {
            x: 200, y: 400,
            type: 'phone',
            message: "All circuits are busy. The outside world doesn't know what's happening here.",
            onInteract: () => "No signal. You're on your own."
        });
    }

    createCombatInteractives() {
        // Weapon cache
        this.registerObject('weapon_cache', {
            x: 600, y: 300,
            type: 'weapons',
            message: "Military weapons cache. Increases attack damage.",
            onInteract: (player) => {
                player.strength += 1;
                return "Weapon acquired! Attack damage increased.";
            }
        });

        // Radiation detector
        this.registerObject('rad_detector', {
            x: 300, y: 200,
            type: 'detector',
            message: "Portable radiation detector. Warns of dangerous areas.",
            onInteract: () => "Radiation detector acquired! Dangerous areas now visible."
        });

        // Emergency barricade controls
        this.registerObject('barricade_controls', {
            x: 100, y: 450,
            type: 'controls',
            message: "Emergency barricades can slow down enemies.",
            cooldown: 10.0,
            onInteract: () => {
                // Spawn temporary barriers
                return "Emergency barricades deployed!";
            }
        });
    }

    createBossInteractives() {
        // Power generator
        this.registerObject('power_generator', {
            x: 200, y: 200,
            type: 'generator',
            message: "Backup power generator. Can overload to damage enemies.",
            cooldown: 15.0,
            onInteract: () => {
                // Create electrical damage area
                return "Generator overloaded! Electrical field created.";
            }
        });

        // Security cameras
        this.registerObject('security_system', {
            x: 500, y: 100,
            type: 'cameras',
            message: "Security system shows enemy positions.",
            onInteract: () => "Enemy positions revealed on your map."
        });

        // Chemical storage
        this.registerObject('chemical_storage', {
            x: 650, y: 450,
            type: 'chemicals',
            message: "Hazardous chemicals. Can create toxic clouds.",
            onInteract: () => "Toxic cloud deployed! Enemies will take damage."
        });
    }

    createPuzzleInteractives() {
        // Color-coded switches
        for (let i = 0; i < 4; i++) {
            this.registerObject(`color_switch_${i}`, {
                x: 150 + i * 150, y: 300,
                type: 'switch',
                color: ['red', 'blue', 'green', 'yellow'][i],
                message: `${['Red', 'Blue', 'Green', 'Yellow'][i]} switch. Part of the puzzle.`,
                onInteract: (player) => this.handleColorSwitch(i, player)
            });
        }

        // Puzzle hint terminal
        this.registerObject('puzzle_hint', {
            x: 400, y: 150,
            type: 'hint_terminal',
            message: "Puzzle hint: The colors must match the emergency protocol sequence.",
            onInteract: () => "Hint: Red, Green, Blue, Yellow - the order of emergency protocols."
        });
    }

    createSacrificeInteractives() {
        // Memorial wall
        this.registerObject('memorial_wall', {
            x: 100, y: 200,
            type: 'memorial',
            message: "Memorial wall for facility workers. Their sacrifice won't be forgotten.",
            onInteract: () => "You pay respects to those who came before."
        });

        // Personal belongings
        this.registerObject('personal_items', {
            x: 600, y: 350,
            type: 'belongings',
            message: "Personal belongings left behind. A reminder of what you're fighting for.",
            onInteract: () => "Family photos and personal items. The weight of responsibility grows heavier."
        });
    }

    createFinalInteractives() {
        // Reactor monitoring station
        this.registerObject('reactor_monitor', {
            x: 300, y: 200,
            type: 'monitor',
            message: "Reactor status: CRITICAL. Temperature rising rapidly.",
            onInteract: () => "Reactor core temperature: 2847°C and climbing. Time is running out."
        });

        // Emergency communication
        this.registerObject('final_radio', {
            x: 500, y: 400,
            type: 'radio',
            message: "Final transmission to the outside world.",
            onInteract: () => "Message sent: 'Reactor shutdown in progress. Remember our sacrifice.'"
        });
    }

    /**
     * Update interactive system
     */
    update(deltaTime, players) {
        // Update cooldowns
        for (const obj of this.interactiveObjects.values()) {
            if (obj.cooldown > 0) {
                obj.cooldown -= deltaTime;
            }
        }

        // Check for player interactions
        this.checkPlayerInteractions(players);
    }

    checkPlayerInteractions(players) {
        for (const player of players) {
            if (!player.isAlive) continue;

            for (const obj of this.interactiveObjects.values()) {
                if (!obj.isActive || obj.cooldown > 0) continue;

                const distance = Math.sqrt(
                    Math.pow(player.x - obj.x, 2) + Math.pow(player.y - obj.y, 2)
                );

                if (distance < obj.interactionRadius) {
                    // Show interaction prompt
                    this.showInteractionPrompt(obj, player);
                }
            }
        }
    }

    showInteractionPrompt(obj, player) {
        // This would integrate with the UI system to show "Press E to interact"
        console.log(`Near ${obj.type}: ${obj.message}`);
    }

    /**
     * Handle player interaction with object
     */
    interact(objectId, player) {
        const obj = this.interactiveObjects.get(objectId);
        if (!obj || !obj.isActive || obj.cooldown > 0) return null;

        // Check requirements
        if (obj.requiresKey && !player.hasItem(obj.keyItem)) {
            return `You need ${obj.keyItem} to interact with this.`;
        }

        // Execute interaction
        let result = obj.message;
        if (obj.onInteract) {
            result = obj.onInteract(player) || result;
        }

        // Set cooldown
        if (obj.maxCooldown > 0) {
            obj.cooldown = obj.maxCooldown;
        }

        // Track interaction
        if (!this.playerInteractions.has(player.id)) {
            this.playerInteractions.set(player.id, new Set());
        }
        this.playerInteractions.get(player.id).add(objectId);

        return result;
    }

    handleColorSwitch(switchIndex, player) {
        // Puzzle logic for color switches
        const puzzle = this.puzzles.get('color_sequence') || { sequence: [], target: [0, 2, 1, 3] };
        
        puzzle.sequence.push(switchIndex);
        
        if (puzzle.sequence.length > puzzle.target.length) {
            puzzle.sequence = [switchIndex]; // Reset if too long
        }

        this.puzzles.set('color_sequence', puzzle);

        // Check if puzzle is solved
        if (puzzle.sequence.length === puzzle.target.length) {
            const solved = puzzle.sequence.every((val, index) => val === puzzle.target[index]);
            if (solved) {
                return "Puzzle solved! The door unlocks.";
            } else {
                puzzle.sequence = []; // Reset on failure
                return "Incorrect sequence. Puzzle reset.";
            }
        }

        return `Switch activated. Sequence: ${puzzle.sequence.length}/${puzzle.target.length}`;
    }

    /**
     * Render interactive objects
     */
    render(ctx) {
        for (const obj of this.interactiveObjects.values()) {
            if (!obj.isActive) continue;

            this.renderObject(ctx, obj);
        }
    }

    renderObject(ctx, obj) {
        ctx.save();

        // Dim if on cooldown
        if (obj.cooldown > 0) {
            ctx.globalAlpha = 0.5;
        }

        // Render based on type
        switch (obj.type) {
            case 'supply_cache':
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, obj.height - 10);
                break;

            case 'computer':
                ctx.fillStyle = '#333333';
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(obj.x + 5, obj.y + 5, obj.width - 10, obj.height - 15);
                break;

            case 'weapons':
                ctx.fillStyle = '#666666';
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(obj.x + 10, obj.y + 10, obj.width - 20, 5);
                break;

            case 'switch':
                const switchColor = obj.color || 'gray';
                ctx.fillStyle = switchColor;
                ctx.beginPath();
                ctx.arc(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                // Generic interactive object
                ctx.fillStyle = '#888888';
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
                break;
        }

        ctx.restore();
    }
}