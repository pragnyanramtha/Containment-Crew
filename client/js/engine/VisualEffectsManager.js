export class VisualEffectsManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.canvas = gameEngine.canvas;
        this.ctx = gameEngine.ctx;
        
        // Effect systems
        this.particles = [];
        this.screenShakes = [];
        this.transitions = [];
        this.animations = [];
        
        // Screen shake state
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        
        // Transition state
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionType = 'fade';
        this.transitionCallback = null;
        
        // Animation time
        this.animationTime = 0;
        
        // Effect configuration
        this.config = {
            particles: {
                maxParticles: 500,
                gravity: 200,
                airResistance: 0.98
            },
            screenShake: {
                maxIntensity: 20,
                decayRate: 5
            },
            transitions: {
                fadeSpeed: 2,
                slideSpeed: 1000
            }
        };
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update screen shake
        this.updateScreenShake(deltaTime);
        
        // Update transitions
        this.updateTransitions(deltaTime);
        
        // Update animations
        this.updateAnimations(deltaTime);
        
        // Clean up expired effects
        this.cleanupEffects();
    }
    
    render() {
        this.ctx.save();
        
        // Apply screen shake
        if (this.shakeIntensity > 0) {
            this.ctx.translate(this.shakeX, this.shakeY);
        }
        
        // Render particles
        this.renderParticles();
        
        // Render animations
        this.renderAnimations();
        
        this.ctx.restore();
        
        // Render transitions (on top of everything)
        this.renderTransitions();
    }
    
    // Particle System
    createParticleEffect(type, x, y, options = {}) {
        const defaultOptions = {
            count: 10,
            speed: 100,
            size: 3,
            color: '#ffffff',
            lifetime: 1,
            spread: Math.PI * 2,
            gravity: true,
            fade: true
        };
        
        const config = { ...defaultOptions, ...options };
        
        for (let i = 0; i < config.count; i++) {
            const angle = (config.spread * i) / config.count + (Math.random() - 0.5) * 0.5;
            const speed = config.speed * (0.5 + Math.random() * 0.5);
            
            const particle = {
                type: type,
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: config.size * (0.5 + Math.random() * 0.5),
                color: config.color,
                alpha: 1,
                lifetime: config.lifetime * (0.5 + Math.random() * 0.5),
                maxLifetime: config.lifetime * (0.5 + Math.random() * 0.5),
                gravity: config.gravity,
                fade: config.fade,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 4
            };
            
            this.particles.push(particle);
        }
        
        // Limit particle count
        if (this.particles.length > this.config.particles.maxParticles) {
            this.particles.splice(0, this.particles.length - this.config.particles.maxParticles);
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // Apply gravity
            if (particle.gravity) {
                particle.vy += this.config.particles.gravity * deltaTime;
            }
            
            // Apply air resistance
            particle.vx *= this.config.particles.airResistance;
            particle.vy *= this.config.particles.airResistance;
            
            // Update rotation
            particle.rotation += particle.rotationSpeed * deltaTime;
            
            // Update lifetime
            particle.lifetime -= deltaTime;
            
            // Update alpha for fading
            if (particle.fade) {
                particle.alpha = particle.lifetime / particle.maxLifetime;
            }
            
            // Remove expired particles
            if (particle.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.save();
            
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            
            switch (particle.type) {
                case 'spark':
                    this.ctx.fillStyle = particle.color;
                    this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                    break;
                    
                case 'blood':
                    this.ctx.fillStyle = particle.color;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'explosion':
                    this.ctx.fillStyle = particle.color;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Add glow effect
                    this.ctx.shadowColor = particle.color;
                    this.ctx.shadowBlur = particle.size * 2;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size * 0.5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                    break;
                    
                case 'dust':
                    this.ctx.fillStyle = particle.color;
                    this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                    break;
                    
                case 'energy':
                    this.ctx.strokeStyle = particle.color;
                    this.ctx.lineWidth = particle.size;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-particle.size, 0);
                    this.ctx.lineTo(particle.size, 0);
                    this.ctx.stroke();
                    break;
                    
                case 'radiation':
                    this.ctx.fillStyle = particle.color;
                    this.ctx.font = `${particle.size * 2}px monospace`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('☢', 0, particle.size/2);
                    break;
                    
                default:
                    this.ctx.fillStyle = particle.color;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
            }
            
            this.ctx.restore();
        }
    }
    
    // Screen Shake System
    addScreenShake(intensity, duration = 0.5) {
        this.shakeIntensity = Math.min(intensity, this.config.screenShake.maxIntensity);
        this.shakeDuration = duration;
    }
    
    updateScreenShake(deltaTime) {
        if (this.shakeIntensity > 0) {
            // Generate random shake offset
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            
            // Decay shake intensity
            this.shakeIntensity -= this.config.screenShake.decayRate * deltaTime;
            this.shakeDuration -= deltaTime;
            
            if (this.shakeIntensity <= 0 || this.shakeDuration <= 0) {
                this.shakeIntensity = 0;
                this.shakeDuration = 0;
                this.shakeX = 0;
                this.shakeY = 0;
            }
        }
    }
    
    // Level Transition System
    startLevelTransition(fromLevel, toLevel, type = 'fade', callback = null) {
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionType = type;
        this.transitionCallback = callback;
        this.fromLevel = fromLevel;
        this.toLevel = toLevel;
        
        console.log(`Starting ${type} transition from Level ${fromLevel} to Level ${toLevel}`);
    }
    
    updateTransitions(deltaTime) {
        if (!this.isTransitioning) return;
        
        const speed = this.config.transitions.fadeSpeed;
        this.transitionProgress += speed * deltaTime;
        
        if (this.transitionProgress >= 2) {
            // Transition complete
            this.isTransitioning = false;
            this.transitionProgress = 0;
            
            if (this.transitionCallback) {
                this.transitionCallback();
            }
        } else if (this.transitionProgress >= 1 && this.transitionCallback) {
            // Midpoint - execute callback once
            const callback = this.transitionCallback;
            this.transitionCallback = null;
            callback();
        }
    }
    
    renderTransitions() {
        if (!this.isTransitioning) return;
        
        this.ctx.save();
        
        let alpha;
        if (this.transitionProgress <= 1) {
            // Fade out
            alpha = this.transitionProgress;
        } else {
            // Fade in
            alpha = 2 - this.transitionProgress;
        }
        
        switch (this.transitionType) {
            case 'fade':
                this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
                
            case 'slide_left':
                const slideOffset = (this.transitionProgress <= 1) ? 
                    this.canvas.width * this.transitionProgress : 
                    this.canvas.width * (2 - this.transitionProgress);
                
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(this.canvas.width - slideOffset, 0, slideOffset, this.canvas.height);
                break;
                
            case 'circle':
                const maxRadius = Math.sqrt(this.canvas.width * this.canvas.width + this.canvas.height * this.canvas.height);
                const radius = maxRadius * alpha;
                
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.beginPath();
                this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalCompositeOperation = 'source-over';
                break;
        }
        
        // Show transition text
        if (this.transitionProgress > 0.3 && this.transitionProgress < 1.7) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 48px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Level ${this.toLevel}`, this.canvas.width / 2, this.canvas.height / 2);
            
            // Level name if available
            const levelConfig = this.gameEngine.levelManager.getLevelConfig(this.toLevel);
            if (levelConfig && levelConfig.name) {
                this.ctx.font = '24px monospace';
                this.ctx.fillText(levelConfig.name, this.canvas.width / 2, this.canvas.height / 2 + 60);
            }
        }
        
        this.ctx.restore();
    }
    
    // Animation System
    createAnimation(type, x, y, options = {}) {
        const animation = {
            type: type,
            x: x,
            y: y,
            startTime: this.animationTime,
            duration: options.duration || 1,
            ...options
        };
        
        this.animations.push(animation);
        return animation;
    }
    
    updateAnimations(deltaTime) {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            const elapsed = this.animationTime - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
            animation.progress = progress;
            
            // Update animation-specific properties
            switch (animation.type) {
                case 'death':
                    animation.scale = 1 + progress * 0.5;
                    animation.alpha = 1 - progress;
                    animation.rotation = progress * Math.PI * 2;
                    break;
                    
                case 'sacrifice':
                    animation.scale = 1 + Math.sin(progress * Math.PI) * 0.3;
                    animation.alpha = 1 - progress * 0.5;
                    animation.glowIntensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
                    break;
                    
                case 'level_complete':
                    animation.scale = 1 + Math.sin(progress * Math.PI) * 0.2;
                    animation.alpha = Math.sin(progress * Math.PI);
                    break;
                    
                case 'damage_number':
                    animation.y = animation.startY - progress * 50;
                    animation.alpha = 1 - progress;
                    animation.scale = 1 + progress * 0.2;
                    break;
            }
            
            // Remove completed animations
            if (progress >= 1) {
                this.animations.splice(i, 1);
                
                // Call completion callback if exists
                if (animation.onComplete) {
                    animation.onComplete();
                }
            }
        }
    }
    
    renderAnimations() {
        for (const animation of this.animations) {
            this.ctx.save();
            
            this.ctx.globalAlpha = animation.alpha || 1;
            this.ctx.translate(animation.x, animation.y);
            
            if (animation.scale) {
                this.ctx.scale(animation.scale, animation.scale);
            }
            
            if (animation.rotation) {
                this.ctx.rotate(animation.rotation);
            }
            
            switch (animation.type) {
                case 'death':
                    this.renderDeathAnimation(animation);
                    break;
                    
                case 'sacrifice':
                    this.renderSacrificeAnimation(animation);
                    break;
                    
                case 'level_complete':
                    this.renderLevelCompleteAnimation(animation);
                    break;
                    
                case 'damage_number':
                    this.renderDamageNumber(animation);
                    break;
            }
            
            this.ctx.restore();
        }
    }
    
    renderDeathAnimation(animation) {
        // Skull symbol
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💀', 0, 10);
        
        // Death text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('ELIMINATED', 0, 40);
    }
    
    renderSacrificeAnimation(animation) {
        // Glowing effect
        if (animation.glowIntensity) {
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 20 * animation.glowIntensity;
        }
        
        // Sacrifice symbol
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚡', 0, 10);
        
        // Sacrifice text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('SACRIFICE', 0, 40);
        
        this.ctx.shadowBlur = 0;
    }
    
    renderLevelCompleteAnimation(animation) {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LEVEL COMPLETE', 0, 0);
    }
    
    renderDamageNumber(animation) {
        this.ctx.fillStyle = animation.color || '#ff0000';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`-${animation.damage}`, 0, 0);
    }
    
    // Cleanup
    cleanupEffects() {
        // Remove expired particles (already handled in updateParticles)
        
        // Remove expired animations (already handled in updateAnimations)
        
        // Clean up any other expired effects
    }
    
    // Convenience methods for common effects
    createCombatHit(x, y, damage) {
        // Screen shake
        this.addScreenShake(5, 0.2);
        
        // Blood particles
        this.createParticleEffect('blood', x, y, {
            count: 8,
            color: '#ff0000',
            speed: 150,
            lifetime: 0.8,
            spread: Math.PI * 2
        });
        
        // Damage number
        this.createAnimation('damage_number', x, y, {
            damage: damage,
            startY: y,
            duration: 1,
            color: '#ff0000'
        });
    }
    
    createExplosion(x, y, size = 'normal') {
        const configs = {
            small: { count: 15, intensity: 3, particles: 20 },
            normal: { count: 25, intensity: 8, particles: 40 },
            large: { count: 40, intensity: 15, particles: 60 }
        };
        
        const config = configs[size] || configs.normal;
        
        // Screen shake
        this.addScreenShake(config.intensity, 0.5);
        
        // Explosion particles
        this.createParticleEffect('explosion', x, y, {
            count: config.particles,
            color: '#ff8800',
            speed: 200,
            lifetime: 1.2,
            spread: Math.PI * 2
        });
        
        // Sparks
        this.createParticleEffect('spark', x, y, {
            count: config.count,
            color: '#ffff00',
            speed: 300,
            lifetime: 0.8,
            spread: Math.PI * 2
        });
    }
    
    createPlayerDeath(player) {
        // Death animation
        this.createAnimation('death', player.x + player.width/2, player.y + player.height/2, {
            duration: 2,
            onComplete: () => {
                console.log(`Death animation completed for ${player.id}`);
            }
        });
        
        // Death particles
        this.createParticleEffect('blood', player.x + player.width/2, player.y + player.height/2, {
            count: 20,
            color: '#aa0000',
            speed: 100,
            lifetime: 2,
            spread: Math.PI * 2
        });
        
        // Screen shake
        this.addScreenShake(10, 1);
    }
    
    createPlayerSacrifice(player) {
        // Sacrifice animation
        this.createAnimation('sacrifice', player.x + player.width/2, player.y + player.height/2, {
            duration: 3,
            onComplete: () => {
                console.log(`Sacrifice animation completed for ${player.id}`);
            }
        });
        
        // Energy particles
        this.createParticleEffect('energy', player.x + player.width/2, player.y + player.height/2, {
            count: 30,
            color: '#ffff00',
            speed: 150,
            lifetime: 2.5,
            spread: Math.PI * 2,
            gravity: false
        });
        
        // Light flash
        this.addScreenShake(5, 0.3);
    }
    
    createEnvironmentalHazard(type, x, y) {
        switch (type) {
            case 'falling_rock':
                this.createParticleEffect('dust', x, y, {
                    count: 15,
                    color: '#888888',
                    speed: 80,
                    lifetime: 1.5
                });
                this.addScreenShake(3, 0.3);
                break;
                
            case 'radiation':
                this.createParticleEffect('radiation', x, y, {
                    count: 5,
                    color: '#00ff00',
                    speed: 50,
                    lifetime: 2,
                    gravity: false
                });
                break;
                
            case 'reactor_shutdown':
                this.createParticleEffect('energy', x, y, {
                    count: 50,
                    color: '#00ffff',
                    speed: 200,
                    lifetime: 3,
                    gravity: false
                });
                this.addScreenShake(20, 2);
                break;
        }
    }
    
    // Clear all effects
    clearAllEffects() {
        this.particles = [];
        this.animations = [];
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.isTransitioning = false;
        this.transitionProgress = 0;
    }
}