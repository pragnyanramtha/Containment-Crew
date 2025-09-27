export class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loadingPromises = new Map();
    }
    
    async loadSprite(name, imagePath) {
        // Return existing promise if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        // Return existing sprite if already loaded
        if (this.sprites.has(name)) {
            return this.sprites.get(name);
        }
        
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const sprite = {
                    image: img,
                    width: img.width,
                    height: img.height
                };
                this.sprites.set(name, sprite);
                this.loadingPromises.delete(name);
                resolve(sprite);
            };
            img.onerror = () => {
                this.loadingPromises.delete(name);
                reject(new Error(`Failed to load sprite: ${imagePath}`));
            };
            img.src = imagePath;
        });
        
        this.loadingPromises.set(name, loadPromise);
        return loadPromise;
    }
    
    getSprite(name) {
        return this.sprites.get(name);
    }
    
    hasSprite(name) {
        return this.sprites.has(name);
    }
    
    // Create a simple colored rectangle sprite for testing
    createColorSprite(name, width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Disable smoothing for pixel art
        ctx.imageSmoothingEnabled = false;
        
        // Fill with color
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        // Add border for visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        const sprite = {
            image: canvas,
            width: width,
            height: height
        };
        
        this.sprites.set(name, sprite);
        return sprite;
    }
    
    // Create directional sprites for a character
    createDirectionalSprites(baseName, width, height, colors) {
        const directions = ['up', 'down', 'left', 'right'];
        const sprites = {};
        
        directions.forEach(direction => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            ctx.imageSmoothingEnabled = false;
            
            // Base character body
            ctx.fillStyle = colors.body || '#00ff00';
            ctx.fillRect(4, 4, width - 8, height - 8);
            
            // Direction indicator
            ctx.fillStyle = colors.indicator || '#ffffff';
            const centerX = width / 2;
            const centerY = height / 2;
            
            switch (direction) {
                case 'up':
                    // Arrow pointing up
                    ctx.fillRect(centerX - 2, 6, 4, 8);
                    ctx.fillRect(centerX - 4, 6, 8, 2);
                    break;
                case 'down':
                    // Arrow pointing down
                    ctx.fillRect(centerX - 2, height - 14, 4, 8);
                    ctx.fillRect(centerX - 4, height - 8, 8, 2);
                    break;
                case 'left':
                    // Arrow pointing left
                    ctx.fillRect(6, centerY - 2, 8, 4);
                    ctx.fillRect(6, centerY - 4, 2, 8);
                    break;
                case 'right':
                    // Arrow pointing right
                    ctx.fillRect(width - 14, centerY - 2, 8, 4);
                    ctx.fillRect(width - 8, centerY - 4, 2, 8);
                    break;
            }
            
            // Border
            ctx.strokeStyle = colors.border || '#333333';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, width, height);
            
            const spriteName = `${baseName}_${direction}`;
            const sprite = {
                image: canvas,
                width: width,
                height: height,
                direction: direction
            };
            
            this.sprites.set(spriteName, sprite);
            sprites[direction] = sprite;
        });
        
        return sprites;
    }
}

export class AnimationManager {
    constructor() {
        this.animations = new Map();
    }
    
    createAnimation(name, frames, frameTime = 0.2) {
        const animation = {
            name: name,
            frames: frames,
            frameTime: frameTime,
            totalTime: frames.length * frameTime,
            loop: true
        };
        
        this.animations.set(name, animation);
        return animation;
    }
    
    getAnimation(name) {
        return this.animations.get(name);
    }
    
    getCurrentFrame(animationName, currentTime) {
        const animation = this.animations.get(animationName);
        if (!animation) return null;
        
        const normalizedTime = animation.loop ? 
            currentTime % animation.totalTime : 
            Math.min(currentTime, animation.totalTime);
        
        const frameIndex = Math.floor(normalizedTime / animation.frameTime);
        return animation.frames[Math.min(frameIndex, animation.frames.length - 1)];
    }
}

export class SpriteRenderer {
    constructor(ctx, spriteManager) {
        this.ctx = ctx;
        this.spriteManager = spriteManager;
    }
    
    drawSprite(spriteName, x, y, scale = 1) {
        const sprite = this.spriteManager.getSprite(spriteName);
        if (!sprite) {
            // Fallback: draw colored rectangle
            this.ctx.fillStyle = '#ff00ff'; // Magenta for missing sprites
            this.ctx.fillRect(x, y, 32 * scale, 32 * scale);
            return;
        }
        
        const width = sprite.width * scale;
        const height = sprite.height * scale;
        
        // Round position for pixel-perfect rendering
        const drawX = Math.round(x);
        const drawY = Math.round(y);
        
        this.ctx.drawImage(sprite.image, drawX, drawY, width, height);
    }
    
    drawSpriteFrame(spriteName, x, y, frameX, frameY, frameWidth, frameHeight, scale = 1) {
        const sprite = this.spriteManager.getSprite(spriteName);
        if (!sprite) return;
        
        const width = frameWidth * scale;
        const height = frameHeight * scale;
        
        const drawX = Math.round(x);
        const drawY = Math.round(y);
        
        this.ctx.drawImage(
            sprite.image,
            frameX, frameY, frameWidth, frameHeight,
            drawX, drawY, width, height
        );
    }
}