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
     * Create enhanced facility backgrounds with level-specific themes
     */
    createFacilityBackground(width, height, theme = 'normal') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Enhanced themes with more variety
        const themes = {
            normal: { 
                base: '#2a2a2a', accent: '#3a3a3a', highlight: '#4a4a4a',
                secondary: '#1a1a1a', light: '#5a5a5a', special: '#4a6a4a'
            },
            danger: { 
                base: '#2a1a1a', accent: '#3a2a2a', highlight: '#4a3a3a',
                secondary: '#1a0a0a', light: '#5a4a4a', special: '#6a2a2a'
            },
            toxic: { 
                base: '#1a2a1a', accent: '#2a3a2a', highlight: '#3a4a3a',
                secondary: '#0a1a0a', light: '#4a5a4a', special: '#2a6a2a'
            },
            cold: { 
                base: '#1a1a2a', accent: '#2a2a3a', highlight: '#3a3a4a',
                secondary: '#0a0a1a', light: '#4a4a5a', special: '#2a2a6a'
            },
            reactor: {
                base: '#1a1a3a', accent: '#2a2a4a', highlight: '#3a3a5a',
                secondary: '#0a0a2a', light: '#4a4a6a', special: '#2a4a6a'
            },
            underground: {
                base: '#3a2a1a', accent: '#4a3a2a', highlight: '#5a4a3a',
                secondary: '#2a1a0a', light: '#6a5a4a', special: '#6a4a2a'
            }
        };

        const colors = themes[theme] || themes.normal;

        // Create gradient background for depth
        this.drawGradientBackground(ctx, width, height, colors);

        // Add floor tiles with more detail
        this.drawEnhancedFloorTiles(ctx, width, height, colors);

        // Add detailed wall panels
        this.drawEnhancedWallPanels(ctx, width, height, colors);

        // Add complex pipe systems
        this.drawEnhancedPipes(ctx, width, height, colors);

        // Add atmospheric details
        this.drawAtmosphericDetails(ctx, width, height, colors, theme);

        // Add level-specific environmental elements
        this.drawEnvironmentalElements(ctx, width, height, colors, theme);

        return canvas;
    }

    /**
     * Draw gradient background for depth
     */
    drawGradientBackground(ctx, width, height, colors) {
        // Vertical gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(0.3, colors.base);
        gradient.addColorStop(0.7, colors.base);
        gradient.addColorStop(1, colors.accent);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Add subtle noise texture
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.02})`;
            ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
        }
    }

    /**
     * Draw enhanced floor tiles with wear and detail
     */
    drawEnhancedFloorTiles(ctx, width, height, colors) {
        const tileSize = 64;
        const floorHeight = tileSize * 4;
        
        for (let x = 0; x < width; x += tileSize) {
            for (let y = height - floorHeight; y < height; y += tileSize) {
                // Base tile with gradient
                const tileGradient = ctx.createLinearGradient(x, y, x, y + tileSize);
                tileGradient.addColorStop(0, colors.accent);
                tileGradient.addColorStop(1, colors.highlight);
                
                ctx.fillStyle = tileGradient;
                ctx.fillRect(x, y, tileSize - 2, tileSize - 2);

                // Tile border with depth
                ctx.strokeStyle = colors.light;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, tileSize - 2, tileSize - 2);

                // Inner detail lines
                ctx.strokeStyle = colors.secondary;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x + 4, y + 4, tileSize - 10, tileSize - 10);

                // Random wear marks and stains
                if (Math.random() < 0.4) {
                    ctx.fillStyle = colors.secondary;
                    const wearX = x + Math.random() * (tileSize - 20) + 5;
                    const wearY = y + Math.random() * (tileSize - 20) + 5;
                    const wearSize = Math.random() * 15 + 5;
                    ctx.fillRect(wearX, wearY, wearSize, wearSize * 0.3);
                }

                // Occasional cracks
                if (Math.random() < 0.2) {
                    ctx.strokeStyle = colors.secondary;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + Math.random() * tileSize, y + Math.random() * tileSize);
                    ctx.lineTo(x + Math.random() * tileSize, y + Math.random() * tileSize);
                    ctx.stroke();
                }
            }
        }
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
     * Get enhanced background for a specific level
     */
    getBackground(levelNumber, width, height) {
        const key = `level_${levelNumber}_${width}x${height}`;
        
        if (this.backgrounds.has(key)) {
            return this.backgrounds.get(key);
        }

        let background;
        switch (levelNumber) {
            case 0:
                // Tutorial - Clean facility entrance
                background = this.createFacilityBackground(width, height, 'normal');
                break;
            case 1:
                // Combat training - Emergency lighting and warnings
                background = this.createFacilityBackground(width, height, 'danger');
                break;
            case 2:
                // Boss fight - Reactor hall with emergency systems
                background = this.createFacilityBackground(width, height, 'reactor');
                break;
            case 3:
                // Puzzle level - Control room with toxic contamination
                background = this.createFacilityBackground(width, height, 'toxic');
                break;
            case 4:
                // Sacrifice level - Underground maintenance tunnels
                background = this.createFacilityBackground(width, height, 'underground');
                break;
            case 5:
                // Final level - Frozen reactor core chamber
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

    /**
     * Draw enhanced wall panels with more detail
     */
    drawEnhancedWallPanels(ctx, width, height, colors) {
        // Top wall panels with control interfaces
        for (let x = 0; x < width; x += 150) {
            const panelWidth = 120;
            const panelHeight = 100;
            
            // Main panel
            const panelGradient = ctx.createLinearGradient(x, 0, x, panelHeight);
            panelGradient.addColorStop(0, colors.highlight);
            panelGradient.addColorStop(0.5, colors.accent);
            panelGradient.addColorStop(1, colors.secondary);
            
            ctx.fillStyle = panelGradient;
            ctx.fillRect(x, 0, panelWidth, panelHeight);
            
            // Panel border
            ctx.strokeStyle = colors.light;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, 0, panelWidth, panelHeight);

            // Control interface details
            ctx.fillStyle = colors.special;
            ctx.fillRect(x + 10, 15, panelWidth - 20, 12);
            ctx.fillRect(x + 10, 35, panelWidth - 20, 12);
            
            // Status lights
            for (let i = 0; i < 4; i++) {
                const lightX = x + 20 + i * 20;
                const lightColor = Math.random() > 0.7 ? '#00ff00' : '#ff0000';
                ctx.fillStyle = lightColor;
                ctx.beginPath();
                ctx.arc(lightX, 65, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Ventilation grilles
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 10, 75 + i * 3);
                ctx.lineTo(x + panelWidth - 10, 75 + i * 3);
                ctx.stroke();
            }
        }

        // Side panels with more complexity
        for (let y = 120; y < height - 250; y += 120) {
            // Left side panels
            this.drawSidePanel(ctx, 0, y, 80, 100, colors, 'left');
            
            // Right side panels
            this.drawSidePanel(ctx, width - 80, y, 80, 100, colors, 'right');
        }
    }

    /**
     * Draw detailed side panel
     */
    drawSidePanel(ctx, x, y, width, height, colors, side) {
        // Main panel with depth
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, side === 'left' ? colors.secondary : colors.highlight);
        gradient.addColorStop(1, side === 'left' ? colors.highlight : colors.secondary);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        
        // Panel border
        ctx.strokeStyle = colors.light;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Internal structure
        ctx.fillStyle = colors.accent;
        ctx.fillRect(x + 10, y + 10, width - 20, height - 20);

        // Access panel
        ctx.fillStyle = colors.secondary;
        ctx.fillRect(x + 15, y + 20, width - 30, 30);
        
        // Handle
        ctx.fillStyle = colors.light;
        const handleX = side === 'left' ? x + width - 25 : x + 15;
        ctx.fillRect(handleX, y + 30, 8, 10);
    }

    /**
     * Draw enhanced pipe systems
     */
    drawEnhancedPipes(ctx, width, height, colors) {
        // Main horizontal pipes with joints and valves
        const pipePositions = [150, 300, 450, 600];
        
        pipePositions.forEach((y, index) => {
            // Main pipe
            ctx.strokeStyle = colors.light;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Pipe shadow for depth
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(0, y + 2);
            ctx.lineTo(width, y + 2);
            ctx.stroke();

            // Pipe joints and valves
            for (let x = 200; x < width; x += 350) {
                // Joint
                ctx.fillStyle = colors.accent;
                ctx.fillRect(x - 20, y - 20, 40, 40);
                ctx.strokeStyle = colors.light;
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 20, y - 20, 40, 40);

                // Valve wheel
                if (index % 2 === 0) {
                    ctx.strokeStyle = colors.special;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y - 30, 15, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Valve spokes
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI * 2) / 6;
                        ctx.beginPath();
                        ctx.moveTo(x, y - 30);
                        ctx.lineTo(x + Math.cos(angle) * 12, y - 30 + Math.sin(angle) * 12);
                        ctx.stroke();
                    }
                }

                // Pressure gauge
                if (index % 3 === 1) {
                    ctx.fillStyle = colors.secondary;
                    ctx.beginPath();
                    ctx.arc(x, y + 35, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = colors.light;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Gauge needle
                    const needleAngle = Math.random() * Math.PI;
                    ctx.strokeStyle = '#ff4444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y + 35);
                    ctx.lineTo(x + Math.cos(needleAngle) * 8, y + 35 + Math.sin(needleAngle) * 8);
                    ctx.stroke();
                }
            }
        });

        // Vertical pipes with more detail
        for (let i = 0; i < 5; i++) {
            const x = 200 + i * 350;
            
            // Main vertical pipe
            ctx.strokeStyle = colors.highlight;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Pipe insulation bands
            for (let y = 100; y < height; y += 80) {
                ctx.fillStyle = colors.special;
                ctx.fillRect(x - 12, y, 24, 8);
            }
        }
    }

    /**
     * Draw environmental elements specific to each theme
     */
    drawEnvironmentalElements(ctx, width, height, colors, theme) {
        switch (theme) {
            case 'normal':
                this.drawNormalEnvironment(ctx, width, height, colors);
                break;
            case 'danger':
                this.drawDangerEnvironment(ctx, width, height, colors);
                break;
            case 'toxic':
                this.drawToxicEnvironment(ctx, width, height, colors);
                break;
            case 'cold':
                this.drawColdEnvironment(ctx, width, height, colors);
                break;
            case 'reactor':
                this.drawReactorEnvironment(ctx, width, height, colors);
                break;
            case 'underground':
                this.drawUndergroundEnvironment(ctx, width, height, colors);
                break;
        }
    }

    drawNormalEnvironment(ctx, width, height, colors) {
        // Computer workstations
        for (let x = 150; x < width; x += 400) {
            // Desk
            ctx.fillStyle = colors.accent;
            ctx.fillRect(x, height - 200, 120, 80);
            
            // Monitor
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(x + 20, height - 190, 80, 50);
            
            // Screen
            ctx.fillStyle = '#004400';
            ctx.fillRect(x + 25, height - 185, 70, 40);
            
            // Screen content
            ctx.fillStyle = '#00ff00';
            ctx.font = '8px monospace';
            ctx.fillText('SYSTEM STATUS: OK', x + 30, height - 170);
            ctx.fillText('TEMP: 23°C', x + 30, height - 160);
            ctx.fillText('PRESSURE: NORMAL', x + 30, height - 150);
        }
    }

    drawDangerEnvironment(ctx, width, height, colors) {
        // Warning stripes and emergency equipment
        ctx.fillStyle = '#ffaa00';
        for (let x = 0; x < width; x += 120) {
            // Warning stripes
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(x + i * 20, height - 60, 15, 12);
            }
        }

        // Emergency lights with glow
        for (let x = 250; x < width; x += 500) {
            // Light glow
            const gradient = ctx.createRadialGradient(x, 60, 0, x, 60, 40);
            gradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, 60, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // Light fixture
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(x, 60, 18, 0, Math.PI * 2);
            ctx.fill();
        }

        // Emergency exit signs
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(width - 100, 200, 80, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.fillText('EXIT', width - 80, 220);
    }

    drawToxicEnvironment(ctx, width, height, colors) {
        // Toxic waste containers
        for (let x = 300; x < width; x += 600) {
            // Container
            ctx.fillStyle = '#44aa44';
            ctx.fillRect(x, height - 150, 50, 80);
            ctx.strokeStyle = '#66cc66';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, height - 150, 50, 80);
            
            // Hazard symbol
            ctx.fillStyle = '#ffff00';
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('☢', x + 25, height - 105);
            
            // Toxic drips
            ctx.fillStyle = '#44aa44';
            for (let i = 0; i < 3; i++) {
                const dripX = x + 10 + i * 15;
                ctx.fillRect(dripX, height - 70, 3, Math.random() * 20 + 10);
            }
        }

        // Ventilation with toxic gas
        for (let x = 200; x < width; x += 400) {
            // Vent
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(x, 100, 60, 20);
            
            // Gas particles
            ctx.fillStyle = 'rgba(68, 170, 68, 0.3)';
            for (let i = 0; i < 8; i++) {
                const gasX = x + Math.random() * 100;
                const gasY = 120 + Math.random() * 50;
                ctx.beginPath();
                ctx.arc(gasX, gasY, Math.random() * 8 + 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawColdEnvironment(ctx, width, height, colors) {
        // Ice formations
        ctx.fillStyle = 'rgba(200, 220, 255, 0.4)';
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height * 0.4;
            const size = Math.random() * 30 + 10;
            
            // Icicle
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size * 0.3, y + size);
            ctx.lineTo(x - size * 0.3, y + size);
            ctx.closePath();
            ctx.fill();
        }

        // Frost on pipes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let x = 0; x < width; x += 100) {
            ctx.fillRect(x, 148, 80, 4); // Frost on horizontal pipes
        }

        // Frozen condensation
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = 'rgba(200, 220, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3 + 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawReactorEnvironment(ctx, width, height, colors) {
        // Reactor core glow
        const coreX = width / 2;
        const coreY = height / 2;
        
        // Core glow effect
        const coreGradient = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, 150);
        coreGradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        coreGradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.2)');
        coreGradient.addColorStop(1, 'rgba(0, 100, 255, 0.1)');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(coreX, coreY, 150, 0, Math.PI * 2);
        ctx.fill();

        // Control rods
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const rodX = coreX + Math.cos(angle) * 100;
            const rodY = coreY + Math.sin(angle) * 100;
            
            ctx.fillStyle = colors.light;
            ctx.fillRect(rodX - 3, rodY - 20, 6, 40);
        }

        // Radiation warning signs
        ctx.fillStyle = '#ffff00';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI * 2) / 4;
            const signX = coreX + Math.cos(angle) * 200;
            const signY = coreY + Math.sin(angle) * 200;
            ctx.fillText('☢', signX, signY);
        }
    }

    drawUndergroundEnvironment(ctx, width, height, colors) {
        // Rock formations
        ctx.fillStyle = colors.secondary;
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height * 0.3;
            const size = Math.random() * 60 + 20;
            
            // Irregular rock shape
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + size * 0.8, y + size * 0.3);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x + size * 0.2, y + size);
            ctx.closePath();
            ctx.fill();
        }

        // Cave stalactites
        for (let x = 100; x < width; x += 200) {
            ctx.fillStyle = colors.accent;
            const stalactiteHeight = Math.random() * 80 + 40;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 15, stalactiteHeight);
            ctx.lineTo(x - 15, stalactiteHeight);
            ctx.closePath();
            ctx.fill();
        }

        // Underground water drips
        ctx.fillStyle = 'rgba(100, 150, 200, 0.6)';
        for (let i = 0; i < 15; i++) {
            const dropX = Math.random() * width;
            const dropY = Math.random() * height;
            ctx.beginPath();
            ctx.arc(dropX, dropY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }}
