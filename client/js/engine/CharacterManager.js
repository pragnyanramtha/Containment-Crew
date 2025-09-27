export class CharacterManager {
    constructor() {
        this.characterTypes = this.initializeCharacterTypes();
        this.selectedCharacters = new Map(); // playerId -> characterType
    }
    
    initializeCharacterTypes() {
        return {
            warrior: {
                name: "Warrior",
                description: "Strong melee fighter with high health",
                strength: 3, // 3/3 - deals 3 damage per hit
                health: 6,   // 6/3 - 6 hearts (max health)
                speed: 1,    // 1/3 - slower movement
                color: '#ff4444',
                advantages: ["High damage", "Maximum health", "Tank role"],
                disadvantages: ["Slow movement", "Short range"]
            },
            
            scout: {
                name: "Scout",
                description: "Fast and agile with balanced stats",
                strength: 2, // 2/3 - deals 2 damage per hit
                health: 4,   // 4/3 - 4 hearts
                speed: 3,    // 3/3 - fastest movement
                color: '#44ff44',
                advantages: ["Fastest movement", "Good mobility", "Balanced stats"],
                disadvantages: ["Medium damage", "Medium health"]
            },
            
            medic: {
                name: "Medic",
                description: "Support character with healing abilities",
                strength: 1, // 1/3 - deals 1 damage per hit
                health: 5,   // 5/3 - 5 hearts
                speed: 2,    // 2/3 - normal speed
                color: '#4444ff',
                advantages: ["High health", "Healing abilities", "Support role"],
                disadvantages: ["Low damage", "Relies on team"]
            },
            
            engineer: {
                name: "Engineer",
                description: "Technical specialist with gadgets",
                strength: 2, // 2/3 - deals 2 damage per hit
                health: 3,   // 3/3 - 3 hearts (minimum)
                speed: 2,    // 2/3 - normal speed
                color: '#ffff44',
                advantages: ["Balanced stats", "Technical abilities", "Versatile"],
                disadvantages: ["Minimum health", "No specialization"]
            },
            
            berserker: {
                name: "Berserker",
                description: "Glass cannon with high damage but low health",
                strength: 3, // 3/3 - deals 3 damage per hit
                health: 3,   // 3/3 - 3 hearts (minimum)
                speed: 2,    // 2/3 - normal speed
                color: '#ff44ff',
                advantages: ["Maximum damage", "High risk/reward", "Aggressive"],
                disadvantages: ["Minimum health", "High risk"]
            }
        };
    }
    
    getCharacterType(characterKey) {
        return this.characterTypes[characterKey];
    }
    
    getAllCharacterTypes() {
        return this.characterTypes;
    }
    
    selectCharacter(playerId, characterKey) {
        if (this.characterTypes[characterKey]) {
            this.selectedCharacters.set(playerId, characterKey);
            return true;
        }
        return false;
    }
    
    getSelectedCharacter(playerId) {
        const characterKey = this.selectedCharacters.get(playerId);
        return characterKey ? this.characterTypes[characterKey] : null;
    }
    
    getSelectedCharacterKey(playerId) {
        return this.selectedCharacters.get(playerId);
    }
    
    applyCharacterStats(player, characterKey) {
        const character = this.characterTypes[characterKey];
        if (!character) return;
        
        // Apply character stats
        player.characterType = characterKey;
        player.strength = character.strength;
        player.maxHealth = character.health * 25; // 25 HP per heart (3-6 hearts = 75-150 HP)
        player.health = player.maxHealth;
        player.baseSpeed = 200 * (character.speed / 2); // Scale speed (1-3 -> 100-300 pixels/sec)
        player.speed = player.baseSpeed;
        player.color = character.color;
        
        // Add character-specific abilities
        player.characterAbilities = this.getCharacterAbilities(characterKey);
        
        console.log(`Applied ${character.name} stats to player ${player.id}:`, {
            strength: player.strength,
            health: player.health,
            speed: player.speed
        });
    }
    
    getCharacterAbilities(characterKey) {
        switch (characterKey) {
            case 'medic':
                return {
                    heal: {
                        cooldown: 10.0, // 10 seconds
                        amount: 50,     // 2 hearts worth
                        range: 100
                    }
                };
            case 'engineer':
                return {
                    repair: {
                        cooldown: 15.0,
                        effectiveness: 1.5
                    }
                };
            default:
                return {};
        }
    }
    
    // Character selection UI methods
    renderCharacterSelection(ctx, selectedCharacter = null) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT YOUR CHARACTER', centerX, 100);
        
        // Character cards
        const characters = Object.keys(this.characterTypes);
        const cardWidth = 200;
        const cardHeight = 300;
        const spacing = 220;
        const startX = centerX - (characters.length * spacing) / 2 + spacing / 2;
        
        characters.forEach((key, index) => {
            const character = this.characterTypes[key];
            const cardX = startX + index * spacing;
            const cardY = centerY - cardHeight / 2;
            
            // Card background
            const isSelected = selectedCharacter === key;
            ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)';
            ctx.fillRect(cardX - cardWidth/2, cardY, cardWidth, cardHeight);
            
            // Card border
            ctx.strokeStyle = isSelected ? '#ffff00' : '#ffffff';
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.strokeRect(cardX - cardWidth/2, cardY, cardWidth, cardHeight);
            
            // Character preview (colored square)
            ctx.fillStyle = character.color;
            ctx.fillRect(cardX - 30, cardY + 20, 60, 60);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(cardX - 30, cardY + 20, 60, 60);
            
            // Character name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px monospace';
            ctx.fillText(character.name, cardX, cardY + 110);
            
            // Stats
            ctx.font = '14px monospace';
            ctx.fillText(`STR: ${'♥'.repeat(character.strength)}`, cardX, cardY + 140);
            ctx.fillText(`HP:  ${'♥'.repeat(character.health)}`, cardX, cardY + 160);
            ctx.fillText(`SPD: ${'♥'.repeat(character.speed)}`, cardX, cardY + 180);
            
            // Description
            ctx.font = '12px monospace';
            ctx.fillStyle = '#cccccc';
            const words = character.description.split(' ');
            let line = '';
            let yOffset = 210;
            
            for (let word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > cardWidth - 20 && line !== '') {
                    ctx.fillText(line, cardX, cardY + yOffset);
                    line = word + ' ';
                    yOffset += 15;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, cardX, cardY + yOffset);
            
            // Number key hint
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px monospace';
            ctx.fillText(`Press ${index + 1}`, cardX, cardY + cardHeight - 10);
        });
        
        // Instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText('Use number keys 1-5 to select, ENTER to confirm', centerX, ctx.canvas.height - 50);
        
        ctx.textAlign = 'left';
    }
}