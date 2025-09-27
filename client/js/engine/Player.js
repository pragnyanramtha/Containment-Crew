export class Player {
    constructor(id, x = 0, y = 0, color = '#00ff00') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = color;
        
        // Player properties
        this.width = 32;
        this.height = 32;
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        
        // Character attributes (will be set by CharacterManager)
        this.characterType = 'scout'; // default
        this.strength = 2; // 1-3 (damage per hit)
        this.baseSpeed = 200; // base movement speed
        this.characterAbilities = {};
        
        // Movement properties
        this.speed = this.baseSpeed;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Dash mechanics
        this.dashCooldown = 0;
        this.dashCooldownMax = 3.0; // 3 seconds
        this.dashDistance = 150;
        this.dashDuration = 0.2; // 0.2 seconds
        this.isDashing = false;
        this.dashTime = 0;
        
        // Animation state
        this.direction = 'down'; // down, up, left, right
        this.isMoving = false;
        this.animationTime = 0;
        this.lastDirection = 'down';
        
        // Sprite properties
        this.spriteScale = 1;
        this.spriteBaseName = `player_${id}`;
        
        // Collision bounds
        this.collisionPadding = 4; // Smaller collision box than sprite
    }
    
    update(deltaTime, keys, canvasWidth, canvasHeight) {
        this.handleInput(keys);
        this.updateMovement(deltaTime);
        this.checkBoundaries(canvasWidth, canvasHeight);
        this.updateAnimation(deltaTime);
    }
    
    handleInput(keys) {
        this.velocityX = 0;
        this.velocityY = 0;
        this.isMoving = false;
        
        // WASD movement
        if (keys['KeyW'] || keys['ArrowUp']) {
            this.velocityY = -this.speed;
            this.direction = 'up';
            this.isMoving = true;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            this.velocityY = this.speed;
            this.direction = 'down';
            this.isMoving = true;
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.velocityX = -this.speed;
            this.direction = 'left';
            this.isMoving = true;
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.velocityX = this.speed;
            this.direction = 'right';
            this.isMoving = true;
        }
        
        // Normalize diagonal movement
        if (this.velocityX !== 0 && this.velocityY !== 0) {
            const normalizer = Math.sqrt(2) / 2;
            this.velocityX *= normalizer;
            this.velocityY *= normalizer;
        }
    }
    
    updateMovement(deltaTime) {
        if (!this.isAlive) return;
        
        // Update position with pixel-perfect movement
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Round to nearest pixel for crisp rendering
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }
    
    checkBoundaries(canvasWidth, canvasHeight) {
        // Keep player within canvas bounds
        const padding = this.collisionPadding;
        
        if (this.x < padding) {
            this.x = padding;
        }
        if (this.x > canvasWidth - this.width + padding) {
            this.x = canvasWidth - this.width + padding;
        }
        if (this.y < padding) {
            this.y = padding;
        }
        if (this.y > canvasHeight - this.height + padding) {
            this.y = canvasHeight - this.height + padding;
        }
    }
    
    updateAnimation(deltaTime) {
        // Update animation timer
        this.animationTime += deltaTime;
        
        // Track direction changes
        if (this.direction !== this.lastDirection) {
            this.animationTime = 0; // Reset animation when direction changes
            this.lastDirection = this.direction;
        }
    }
    
    render(ctx, spriteRenderer = null) {
        if (spriteRenderer) {
            // Use sprite rendering
            const spriteName = `${this.spriteBaseName}_${this.direction}`;
            if (this.isAlive) {
                spriteRenderer.drawSprite(spriteName, this.x, this.y, this.spriteScale);
            } else {
                // Render dead player with different visual
                this.renderDeadPlayer(ctx, spriteRenderer);
            }
        } else {
            // Fallback to simple rectangle rendering
            this.renderSimple(ctx);
        }
        
        // Draw health bar (only for alive players)
        if (this.isAlive) {
            this.renderHealthBar(ctx);
        }
        
        // Draw player name/ID
        this.renderPlayerInfo(ctx);
    }
    
    renderDeadPlayer(ctx, spriteRenderer) {
        // Render dead player as a darker, semi-transparent version
        ctx.save();
        ctx.globalAlpha = 0.5;
        
        // Draw a tombstone or skull symbol
        ctx.fillStyle = '#666666';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw X or skull symbol
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 5);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height - 5);
        ctx.moveTo(this.x + this.width - 5, this.y + 5);
        ctx.lineTo(this.x + 5, this.y + this.height - 5);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderSimple(ctx) {
        // Draw player as a colored rectangle with direction indicator
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw direction indicator
        ctx.fillStyle = '#ffffff';
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        switch (this.direction) {
            case 'up':
                ctx.fillRect(centerX - 2, this.y + 4, 4, 8);
                break;
            case 'down':
                ctx.fillRect(centerX - 2, this.y + this.height - 12, 4, 8);
                break;
            case 'left':
                ctx.fillRect(this.x + 4, centerY - 2, 8, 4);
                break;
            case 'right':
                ctx.fillRect(this.x + this.width - 12, centerY - 2, 8, 4);
                break;
        }
        
        // Add border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barX = this.x;
        const barY = this.y - 8;
        
        // Background
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    renderPlayerInfo(ctx) {
        // Draw player ID above health bar
        ctx.fillStyle = this.isAlive ? '#ffffff' : '#ff6666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        
        const textX = this.x + this.width / 2;
        const textY = this.y - 15;
        
        const displayText = this.isAlive ? this.id : `${this.id} (DEAD)`;
        ctx.fillText(displayText, textX, textY);
        
        // Reset text alignment
        ctx.textAlign = 'left';
    }
    
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    die() {
        if (!this.isAlive) return;
        
        this.isAlive = false;
        this.deathTime = Date.now();
        
        // Stop all movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.isMoving = false;
        
        console.log(`Player ${this.id} has died permanently - no respawn!`);
    }
    
    revive() {
        // This method exists but should NOT be used in this game
        // Players who die stay dead permanently
        console.warn(`Attempted to revive player ${this.id} - this should not happen in Sacrifices Must Be Made!`);
    }
    
    heal(amount) {
        if (!this.isAlive) return;
        
        this.health += amount;
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
    }
    
    // Collision detection helpers
    getCollisionBounds() {
        return {
            x: this.x + this.collisionPadding,
            y: this.y + this.collisionPadding,
            width: this.width - (this.collisionPadding * 2),
            height: this.height - (this.collisionPadding * 2)
        };
    }
    
    isCollidingWith(other) {
        const thisBounds = this.getCollisionBounds();
        const otherBounds = other.getCollisionBounds ? other.getCollisionBounds() : other;
        
        return thisBounds.x < otherBounds.x + otherBounds.width &&
               thisBounds.x + thisBounds.width > otherBounds.x &&
               thisBounds.y < otherBounds.y + otherBounds.height &&
               thisBounds.y + thisBounds.height > otherBounds.y;
    }
}