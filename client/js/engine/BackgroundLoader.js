/**
 * BackgroundLoader - Handles loading and caching of level background images
 */
export class BackgroundLoader {
    constructor() {
        this.backgrounds = new Map();
        this.loadingPromises = new Map();
        this.backgroundPaths = {
            0: 'assets/backgrounds/level0.jpg',
            1: 'assets/backgrounds/level1.jpg',
            2: 'assets/backgrounds/level2.png',
            3: 'assets/backgrounds/level3.png',
            4: 'assets/backgrounds/level4.png',
            5: 'assets/backgrounds/level5.png'
        };
    }

    /**
     * Preload all background images
     */
    async preloadAllBackgrounds() {
        console.log('Preloading level backgrounds...');

        const loadPromises = Object.entries(this.backgroundPaths).map(([level, path]) =>
            this.loadBackground(parseInt(level), path)
        );

        const results = await Promise.allSettled(loadPromises);

        let successCount = 0;
        let failCount = 0;

        results.forEach((result, index) => {
            const level = Object.keys(this.backgroundPaths)[index];
            if (result.status === 'fulfilled') {
                successCount++;
                console.log(`✓ Loaded background for level ${level}`);
            } else {
                failCount++;
                console.warn(`✗ Failed to load background for level ${level}:`, result.reason);
            }
        });

        console.log(`Background loading complete: ${successCount} loaded, ${failCount} failed`);
        return { successCount, failCount };
    }

    /**
     * Load a single background image
     */
    async loadBackground(levelNumber, imagePath) {
        // Return existing promise if already loading
        if (this.loadingPromises.has(levelNumber)) {
            return this.loadingPromises.get(levelNumber);
        }

        // Return existing background if already loaded
        if (this.backgrounds.has(levelNumber)) {
            return this.backgrounds.get(levelNumber);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const background = {
                    image: img,
                    width: img.width,
                    height: img.height,
                    path: imagePath,
                    levelNumber: levelNumber
                };

                this.backgrounds.set(levelNumber, background);
                this.loadingPromises.delete(levelNumber);
                resolve(background);
            };

            img.onerror = () => {
                this.loadingPromises.delete(levelNumber);
                reject(new Error(`Failed to load background image: ${imagePath}`));
            };

            // Set timeout for loading
            setTimeout(() => {
                if (!img.complete) {
                    this.loadingPromises.delete(levelNumber);
                    reject(new Error(`Timeout loading background: ${imagePath}`));
                }
            }, 10000); // 10 second timeout

            img.src = imagePath;
        });

        this.loadingPromises.set(levelNumber, loadPromise);
        return loadPromise;
    }

    /**
     * Get background for a specific level
     */
    getBackground(levelNumber) {
        return this.backgrounds.get(levelNumber);
    }

    /**
     * Check if background is loaded for a level
     */
    hasBackground(levelNumber) {
        return this.backgrounds.has(levelNumber);
    }

    /**
     * Render background for a level
     */
    renderBackground(ctx, levelNumber, width, height) {
        const background = this.getBackground(levelNumber);

        if (background) {
            // Scale background to fit canvas while maintaining aspect ratio
            this.drawScaledBackground(ctx, background.image, width, height);
            return true;
        }

        return false;
    }

    /**
     * Draw background image scaled to fit canvas
     */
    drawScaledBackground(ctx, image, canvasWidth, canvasHeight) {
        const imageAspect = image.width / image.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imageAspect > canvasAspect) {
            // Image is wider than canvas - fit to height
            drawHeight = canvasHeight;
            drawWidth = drawHeight * imageAspect;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller than canvas - fit to width
            drawWidth = canvasWidth;
            drawHeight = drawWidth / imageAspect;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        }

        // Fill any gaps with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw the scaled background
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }

    /**
     * Get loading progress
     */
    getLoadingProgress() {
        const totalBackgrounds = Object.keys(this.backgroundPaths).length;
        const loadedBackgrounds = this.backgrounds.size;
        return {
            loaded: loadedBackgrounds,
            total: totalBackgrounds,
            percentage: Math.round((loadedBackgrounds / totalBackgrounds) * 100)
        };
    }

    /**
     * Clear all cached backgrounds
     */
    clearCache() {
        this.backgrounds.clear();
        this.loadingPromises.clear();
    }
}