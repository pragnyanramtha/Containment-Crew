/**
 * SpriteLoader - Handles loading and creating all game sprites
 */
import { SpriteManager } from './SpriteManager.js';
import { OnlineSpriteLoader } from './OnlineSpriteLoader.js';

export class SpriteLoader {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;
        this.loadingPromises = [];
        this.onlineSpriteLoader = new OnlineSpriteLoader(spriteManager);
    }

    /**
     * Load all game sprites
     */
    async loadAllSprites() {
        console.log('Loading game sprites...');

        // Create player sprites
        this.createPlayerSprites();

        // Create animated player sprites
        this.createAnimatedPlayerSprites();

        // Create walking animation frames
        this.createWalkingAnimations();

        // Create enemy sprites
        this.createEnemySprites();

        // Create NPC sprites
        this.createNPCSprites();

        // Create UI sprites
        this.createUISprites();

        // Create effect sprites
        this.createEffectSprites();

        // Create power-up sprites
        this.createPowerUpSprites();

        // Try to load online sprites (non-blocking)
        try {
            await this.onlineSpriteLoader.loadFreeSprites();
        } catch (error) {
            console.warn('Failed to load online sprites:', error);
        }

        // Wait for any async loading to complete
        await Promise.all(this.loadingPromises);

        const spriteCount = this.spriteManager.sprites.size;
        console.log(`All sprites loaded successfully! Total sprites: ${spriteCount}`);

        // Log sprite names for debugging
        const spriteNames = Array.from(this.spriteManager.sprites.keys());
        console.log('Available sprites:', spriteNames.slice(0, 10), spriteNames.length > 10 ? '...' : '');
    }

    /**
     * Create humanoid player character sprites
     */
    createPlayerSprites() {
        // Scout character - fast, agile survivor
        this.createHumanoidSprite('player_scout', 32, 32, {
            skinTone: '#FFDBAC',
            hairColor: '#8B4513',
            shirtColor: '#228B22',
            pantsColor: '#2F4F4F',
            shoeColor: '#654321',
            characterType: 'scout'
        });

        // Tank character - heavily armored soldier
        this.createHumanoidSprite('player_tank', 36, 36, {
            skinTone: '#FFDBAC',
            hairColor: '#696969',
            shirtColor: '#4682B4',
            pantsColor: '#2F4F4F',
            shoeColor: '#000000',
            characterType: 'tank',
            hasArmor: true
        });

        // Medic character - medical professional
        this.createHumanoidSprite('player_medic', 32, 32, {
            skinTone: '#FFDBAC',
            hairColor: '#DAA520',
            shirtColor: '#FF6347',
            pantsColor: '#FFFFFF',
            shoeColor: '#FFFFFF',
            characterType: 'medic',
            hasMedicalGear: true
        });

        // Engineer character - technical specialist
        this.createHumanoidSprite('player_engineer', 32, 32, {
            skinTone: '#FFDBAC',
            hairColor: '#FF4500',
            shirtColor: '#FFD700',
            pantsColor: '#8B4513',
            shoeColor: '#654321',
            characterType: 'engineer',
            hasTools: true
        });
    }

    /**
     * Create enemy sprites
     */
    createEnemySprites() {
        // Weak zombie - small, green
        this.createZombieSprites('zombie_weak', 28, 28, '#44aa44', '#226622');

        // Normal zombie - medium, darker green
        this.createZombieSprites('zombie_normal', 32, 32, '#66aa66', '#338833');

        // Mutant boss - large, red
        this.createBossSprite('mutant_boss', 48, 48, '#aa4444', '#662222');
    }

    /**
     * Create humanoid zombie sprites with directional variants
     */
    createZombieSprites(baseName, width, height, bodyColor, borderColor) {
        const directions = ['up', 'down', 'left', 'right'];

        directions.forEach(direction => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = false;

            // Create zombie config based on type
            const zombieConfig = {
                skinTone: bodyColor,
                hairColor: '#2F2F2F',
                shirtColor: this.getDarkerColor(bodyColor),
                pantsColor: '#1a1a1a',
                shoeColor: '#000000',
                characterType: 'zombie',
                isZombie: true
            };

            // Draw humanoid zombie
            this.drawHumanoidCharacter(ctx, width, height, direction, zombieConfig);

            // Add zombie-specific features
            this.addZombieFeatures(ctx, width, height, direction, bodyColor);

            // Border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, width, height);

            const spriteName = `${baseName}_${direction}`;
            const sprite = {
                image: canvas,
                width: width,
                height: height,
                direction: direction
            };

            this.spriteManager.sprites.set(spriteName, sprite);
        });
    }

    /**
     * Add zombie-specific visual features
     */
    addZombieFeatures(ctx, width, height, direction, bodyColor) {
        const scale = Math.min(width, height) / 32;
        const centerX = width / 2;

        // Add torn clothing effects
        ctx.fillStyle = this.getDarkerColor(bodyColor);
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            ctx.fillRect(x, y, Math.round(2 * scale), Math.round(1 * scale));
        }

        // Add glowing red eyes
        ctx.fillStyle = '#ff0000';
        const headY = Math.round(2 * scale);
        const eyeSize = Math.max(1, Math.round(1 * scale));

        switch (direction) {
            case 'down':
                ctx.fillRect(centerX - Math.round(2 * scale), headY + Math.round(3 * scale), eyeSize, eyeSize);
                ctx.fillRect(centerX + Math.round(1 * scale), headY + Math.round(3 * scale), eyeSize, eyeSize);
                break;
            case 'left':
            case 'right':
                const eyeX = direction === 'left' ? centerX - Math.round(2 * scale) : centerX + Math.round(1 * scale);
                ctx.fillRect(eyeX, headY + Math.round(3 * scale), eyeSize, eyeSize);
                break;
        }

        // Add shambling posture indicators
        ctx.fillStyle = '#666666';
        if (direction === 'down' || direction === 'up') {
            // Slouched shoulders
            ctx.fillRect(centerX - Math.round(4 * scale), Math.round(12 * scale), Math.round(2 * scale), Math.round(1 * scale));
            ctx.fillRect(centerX + Math.round(2 * scale), Math.round(12 * scale), Math.round(2 * scale), Math.round(1 * scale));
        }
    }

    /**
     * Get a darker version of a color for clothing effects
     */
    getDarkerColor(color) {
        // Simple color darkening - convert hex to darker version
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
            const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
            const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    /**
     * Create boss sprite
     */
    createBossSprite(baseName, width, height, bodyColor, borderColor) {
        const directions = ['up', 'down', 'left', 'right'];

        directions.forEach(direction => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = false;

            // Boss body (larger, more detailed)
            ctx.fillStyle = bodyColor;
            ctx.fillRect(1, 1, width - 2, height - 2);

            // Boss features
            ctx.fillStyle = '#ff0000';

            // Large glowing eyes
            const eyeSize = width / 8;
            ctx.fillRect(width * 0.25, height * 0.25, eyeSize, eyeSize);
            ctx.fillRect(width * 0.75 - eyeSize, height * 0.25, eyeSize, eyeSize);

            // Menacing mouth
            ctx.fillRect(width * 0.3, height * 0.6, width * 0.4, eyeSize);

            // Claws/spikes
            ctx.fillStyle = '#ffaa00';
            for (let i = 0; i < 4; i++) {
                const spikeX = (width / 5) * (i + 1);
                ctx.fillRect(spikeX - 1, 0, 2, 6);
                ctx.fillRect(spikeX - 1, height - 6, 2, 6);
            }

            // Direction indicator (more aggressive)
            ctx.fillStyle = '#ffffff';
            const centerX = width / 2;
            const centerY = height / 2;

            switch (direction) {
                case 'up':
                    // Upward spikes
                    ctx.fillRect(centerX - 2, 6, 4, 8);
                    ctx.fillRect(centerX - 4, 6, 8, 3);
                    break;
                case 'down':
                    // Downward spikes
                    ctx.fillRect(centerX - 2, height - 14, 4, 8);
                    ctx.fillRect(centerX - 4, height - 9, 8, 3);
                    break;
                case 'left':
                    // Left claws
                    ctx.fillRect(6, centerY - 2, 8, 4);
                    ctx.fillRect(6, centerY - 4, 3, 8);
                    break;
                case 'right':
                    // Right claws
                    ctx.fillRect(width - 14, centerY - 2, 8, 4);
                    ctx.fillRect(width - 9, centerY - 4, 3, 8);
                    break;
            }

            // Thick border
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, width, height);

            const spriteName = `${baseName}_${direction}`;
            const sprite = {
                image: canvas,
                width: width,
                height: height,
                direction: direction
            };

            this.spriteManager.sprites.set(spriteName, sprite);
        });
    }

    /**
     * Create NPC sprites
     */
    createNPCSprites() {
        // Story NPC - distinctive appearance
        this.createNPCSprite('npc_story', 64, 64, '#ffaa00', '#cc8800');

        // Generic NPC
        this.createNPCSprite('npc_generic', 48, 48, '#aaaaff', '#8888cc');
    }

    /**
     * Create individual humanoid NPC sprite
     */
    createNPCSprite(name, width, height, bodyColor, borderColor) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;

        // Create NPC config based on type
        let npcConfig;
        if (name.includes('story')) {
            // Dr. Petrov - dying scientist
            npcConfig = {
                skinTone: '#FFDBAC',
                hairColor: '#C0C0C0', // Gray hair
                shirtColor: '#FFFFFF', // Lab coat
                pantsColor: '#2F4F4F',
                shoeColor: '#000000',
                characterType: 'scientist',
                hasLabCoat: true
            };
        } else {
            // Generic NPC
            npcConfig = {
                skinTone: '#FFDBAC',
                hairColor: '#8B4513',
                shirtColor: bodyColor,
                pantsColor: '#2F4F4F',
                shoeColor: '#654321',
                characterType: 'civilian'
            };
        }

        // Draw humanoid NPC (facing down by default)
        this.drawHumanoidCharacter(ctx, width, height, 'down', npcConfig);

        // Add NPC-specific features
        this.addNPCFeatures(ctx, width, height, npcConfig, borderColor);

        const sprite = {
            image: canvas,
            width: width,
            height: height
        };

        this.spriteManager.sprites.set(name, sprite);
    }

    /**
     * Add NPC-specific visual features
     */
    addNPCFeatures(ctx, width, height, config, borderColor) {
        const scale = Math.min(width, height) / 32;

        // Add speech indicator (small bubble)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(width - Math.round(8 * scale), Math.round(8 * scale), Math.round(4 * scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // "..." in speech bubble
        ctx.fillStyle = '#000000';
        ctx.font = `${Math.round(6 * scale)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('...', width - Math.round(8 * scale), Math.round(10 * scale));

        // Add character-specific details
        if (config.hasLabCoat) {
            // Add lab coat details
            ctx.fillStyle = '#E0E0E0';
            const coatX = width / 2 - Math.round(3 * scale);
            const coatY = Math.round(14 * scale);
            ctx.fillRect(coatX, coatY, Math.round(6 * scale), Math.round(2 * scale)); // Coat collar

            // Add stethoscope or medical equipment
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(coatX + Math.round(1 * scale), coatY + Math.round(3 * scale), Math.round(1 * scale), Math.round(4 * scale));
        }

        // Add friendly expression enhancement
        ctx.fillStyle = '#000000';
        const headY = Math.round(2 * scale);
        const centerX = width / 2;

        // Enhanced eyes with pupils
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(centerX - Math.round(2 * scale), headY + Math.round(3 * scale), Math.round(2 * scale), Math.round(2 * scale));
        ctx.fillRect(centerX + Math.round(1 * scale), headY + Math.round(3 * scale), Math.round(2 * scale), Math.round(2 * scale));

        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - Math.round(1 * scale), headY + Math.round(3 * scale), 1, 1);
        ctx.fillRect(centerX + Math.round(2 * scale), headY + Math.round(3 * scale), 1, 1);
    }

    /**
     * Create UI sprites
     */
    createUISprites() {
        // Health heart - full
        this.createHeartSprite('heart_full', '#ff0000');

        // Health heart - empty
        this.createHeartSprite('heart_empty', '#666666');

        // Health heart - half
        this.createHeartSprite('heart_half', '#ff8888');

        // Interaction prompt
        this.createInteractionSprite();
    }

    /**
     * Create heart sprite for health display
     */
    createHeartSprite(name, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;

        // Draw heart shape
        ctx.fillStyle = color;

        // Heart shape using rectangles (pixel art style)
        const heart = [
            [0, 0, 1, 1, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ];

        for (let y = 0; y < heart.length; y++) {
            for (let x = 0; x < heart[y].length; x++) {
                if (heart[y][x]) {
                    ctx.fillRect(x * 2, y * 2, 2, 2);
                }
            }
        }

        const sprite = {
            image: canvas,
            width: 16,
            height: 16
        };

        this.spriteManager.sprites.set(name, sprite);
    }

    /**
     * Create interaction prompt sprite
     */
    createInteractionSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, 32, 16);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 32, 16);

        // "E" key indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('E', 16, 12);

        const sprite = {
            image: canvas,
            width: 32,
            height: 16
        };

        this.spriteManager.sprites.set('interaction_prompt', sprite);
    }

    /**
     * Create effect sprites
     */
    createEffectSprites() {
        // Attack effect
        this.createEffectSprite('attack_effect', 24, 24, '#ffff44');

        // Damage effect
        this.createEffectSprite('damage_effect', 20, 20, '#ff4444');

        // Heal effect
        this.createEffectSprite('heal_effect', 20, 20, '#44ff44');
    }

    /**
     * Create effect sprite
     */
    createEffectSprite(name, width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;

        // Create starburst effect
        ctx.fillStyle = color;

        const centerX = width / 2;
        const centerY = height / 2;
        const rays = 8;

        for (let i = 0; i < rays; i++) {
            const angle = (Math.PI * 2 * i) / rays;
            const rayLength = width * 0.4;

            const x1 = centerX + Math.cos(angle) * 2;
            const y1 = centerY + Math.sin(angle) * 2;
            const x2 = centerX + Math.cos(angle) * rayLength;
            const y2 = centerY + Math.sin(angle) * rayLength;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.stroke();
        }

        // Center circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();

        const sprite = {
            image: canvas,
            width: width,
            height: height
        };

        this.spriteManager.sprites.set(name, sprite);
    }

    /**
     * Create animated character sprites with idle animation
     */
    createAnimatedPlayerSprites() {
        const characterTypes = ['scout', 'tank', 'medic', 'engineer'];
        const colors = [
            { body: '#00ff00', indicator: '#ffffff', border: '#004400' }, // Scout - Green
            { body: '#0088ff', indicator: '#ffffff', border: '#004488' }, // Tank - Blue
            { body: '#ff8800', indicator: '#ffffff', border: '#884400' }, // Medic - Orange
            { body: '#ffff00', indicator: '#000000', border: '#888800' }  // Engineer - Yellow
        ];

        characterTypes.forEach((type, index) => {
            const color = colors[index];
            this.createAnimatedCharacterSprites(`player_${type}`, 32, 32, color, type);
        });
    }

    /**
     * Create animated character sprites with breathing/idle animation
     */
    createAnimatedCharacterSprites(baseName, width, height, colors, characterType) {
        const directions = ['up', 'down', 'left', 'right'];

        directions.forEach(direction => {
            // Create 2 frames for idle animation
            for (let frame = 0; frame < 2; frame++) {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                ctx.imageSmoothingEnabled = false;

                // Slight size variation for breathing effect
                const sizeOffset = frame === 0 ? 0 : 1;
                const bodyWidth = width - 8 + sizeOffset;
                const bodyHeight = height - 8 + sizeOffset;
                const offsetX = (width - bodyWidth) / 2;
                const offsetY = (height - bodyHeight) / 2;

                // Character body
                ctx.fillStyle = colors.body;
                ctx.fillRect(offsetX, offsetY, bodyWidth, bodyHeight);

                // Character-specific details
                this.addCharacterDetails(ctx, width, height, characterType, colors, offsetX, offsetY);

                // Direction indicator
                ctx.fillStyle = colors.indicator;
                const centerX = width / 2;
                const centerY = height / 2;

                switch (direction) {
                    case 'up':
                        ctx.fillRect(centerX - 2, 6, 4, 8);
                        ctx.fillRect(centerX - 4, 6, 8, 2);
                        break;
                    case 'down':
                        ctx.fillRect(centerX - 2, height - 14, 4, 8);
                        ctx.fillRect(centerX - 4, height - 8, 8, 2);
                        break;
                    case 'left':
                        ctx.fillRect(6, centerY - 2, 8, 4);
                        ctx.fillRect(6, centerY - 4, 2, 8);
                        break;
                    case 'right':
                        ctx.fillRect(width - 14, centerY - 2, 8, 4);
                        ctx.fillRect(width - 8, centerY - 4, 2, 8);
                        break;
                }

                // Border
                ctx.strokeStyle = colors.border;
                ctx.lineWidth = 1;
                ctx.strokeRect(0, 0, width, height);

                const spriteName = frame === 0 ? `${baseName}_${direction}` : `${baseName}_${direction}_idle`;
                const sprite = {
                    image: canvas,
                    width: width,
                    height: height,
                    direction: direction,
                    frame: frame
                };

                this.spriteManager.sprites.set(spriteName, sprite);
            }
        });
    }

    /**
     * Add character-specific visual details
     */
    addCharacterDetails(ctx, width, height, characterType, colors, offsetX, offsetY) {
        switch (characterType) {
            case 'scout':
                // Add speed lines
                ctx.fillStyle = colors.indicator;
                ctx.fillRect(offsetX + 2, offsetY + height / 3, 4, 2);
                ctx.fillRect(offsetX + width - 8, offsetY + height / 3, 4, 2);
                break;

            case 'tank':
                // Add armor plating
                ctx.fillStyle = colors.border;
                ctx.fillRect(offsetX + 2, offsetY + 2, width - 12, 2);
                ctx.fillRect(offsetX + 2, offsetY + height - 6, width - 12, 2);
                break;

            case 'medic':
                // Add medical cross
                ctx.fillStyle = '#ffffff';
                const crossSize = 3;
                const crossX = offsetX + width / 2 - 6;
                const crossY = offsetY + height / 2 - 6;
                ctx.fillRect(crossX, crossY - crossSize, crossSize, crossSize * 3);
                ctx.fillRect(crossX - crossSize, crossY, crossSize * 3, crossSize);
                break;

            case 'engineer':
                // Add tool belt
                ctx.fillStyle = '#666666';
                ctx.fillRect(offsetX + 2, offsetY + height - 8, width - 12, 3);
                // Add small tools
                ctx.fillStyle = colors.indicator;
                ctx.fillRect(offsetX + 4, offsetY + height - 7, 2, 1);
                ctx.fillRect(offsetX + width - 8, offsetY + height - 7, 2, 1);
                break;
        }
    }

    /**
     * Create detailed humanoid sprite with body parts and equipment
     */
    createHumanoidSprite(baseName, width, height, config) {
        const directions = ['up', 'down', 'left', 'right'];

        directions.forEach(direction => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.imageSmoothingEnabled = false;

            // Draw humanoid character
            this.drawHumanoidCharacter(ctx, width, height, direction, config);

            const spriteName = `${baseName}_${direction}`;
            const sprite = {
                image: canvas,
                width: width,
                height: height,
                direction: direction,
                characterType: config.characterType
            };

            this.spriteManager.sprites.set(spriteName, sprite);
        });
    }

    /**
     * Draw a detailed humanoid character with body parts
     */
    drawHumanoidCharacter(ctx, width, height, direction, config) {
        const centerX = width / 2;
        const centerY = height / 2;

        // Character proportions (scaled to sprite size)
        const scale = Math.min(width, height) / 32;
        const headSize = Math.round(8 * scale);
        const bodyWidth = Math.round(6 * scale);
        const bodyHeight = Math.round(10 * scale);
        const armWidth = Math.round(3 * scale);
        const armLength = Math.round(8 * scale);
        const legWidth = Math.round(3 * scale);
        const legLength = Math.round(10 * scale);

        // Position calculations
        const headX = centerX - headSize / 2;
        const headY = Math.round(2 * scale);
        const bodyX = centerX - bodyWidth / 2;
        const bodyY = headY + headSize;
        const legY = bodyY + bodyHeight;

        // Draw character based on direction
        switch (direction) {
            case 'down': // Front view
                this.drawHumanoidFront(ctx, {
                    headX, headY, headSize,
                    bodyX, bodyY, bodyWidth, bodyHeight,
                    legY, legWidth, legLength,
                    armWidth, armLength,
                    centerX, centerY, scale
                }, config);
                break;

            case 'up': // Back view
                this.drawHumanoidBack(ctx, {
                    headX, headY, headSize,
                    bodyX, bodyY, bodyWidth, bodyHeight,
                    legY, legWidth, legLength,
                    armWidth, armLength,
                    centerX, centerY, scale
                }, config);
                break;

            case 'left': // Left side view
                this.drawHumanoidSide(ctx, {
                    headX, headY, headSize,
                    bodyX, bodyY, bodyWidth, bodyHeight,
                    legY, legWidth, legLength,
                    armWidth, armLength,
                    centerX, centerY, scale
                }, config, 'left');
                break;

            case 'right': // Right side view
                this.drawHumanoidSide(ctx, {
                    headX, headY, headSize,
                    bodyX, bodyY, bodyWidth, bodyHeight,
                    legY, legWidth, legLength,
                    armWidth, armLength,
                    centerX, centerY, scale
                }, config, 'right');
                break;
        }

        // Add character-specific equipment
        this.addCharacterEquipment(ctx, width, height, direction, config, scale);
    }

    /**
     * Draw humanoid character facing forward
     */
    drawHumanoidFront(ctx, dims, config) {
        const { headX, headY, headSize, bodyX, bodyY, bodyWidth, bodyHeight,
            legY, legWidth, legLength, armWidth, armLength, centerX, scale } = dims;

        // Draw legs
        ctx.fillStyle = config.pantsColor;
        ctx.fillRect(centerX - legWidth - 1, legY, legWidth, legLength); // Left leg
        ctx.fillRect(centerX + 1, legY, legWidth, legLength); // Right leg

        // Draw shoes
        ctx.fillStyle = config.shoeColor;
        ctx.fillRect(centerX - legWidth - 1, legY + legLength - 2, legWidth, 2); // Left shoe
        ctx.fillRect(centerX + 1, legY + legLength - 2, legWidth, 2); // Right shoe

        // Draw arms
        ctx.fillStyle = config.shirtColor;
        ctx.fillRect(bodyX - armWidth, bodyY + 2, armWidth, armLength); // Left arm
        ctx.fillRect(bodyX + bodyWidth, bodyY + 2, armWidth, armLength); // Right arm

        // Draw hands
        ctx.fillStyle = config.skinTone;
        ctx.fillRect(bodyX - armWidth, bodyY + armLength - 2, armWidth, 3); // Left hand
        ctx.fillRect(bodyX + bodyWidth, bodyY + armLength - 2, armWidth, 3); // Right hand

        // Draw body/torso
        ctx.fillStyle = config.shirtColor;
        ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

        // Draw head
        ctx.fillStyle = config.skinTone;
        ctx.fillRect(headX, headY, headSize, headSize);

        // Draw hair
        ctx.fillStyle = config.hairColor;
        ctx.fillRect(headX, headY, headSize, Math.round(3 * scale)); // Hair on top
        ctx.fillRect(headX, headY, Math.round(2 * scale), Math.round(5 * scale)); // Left side
        ctx.fillRect(headX + headSize - Math.round(2 * scale), headY, Math.round(2 * scale), Math.round(5 * scale)); // Right side

        // Draw face
        ctx.fillStyle = '#000000';
        // Eyes
        ctx.fillRect(headX + Math.round(2 * scale), headY + Math.round(3 * scale), 1, 1); // Left eye
        ctx.fillRect(headX + headSize - Math.round(3 * scale), headY + Math.round(3 * scale), 1, 1); // Right eye
        // Mouth
        ctx.fillRect(headX + Math.round(3 * scale), headY + Math.round(5 * scale), Math.round(2 * scale), 1);
    }

    /**
     * Draw humanoid character facing backward
     */
    drawHumanoidBack(ctx, dims, config) {
        const { headX, headY, headSize, bodyX, bodyY, bodyWidth, bodyHeight,
            legY, legWidth, legLength, armWidth, armLength, centerX, scale } = dims;

        // Draw legs
        ctx.fillStyle = config.pantsColor;
        ctx.fillRect(centerX - legWidth - 1, legY, legWidth, legLength); // Left leg
        ctx.fillRect(centerX + 1, legY, legWidth, legLength); // Right leg

        // Draw shoes
        ctx.fillStyle = config.shoeColor;
        ctx.fillRect(centerX - legWidth - 1, legY + legLength - 2, legWidth, 2); // Left shoe
        ctx.fillRect(centerX + 1, legY + legLength - 2, legWidth, 2); // Right shoe

        // Draw arms
        ctx.fillStyle = config.shirtColor;
        ctx.fillRect(bodyX - armWidth, bodyY + 2, armWidth, armLength); // Left arm
        ctx.fillRect(bodyX + bodyWidth, bodyY + 2, armWidth, armLength); // Right arm

        // Draw body/torso
        ctx.fillStyle = config.shirtColor;
        ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

        // Draw head (back of head)
        ctx.fillStyle = config.skinTone;
        ctx.fillRect(headX, headY, headSize, headSize);

        // Draw hair (back of head)
        ctx.fillStyle = config.hairColor;
        ctx.fillRect(headX, headY, headSize, Math.round(4 * scale)); // Hair on back
    }

    /**
     * Draw humanoid character from side view
     */
    drawHumanoidSide(ctx, dims, config, side) {
        const { headX, headY, headSize, bodyX, bodyY, bodyWidth, bodyHeight,
            legY, legWidth, legLength, armWidth, armLength, centerX, scale } = dims;

        const isLeft = side === 'left';
        const armOffset = isLeft ? -armWidth : bodyWidth;
        const legOffset = isLeft ? -1 : 1;

        // Draw legs (side view - one leg visible)
        ctx.fillStyle = config.pantsColor;
        ctx.fillRect(centerX + legOffset, legY, legWidth, legLength);

        // Draw shoes
        ctx.fillStyle = config.shoeColor;
        ctx.fillRect(centerX + legOffset, legY + legLength - 2, legWidth + 1, 2);

        // Draw arm
        ctx.fillStyle = config.shirtColor;
        ctx.fillRect(bodyX + armOffset, bodyY + 2, armWidth, armLength);

        // Draw hand
        ctx.fillStyle = config.skinTone;
        ctx.fillRect(bodyX + armOffset, bodyY + armLength - 2, armWidth, 3);

        // Draw body/torso
        ctx.fillStyle = config.shirtColor;
        ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight);

        // Draw head (profile)
        ctx.fillStyle = config.skinTone;
        ctx.fillRect(headX, headY, headSize, headSize);

        // Draw hair (side profile)
        ctx.fillStyle = config.hairColor;
        ctx.fillRect(headX, headY, headSize, Math.round(3 * scale));
        if (isLeft) {
            ctx.fillRect(headX, headY, Math.round(2 * scale), Math.round(6 * scale));
        } else {
            ctx.fillRect(headX + headSize - Math.round(2 * scale), headY, Math.round(2 * scale), Math.round(6 * scale));
        }

        // Draw face (profile)
        ctx.fillStyle = '#000000';
        // Eye
        const eyeX = isLeft ? headX + Math.round(2 * scale) : headX + headSize - Math.round(3 * scale);
        ctx.fillRect(eyeX, headY + Math.round(3 * scale), 1, 1);
        // Nose
        const noseX = isLeft ? headX + headSize - 1 : headX;
        ctx.fillRect(noseX, headY + Math.round(4 * scale), 1, 1);
    }

    /**
     * Add character-specific equipment and details
     */
    addCharacterEquipment(ctx, width, height, direction, config, scale) {
        const centerX = width / 2;
        const centerY = height / 2;

        switch (config.characterType) {
            case 'scout':
                // Add backpack and utility belt
                if (direction === 'up') {
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(centerX - Math.round(3 * scale), Math.round(12 * scale), Math.round(6 * scale), Math.round(4 * scale));
                }
                // Add utility belt
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(centerX - Math.round(3 * scale), Math.round(18 * scale), Math.round(6 * scale), Math.round(2 * scale));
                break;

            case 'tank':
                if (config.hasArmor) {
                    // Add armor plating
                    ctx.fillStyle = '#708090';
                    // Chest armor
                    ctx.fillRect(centerX - Math.round(4 * scale), Math.round(14 * scale), Math.round(8 * scale), Math.round(6 * scale));
                    // Shoulder pads
                    if (direction === 'down' || direction === 'up') {
                        ctx.fillRect(centerX - Math.round(6 * scale), Math.round(12 * scale), Math.round(3 * scale), Math.round(3 * scale));
                        ctx.fillRect(centerX + Math.round(3 * scale), Math.round(12 * scale), Math.round(3 * scale), Math.round(3 * scale));
                    }
                }
                break;

            case 'medic':
                if (config.hasMedicalGear) {
                    // Add medical cross on chest
                    ctx.fillStyle = '#FF0000';
                    const crossSize = Math.round(2 * scale);
                    const crossX = centerX - crossSize / 2;
                    const crossY = Math.round(16 * scale);
                    ctx.fillRect(crossX, crossY - crossSize, crossSize, crossSize * 3);
                    ctx.fillRect(crossX - crossSize, crossY, crossSize * 3, crossSize);

                    // Add medical bag
                    if (direction === 'left' || direction === 'right') {
                        ctx.fillStyle = '#FFFFFF';
                        const bagX = direction === 'left' ? centerX - Math.round(8 * scale) : centerX + Math.round(4 * scale);
                        ctx.fillRect(bagX, Math.round(16 * scale), Math.round(4 * scale), Math.round(3 * scale));
                    }
                }
                break;

            case 'engineer':
                if (config.hasTools) {
                    // Add tool belt
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(centerX - Math.round(4 * scale), Math.round(18 * scale), Math.round(8 * scale), Math.round(2 * scale));

                    // Add tools on belt
                    ctx.fillStyle = '#C0C0C0';
                    ctx.fillRect(centerX - Math.round(2 * scale), Math.round(19 * scale), Math.round(1 * scale), Math.round(3 * scale)); // Screwdriver
                    ctx.fillRect(centerX + Math.round(1 * scale), Math.round(19 * scale), Math.round(1 * scale), Math.round(3 * scale)); // Wrench

                    // Add hard hat (if facing up or down)
                    if (direction === 'down' || direction === 'up') {
                        ctx.fillStyle = '#FFD700';
                        ctx.fillRect(centerX - Math.round(4 * scale), Math.round(2 * scale), Math.round(8 * scale), Math.round(3 * scale));
                    }
                }
                break;
        }
    }    /**
  
   * Create walking animation frames for humanoid characters
     */
    createWalkingAnimations() {
        const characterTypes = ['scout', 'tank', 'medic', 'engineer'];
        const directions = ['up', 'down', 'left', 'right'];

        characterTypes.forEach(type => {
            directions.forEach(direction => {
                // Create 2 walking frames for each direction
                for (let frame = 0; frame < 2; frame++) {
                    const baseName = `player_${type}`;
                    const animName = `${baseName}_walk_${direction}_${frame}`;

                    // Get the base sprite config
                    const config = this.getCharacterConfig(type);

                    // Create walking frame with slight variations
                    const canvas = document.createElement('canvas');
                    canvas.width = type === 'tank' ? 36 : 32;
                    canvas.height = type === 'tank' ? 36 : 32;
                    const ctx = canvas.getContext('2d');

                    ctx.imageSmoothingEnabled = false;

                    // Apply walking animation offset
                    const walkOffset = frame === 0 ? 0 : 1;
                    this.drawWalkingFrame(ctx, canvas.width, canvas.height, direction, config, walkOffset);

                    const sprite = {
                        image: canvas,
                        width: canvas.width,
                        height: canvas.height,
                        direction: direction,
                        frame: frame,
                        characterType: type
                    };

                    this.spriteManager.sprites.set(animName, sprite);
                }
            });
        });
    }

    /**
     * Get character configuration for sprite creation
     */
    getCharacterConfig(type) {
        const configs = {
            scout: {
                skinTone: '#FFDBAC',
                hairColor: '#8B4513',
                shirtColor: '#228B22',
                pantsColor: '#2F4F4F',
                shoeColor: '#654321',
                characterType: 'scout'
            },
            tank: {
                skinTone: '#FFDBAC',
                hairColor: '#696969',
                shirtColor: '#4682B4',
                pantsColor: '#2F4F4F',
                shoeColor: '#000000',
                characterType: 'tank',
                hasArmor: true
            },
            medic: {
                skinTone: '#FFDBAC',
                hairColor: '#DAA520',
                shirtColor: '#FF6347',
                pantsColor: '#FFFFFF',
                shoeColor: '#FFFFFF',
                characterType: 'medic',
                hasMedicalGear: true
            },
            engineer: {
                skinTone: '#FFDBAC',
                hairColor: '#FF4500',
                shirtColor: '#FFD700',
                pantsColor: '#8B4513',
                shoeColor: '#654321',
                characterType: 'engineer',
                hasTools: true
            }
        };

        return configs[type] || configs.scout;
    }

    /**
     * Draw walking animation frame with leg movement
     */
    drawWalkingFrame(ctx, width, height, direction, config, walkOffset) {
        // Draw base character
        this.drawHumanoidCharacter(ctx, width, height, direction, config);

        // Add walking animation by slightly adjusting leg positions
        const scale = Math.min(width, height) / 32;
        const centerX = width / 2;
        const legY = Math.round(22 * scale);
        const legWidth = Math.round(3 * scale);
        const legLength = Math.round(10 * scale);

        // Redraw legs with walking offset
        ctx.fillStyle = config.pantsColor;

        switch (direction) {
            case 'down':
            case 'up':
                // Alternate leg positions for walking
                const leftLegOffset = walkOffset === 0 ? 0 : 1;
                const rightLegOffset = walkOffset === 0 ? 1 : 0;

                ctx.fillRect(centerX - legWidth - 1, legY + leftLegOffset, legWidth, legLength - leftLegOffset);
                ctx.fillRect(centerX + 1, legY + rightLegOffset, legWidth, legLength - rightLegOffset);
                break;

            case 'left':
            case 'right':
                // Side walking - show leg movement
                const legOffset = walkOffset === 0 ? 0 : 2;
                ctx.fillRect(centerX - 1, legY, legWidth + legOffset, legLength);
                break;
        }

        // Redraw shoes
        ctx.fillStyle = config.shoeColor;
        switch (direction) {
            case 'down':
            case 'up':
                const leftShoeOffset = walkOffset === 0 ? 0 : 1;
                const rightShoeOffset = walkOffset === 0 ? 1 : 0;

                ctx.fillRect(centerX - legWidth - 1, legY + legLength - 2 + leftShoeOffset, legWidth, 2);
                ctx.fillRect(centerX + 1, legY + legLength - 2 + rightShoeOffset, legWidth, 2);
                break;

            case 'left':
            case 'right':
                const shoeOffset = walkOffset === 0 ? 0 : 2;
                ctx.fillRect(centerX - 1, legY + legLength - 2, legWidth + shoeOffset + 1, 2);
                break;
        }
    }

    /**
     * Create power-up sprites
     */
    createPowerUpSprites() {
        // Super Attack power-up
        this.createPowerUpSprite('powerup_super_attack', 32, 32, '#ff4444', '⚡');

        // Super Speed power-up
        this.createPowerUpSprite('powerup_super_speed', 32, 32, '#44ff44', '💨');

        // Health Boost power-up
        this.createPowerUpSprite('powerup_health_boost', 32, 32, '#ff8844', '❤️');

        // Shield power-up
        this.createPowerUpSprite('powerup_shield', 32, 32, '#4488ff', '🛡️');

        // Multi Shot power-up
        this.createPowerUpSprite('powerup_multi_shot', 32, 32, '#ff44ff', '🎯');

        // Time Slow power-up
        this.createPowerUpSprite('powerup_time_slow', 32, 32, '#44ffff', '⏰');
    }

/**
 * Create individual power-up sprite
 */
createPowerUpSprite(name, width, height, color, icon) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    // Glow effect background
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
    );
    gradient.addColorStop(0, color + '80'); // Semi-transparent
    gradient.addColorStop(0.7, color + '40');
    gradient.addColorStop(1, color + '00'); // Fully transparent

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Main power-up body
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, width - 8, height - 8);

    // Inner highlight
    ctx.fillStyle = this.getLighterColor(color);
    ctx.fillRect(6, 6, width - 12, height - 12);

    // Core
    ctx.fillStyle = color;
    ctx.fillRect(8, 8, width - 16, height - 16);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Icon (simplified for pixel art)
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(width * 0.5)}px monospace`;
    ctx.textAlign = 'center';

    // Draw simplified icon based on type
    switch (icon) {
        case '⚡': // Lightning for super attack
            this.drawLightning(ctx, width / 2, height / 2, width * 0.3);
            break;
        case '💨': // Speed lines for super speed
            this.drawSpeedLines(ctx, width, height);
            break;
        case '❤️': // Heart for health
            this.drawHeart(ctx, width / 2, height / 2, width * 0.25);
            break;
        case '🛡️': // Shield
            this.drawShield(ctx, width / 2, height / 2, width * 0.3);
            break;
        case '🎯': // Target for multi-shot
            this.drawTarget(ctx, width / 2, height / 2, width * 0.25);
            break;
        case '⏰': // Clock for time slow
            this.drawClock(ctx, width / 2, height / 2, width * 0.25);
            break;
        default:
            ctx.fillText('?', width / 2, height / 2 + 4);
    }

    const sprite = {
        image: canvas,
        width: width,
        height: height
    };

    this.spriteManager.sprites.set(name, sprite);
}

