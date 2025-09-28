/**
 * BackgroundManager - Handles dynamic background generation and rendering
 * Creates atmospheric backgrounds for different levels
 */
export class BackgroundManager {
    constructor() {
        this.backgrounds = new Map();
        this.animatedElements = new Map();
        this.particleSystems = new Map();
    }

    /**
     * Create a facility background with pipes, panels, and atmospheric elements
     */
    createFacilityBackground(width, height, theme = 'normal') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Base colors based on theme
        const themes = {
            normal: { base: '#2a2a2a', accent: '#3a3a3a', highlight: '#4a4a4a' },
            danger: { base: '#2a1a1a', accent: '#3a2a2a', highlight: '#4a3a3a' },
            toxic: { base: '#1a2a1a', accent: '#2a3a2a', highlight: '#3a4a3a' },
            cold: { base: '#1a1a2a', accent: '#2a2a3a', highlight: '#3a3a4a' }
        };

        const colors = themes[theme] || themes.normal;

        // Fill base background
        ctx.fillStyle = colors.base;
        ctx.fillRect(0, 0, width, height);

        // Add floor tiles
        this.drawFloorTiles(ctx, width, height, colors);

        // Add wall panels
        this.drawWallPanels(ctx, width, height, colors);

        // Add pipes and conduits
        this.drawPipes(ctx, width, height, colors);

        // Add atmospheric details
        this.drawAtmosphericDetails(ctx, width, height, colors, theme);

