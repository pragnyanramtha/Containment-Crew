export class DeathManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gameOverTriggered = false;
        this.gameOverTime = 0;
        this.gameOverDuration = 3.0; // Show game over screen for 3 seconds
        this.deathMessages = [];
    }
    
    update(deltaTime) {
        // Update game over timer
        if (this.gameOverTriggered) {
            this.gameOverTime += deltaTime;
        }
        
        // Check for all players dead condition
        this.checkAllPlayersDead();
        
        // Update death messages
        this.updateDeathMessages(deltaTime);
    }
    
    checkAllPlayersDead() {
        if (this.gameOverTriggered) return;
        
        const players = Array.from(this.gameEngine.players.values());
        const alivePlayers = players.filter(player => player.isAlive);
        
        if (players.length > 0 && alivePlayers.length === 0) {
            this.triggerGameOver();
        }
    }
    
    triggerGameOver() {
        if (this.gameOverTriggered) return;
        
        console.log('GAME OVER - All players have died!');
        this.gameOverTriggered = true;
        this.gameOverTime = 0;
        
        // Add game over message
        this.addDeathMessage('GAME OVER', 'All players have perished', '#ff0000', 5.0);
        
        // Notify current level
        const currentLevel = this.gameEngine.getCurrentLevel();
        if (currentLevel) {
            currentLevel.gameOver = true;
        }
        
        // Stop game engine after delay
        setTimeout(() => {
            this.showGameOverScreen();
        }, this.gameOverDuration * 1000);
    }
    
    onPlayerDeath(player) {
        console.log(`Player ${player.id} has died permanently!`);
        
        // Add death message
        this.addDeathMessage(
            `${player.id} has died`,
            'No respawn - they are gone forever',
            '#ff6666',
            3.0
        );
        
        // Check if this was the last player
        const alivePlayers = Array.from(this.gameEngine.players.values()).filter(p => p.isAlive);
        
        if (alivePlayers.length === 0) {
            this.triggerGameOver();
        } else {
            // Show remaining players count
            this.addDeathMessage(
                `${alivePlayers.length} player(s) remaining`,
                'The mission continues...',
                '#ffff66',
                2.0
            );
        }
    }
    
    addDeathMessage(title, subtitle, color, duration) {
        this.deathMessages.push({
            title: title,
            subtitle: subtitle,
            color: color,
            timeLeft: duration,
            maxTime: duration,
            alpha: 1.0
        });
    }
    
    updateDeathMessages(deltaTime) {
        this.deathMessages = this.deathMessages.filter(message => {
            message.timeLeft -= deltaTime;
            
            // Fade out in the last 0.5 seconds
            if (message.timeLeft < 0.5) {
                message.alpha = message.timeLeft / 0.5;
            }
            
            return message.timeLeft > 0;
        });
    }
    
    showGameOverScreen() {
        // This could transition to a game over screen or restart menu
        console.log('Showing game over screen...');
        
        // For now, just reload the page or show restart option
        if (confirm('Game Over! All players have died. Would you like to restart?')) {
            window.location.reload();
        }
    }
    
    isGameOver() {
        return this.gameOverTriggered;
    }
    
    getAlivePlayers() {
        return Array.from(this.gameEngine.players.values()).filter(player => player.isAlive);
    }
    
    getDeadPlayers() {
        return Array.from(this.gameEngine.players.values()).filter(player => !player.isAlive);
    }
    
    getAlivePlayerCount() {
        return this.getAlivePlayers().length;
    }
    
    render(ctx) {
        // Render death messages
        this.renderDeathMessages(ctx);
        
        // Render game over screen
        if (this.gameOverTriggered) {
            this.renderGameOverScreen(ctx);
        }
    }
    
    renderDeathMessages(ctx) {
        const startY = 100;
        let currentY = startY;
        
        for (const message of this.deathMessages) {
            ctx.save();
            ctx.globalAlpha = message.alpha;
            
            // Draw title
            ctx.fillStyle = message.color;
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(message.title, ctx.canvas.width / 2, currentY);
            
            // Draw subtitle
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px monospace';
            ctx.fillText(message.subtitle, ctx.canvas.width / 2, currentY + 30);
            
            currentY += 80;
            ctx.restore();
        }
        
        // Reset text alignment
        ctx.textAlign = 'left';
    }
    
    renderGameOverScreen(ctx) {
        if (!this.gameOverTriggered) return;
        
        // Semi-transparent overlay
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Game Over text
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2 - 50);
        
        // Subtitle
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px monospace';
        ctx.fillText('All players have perished', ctx.canvas.width / 2, ctx.canvas.height / 2);
        
        // Additional info
        ctx.font = '16px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('In this game, death is permanent', ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
        ctx.fillText('There are no respawns or second chances', ctx.canvas.width / 2, ctx.canvas.height / 2 + 60);
        
        // Timer or restart instruction
        if (this.gameOverTime > 2.0) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText('The page will reload shortly...', ctx.canvas.width / 2, ctx.canvas.height / 2 + 100);
        }
        
        ctx.restore();
        
        // Reset text alignment
        ctx.textAlign = 'left';
    }
    
    // Statistics and info methods
    getGameStats() {
        const players = Array.from(this.gameEngine.players.values());
        return {
            totalPlayers: players.length,
            alivePlayers: players.filter(p => p.isAlive).length,
            deadPlayers: players.filter(p => !p.isAlive).length,
            gameOver: this.gameOverTriggered
        };
    }
    
    reset() {
        this.gameOverTriggered = false;
        this.gameOverTime = 0;
        this.deathMessages = [];
    }
}