/**
 * Draw lightning bolt icon
 */
drawLightning(ctx, x, y, size) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - size / 3, y - size);
    ctx.lineTo(x + size / 6, y - size / 3);
    ctx.lineTo(x - size / 6, y - size / 3);
    ctx.lineTo(x + size / 3, y + size);
    ctx.lineTo(x - size / 6, y + size / 3);
    ctx.lineTo(x + size / 6, y + size / 3);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw speed lines icon
 */
drawSpeedLines(ctx, width, height) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(width * 0.2, height * 0.3, width * 0.4, 2);
    ctx.fillRect(width * 0.3, height * 0.5, width * 0.5, 2);
    ctx.fillRect(width * 0.2, height * 0.7, width * 0.4, 2);
}

/**
 * Draw heart icon
 */
drawHeart(ctx, x, y, size) {
    ctx.fillStyle = '#ffffff';
    // Simple heart shape using rectangles
    ctx.fillRect(x - size, y - size / 2, size * 0.8, size);
    ctx.fillRect(x + size * 0.2, y - size / 2, size * 0.8, size);
    ctx.fillRect(x - size * 0.6, y, size * 1.2, size);

    // Heart point
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x - size * 0.6, y + size * 0.4);
    ctx.lineTo(x + size * 0.6, y + size * 0.4);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw shield icon
 */
drawShield(ctx, x, y, size) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.8, y - size * 0.3);
    ctx.lineTo(x + size * 0.8, y + size * 0.5);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.8, y + size * 0.5);
    ctx.lineTo(x - size * 0.8, y - size * 0.3);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw target icon
 */
drawTarget(ctx, x, y, size) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw clock icon
 */
drawClock(ctx, x, y, size) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();

    // Clock hands
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y - size * 0.7, 2, size * 0.7); // Hour hand
    ctx.fillRect(x - 1, y - size * 0.5, 2, size * 0.5); // Minute hand
}

    /**
     * Get a lighter version of a color
     */
    getLighterColor(color) {
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + 60);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + 60);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + 60);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
        return color;
    }
}