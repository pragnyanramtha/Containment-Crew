/**
 * OnlineSpriteLoader - Loads sprites from online sources
 */
export class OnlineSpriteLoader {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;
        this.onlineSprites = {
            // Character sprites from online sources
            player_sprites: [
                'https://opengameart.org/sites/default/files/hero_0.png',
                'https://opengameart.org/sites/default/files/rogue_0.png'
            ],
            
            // Enemy sprites
            enemy_sprites: [
                'https://opengameart.org/sites/default/files/zombie_0.png',
                'https://opengameart.org/sites/default/files/skeleton_0.png'
            ],
            
            // UI elements
            ui_sprites: [
                'https://opengameart.org/sites/default/files/heart_0.png'
            ]
        };
    }

    /**
     * Load sprites from online sources
     */
    async loadOnlineSprites() {
        const loadPromises = [];

        // Try to load player sprites
        for (let i = 0; i < this.onlineSprites.player_sprites.length; i++) {
            const url = this.onlineSprites.player_sprites[i];
            const spriteName = `online_player_${i}`;
            
            loadPromises.push(
                this.loadSpriteFromURL(spriteName, url).catch(error => {
                    console.warn(`Failed to load online sprite ${spriteName}:`, error);
                    return null;
                })
            );
        }

        // Try to load enemy sprites
        for (let i = 0; i < this.onlineSprites.enemy_sprites.length; i++) {
            const url = this.onlineSprites.enemy_sprites[i];
            const spriteName = `online_enemy_${i}`;
            
            loadPromises.push(
                this.loadSpriteFromURL(spriteName, url).catch(error => {
                    console.warn(`Failed to load online sprite ${spriteName}:`, error);
                    return null;
                })
            );
        }

        // Wait for all loading attempts
        const results = await Promise.all(loadPromises);
        const successCount = results.filter(result => result !== null).length;
        
        console.log(`Loaded ${successCount} online sprites successfully`);
        return successCount;
    }

    /**
     * Load a single sprite from URL
     */
    async loadSpriteFromURL(name, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Handle CORS
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const sprite = {
                    image: img,
                    width: img.width,
                    height: img.height,
                    source: 'online'
                };
                
                this.spriteManager.sprites.set(name, sprite);
                console.log(`Loaded online sprite: ${name} (${img.width}x${img.height})`);
                resolve(sprite);
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load sprite from ${url}`));
            };
            
            // Set timeout for loading
            setTimeout(() => {
                if (!img.complete) {
                    reject(new Error(`Timeout loading sprite from ${url}`));
                }
            }, 5000);
            
            img.src = url;
        });
    }

    /**
     * Load sprites from free sprite resources
     */
    async loadFreeSprites() {
        const freeSprites = [
            // Humanoid character sprites from OpenGameArt
            {
                name: 'humanoid_warrior',
                url: 'https://opengameart.org/sites/default/files/warrior_m.png'
            },
            {
                name: 'humanoid_mage',
                url: 'https://opengameart.org/sites/default/files/mage_f.png'
            },
            {
                name: 'humanoid_rogue',
                url: 'https://opengameart.org/sites/default/files/rogue_m.png'
            },
            // Alternative sources for humanoid sprites
            {
                name: 'pixel_character_1',
                url: 'https://raw.githubusercontent.com/GrafxKid/sprites/master/characters/char_blue.png'
            },
            {
                name: 'pixel_character_2',
                url: 'https://raw.githubusercontent.com/GrafxKid/sprites/master/characters/char_green.png'
            }
        ];

        const loadPromises = freeSprites.map(sprite => 
            this.loadSpriteFromURL(sprite.name, sprite.url).catch(error => {
                console.warn(`Failed to load free sprite ${sprite.name}:`, error);
                return null;
            })
        );

        const results = await Promise.all(loadPromises);
        const successCount = results.filter(result => result !== null).length;
        
        console.log(`Loaded ${successCount} free humanoid sprites successfully`);
        return successCount;
    }
}