        return canvas;
    }

    /**
     * Draw floor tiles with wear patterns
     */
    drawFloorTiles(ctx, width, height, colors) {
        const tileSize = 64;
        
        for (let x = 0; x < width; x += tileSize) {
            for (let y = height - tileSize * 3; y < height; y += tileSize) {
                // Base tile
                ctx.fillStyle = colors.accent;
                ctx.fillRect(x, y, tileSize - 2, tileSize - 2);

                // Tile border
                ctx.strokeStyle = colors.highlight;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, tileSize - 2, tileSize - 2);

                // Random wear marks
                if (Math.random() < 0.3) {
                    ctx.fillStyle = colors.base;
                    ctx.fillRect(
                        x + Math.random() * (tileSize - 20),
                        y + Math.random() * (tileSize - 20),
                        Math.random() * 15 + 5,
                        Math.random() * 15 + 5
                    );
                }
            }
        }
    }

    /**
     * Draw wall panels and structural elements
     */
    drawWallPanels(ctx, width, height, colors) {
        // Top wall panels
        for (let x = 0; x < width; x += 120) {
            ctx.fillStyle = colors.accent;
            ctx.fillRect(x, 0, 100, 80);
            
            ctx.strokeStyle = colors.highlight;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, 0, 100, 80);

            // Panel details
            ctx.fillStyle = colors.highlight;
            ctx.fillRect(x + 10, 10, 80, 8);
            ctx.fillRect(x + 10, 25, 80, 8);
        }

        // Side panels
        for (let y = 100; y < height - 200; y += 100) {
            // Left side
            ctx.fillStyle = colors.accent;
            ctx.fillRect(0, y, 60, 80);
            ctx.strokeStyle = colors.highlight;
            ctx.strokeRect(0, y, 60, 80);

            // Right side
            ctx.fillRect(width - 60, y, 60, 80);
            ctx.strokeRect(width - 60, y, 60, 80);
        }
    }

    /**
     * Draw pipes and conduits
     */
    drawPipes(ctx, width, height, colors) {
        // Horizontal pipes
        for (let i = 0; i < 3; i++) {
            const y = 100 + i * 150;
            ctx.strokeStyle = colors.highlight;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Pipe joints
            for (let x = 200; x < width; x += 300) {
                ctx.fillStyle = colors.accent;
                ctx.fillRect(x - 15, y - 15, 30, 30);
                ctx.strokeStyle = colors.highlight;
                ctx.strokeRect(x - 15, y - 15, 30, 30);
            }
        }

        // Vertical pipes
        for (let i = 0; i < 4; i++) {
            const x = 150 + i * 400;
            ctx.strokeStyle = colors.highlight;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    /**
     * Draw atmospheric details based on theme
     */
    drawAtmosphericDetails(ctx, width, height, colors, theme) {
        switch (theme) {
            case 'danger':
                this.drawDangerDetails(ctx, width, height);
                break;
            case 'toxic':
                this.drawToxicDetails(ctx, width, height);
                break;
            case 'cold':
                this.drawColdDetails(ctx, width, height);
                break;
            default:
                this.drawNormalDetails(ctx, width, height);
        }
    }

    drawDangerDetails(ctx, width, height) {
        // Warning stripes
        ctx.fillStyle = '#ffaa00';
        for (let x = 0; x < width; x += 100) {
            for (let i = 0; i < 5; i++) {
                ctx.fillRect(x + i * 20, height - 50, 15, 10);
            }
        }

        // Emergency lights
        for (let x = 200; x < width; x += 400) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(x, 50, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawToxicDetails(ctx, width, height) {
        // Toxic waste barrels
        for (let x = 300; x < width; x += 500) {
            ctx.fillStyle = '#44aa44';
            ctx.fillRect(x, height - 120, 40, 60);
            ctx.strokeStyle = '#66cc66';
            ctx.strokeRect(x, height - 120, 40, 60);
            
            // Radiation symbol
            ctx.fillStyle = '#ffff00';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('☢', x + 20, height - 85);
        }
    }

    drawColdDetails(ctx, width, height) {
        // Ice formations
        ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height * 0.3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 20, y + 40);
            ctx.lineTo(x - 20, y + 40);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawNormalDetails(ctx, width, height) {
        // Computer terminals
        for (let x = 100; x < width; x += 600) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(x, height - 180, 80, 100);
            
            // Screen
            ctx.fillStyle = '#004400';
            ctx.fillRect(x + 10, height - 170, 60, 40);
            
            // Screen text
            ctx.fillStyle = '#00ff00';
            ctx.font = '8px monospace';
            ctx.fillText('SYSTEM OK', x + 15, height - 150);
            ctx.fillText('TEMP: 23°C', x + 15, height - 140);
        }
    }

    /**
     * Create animated background elements
     */
    createAnimatedElements(levelTheme) {
        const elements = [];

        switch (levelTheme) {
            case 'facility':
                // Flickering lights
                elements.push({
                    type: 'flickering_light',
                    x: 200, y: 50,
                    intensity: 1.0,
                    flickerRate: 0.1
                });
                break;

            case 'reactor':
                // Steam vents
                elements.push({
                    type: 'steam_vent',
                    x: 400, y: 600,
                    particles: []
                });
                break;

            case 'blizzard':
                // Snow particles
                for (let i = 0; i < 50; i++) {
                    elements.push({
                        type: 'snow',
                        x: Math.random() * 1920,
                        y: Math.random() * 1080,
                        vx: -50 - Math.random() * 100,
                        vy: 100 + Math.random() * 100,
                        size: Math.random() * 3 + 1
                    });
                }
                break;
        }

        return elements;
    }

    /**
     * Update animated background elements
     */
    updateAnimatedElements(elements, deltaTime) {
        elements.forEach(element => {
            switch (element.type) {
                case 'flickering_light':
                    if (Math.random() < element.flickerRate) {
                        element.intensity = 0.3 + Math.random() * 0.7;
                    }
                    break;

                case 'snow':
                    element.x += element.vx * deltaTime;
                    element.y += element.vy * deltaTime;
                    
                    // Wrap around screen
                    if (element.x < -10) element.x = 1930;
                    if (element.y > 1090) element.y = -10;
                    break;

                case 'steam_vent':
                    // Add new steam particles
                    if (Math.random() < 0.3) {
                        element.particles.push({
                            x: element.x,
                            y: element.y,
                            vx: (Math.random() - 0.5) * 50,
                            vy: -100 - Math.random() * 50,
                            life: 1.0,
                            size: Math.random() * 10 + 5
                        });
                    }
                    
                    // Update existing particles
                    element.particles = element.particles.filter(particle => {
                        particle.x += particle.vx * deltaTime;
                        particle.y += particle.vy * deltaTime;
                        particle.life -= deltaTime * 0.5;
                        return particle.life > 0;
                    });
                    break;
            }
        });
    }

    /**
     * Render animated background elements
     */
    renderAnimatedElements(ctx, elements) {
        elements.forEach(element => {
            switch (element.type) {
                case 'flickering_light':
                    ctx.save();
                    ctx.globalAlpha = element.intensity;
                    ctx.fillStyle = '#ffff88';
                    ctx.beginPath();
                    ctx.arc(element.x, element.y, 30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;

                case 'snow':
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'steam_vent':
                    element.particles.forEach(particle => {
                        ctx.save();
                        ctx.globalAlpha = particle.life * 0.5;
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    });
                    break;
            }
        });
    }

    /**
     * Get background for a specific level
     */
    getBackground(levelNumber, width, height) {
        const key = `level_${levelNumber}_${width}x${height}`;
        
        if (this.backgrounds.has(key)) {
            return this.backgrounds.get(key);
        }

        let background;
        switch (levelNumber) {
            case 0:
                background = this.createFacilityBackground(width, height, 'normal');
                break;
            case 1:
                background = this.createFacilityBackground(width, height, 'danger');
                break;
            case 2:
                background = this.createFacilityBackground(width, height, 'danger');
                break;
            case 3:
                background = this.createFacilityBackground(width, height, 'toxic');
                break;
            case 4:
                background = this.createFacilityBackground(width, height, 'toxic');
                break;
            case 5:
                background = this.createFacilityBackground(width, height, 'cold');
                break;
            default:
                background = this.createFacilityBackground(width, height, 'normal');
        }

        this.backgrounds.set(key, background);
        return background;
    }

    /**
     * Clear cached backgrounds
     */
    clearCache() {
        this.backgrounds.clear();
        this.animatedElements.clear();
        this.particleSystems.clear();
    }
}