import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

/**
 * Proper multiplayer game state manager
 * Handles state synchronization, conflict resolution, and lag compensation
 */
export class GameStateManager extends EventEmitter {
    constructor() {
        super();
        
        // Game rooms
        this.rooms = new Map();
        
        // State sync settings - reduced frequency to prevent jittering
        this.syncInterval = 200; // 5 FPS state sync (reduced from 10 FPS)
        this.fullSyncInterval = 2000; // Full sync every 2 seconds (reduced from 1 second)
        
        // Start sync loops
        this.startSyncLoops();
    }
    
    /**
     * Create a new game room
     */
    createRoom(hostPlayerId, hostPlayerName) {
        const roomCode = this.generateRoomCode();
        
        const room = {
            code: roomCode,
            state: 'waiting', // waiting, playing, paused, ended
            currentLevel: 0,
            createdAt: Date.now(),
            lastUpdate: Date.now(),
            
            // Players
            players: new Map(),
            playerOrder: [], // For consistent ordering
            
            // Game state
            gameObjects: new Map(),
            
            // Sync tracking
            stateVersion: 0,
            lastFullSync: 0,
            
            // Settings
            maxPlayers: 3,
            tickRate: 60 // Server tick rate
        };
        
        // Store room first, then add host player
        this.rooms.set(roomCode, room);
        
        // Add host player
        const hostPlayer = this.addPlayerToRoom(roomCode, hostPlayerId, hostPlayerName, true);
        
        console.log(`🏠 Room ${roomCode} created by ${hostPlayerName}, host player:`, hostPlayer ? hostPlayer.name : 'failed');
        console.log(`🏠 Room now has ${room.players.size} players`);
        
        return room;
    }
    
    /**
     * Add player to room
     */
    addPlayerToRoom(roomCode, playerId, playerName, isHost = false) {
        const room = this.rooms.get(roomCode);
        if (!room) return null;
        
        if (room.players.size >= room.maxPlayers) {
            throw new Error('Room is full');
        }
        
        if (room.state !== 'waiting') {
            throw new Error('Game already in progress');
        }
        
        // Check for duplicate names
        for (const [, player] of room.players) {
            if (player.name === playerName) {
                throw new Error('Player name already taken');
            }
        }
        
        const player = {
            id: playerId,
            name: playerName,
            isHost: isHost,
            connected: true,
            ready: false,
            
            // Game state
            position: { x: 100 + (room.players.size * 50), y: 100 },
            velocity: { x: 0, y: 0 },
            health: 100,
            maxHealth: 100,
            isAlive: true,
            
            // Network state
            lastUpdate: Date.now(),
            lastInput: Date.now(),
            inputBuffer: [],
            
            // Lag compensation
            ping: 0,
            lastPingTime: 0
        };
        
        room.players.set(playerId, player);
        room.playerOrder.push(playerId);
        room.lastUpdate = Date.now();
        room.stateVersion++;
        
        console.log(`👤 Added player ${player.name} to room ${roomCode}, room now has ${room.players.size} players`);
        
        this.emit('playerJoined', { roomCode, player });
        
        return player;
    }
    
    /**
     * Remove player from room
     */
    removePlayerFromRoom(roomCode, playerId) {
        const room = this.rooms.get(roomCode);
        if (!room) return;
        
        const player = room.players.get(playerId);
        if (!player) return;
        
        room.players.delete(playerId);
        room.playerOrder = room.playerOrder.filter(id => id !== playerId);
        room.lastUpdate = Date.now();
        room.stateVersion++;
        
        this.emit('playerLeft', { roomCode, playerId, playerName: player.name });
        
        // Clean up empty rooms
        if (room.players.size === 0) {
            this.rooms.delete(roomCode);
            console.log(`Room ${roomCode} deleted - empty`);
        }
    }
    
    /**
     * Handle player input with lag compensation
     */
    handlePlayerInput(roomCode, playerId, input) {
        const room = this.rooms.get(roomCode);
        if (!room) return false;
        
        const player = room.players.get(playerId);
        if (!player || !player.connected) return false;
        
        // Add timestamp and sequence number
        input.timestamp = Date.now();
        input.sequence = (input.sequence || 0);
        
        // Validate input
        if (!this.validateInput(input, player)) {
            console.warn(`Invalid input from ${player.name}:`, input);
            return false;
        }
        
        // Apply input immediately for responsiveness
        this.applyPlayerInput(player, input);
        
        // Store in buffer for reconciliation
        player.inputBuffer.push(input);
        
        // Keep buffer size manageable
        if (player.inputBuffer.length > 60) { // 1 second at 60fps
            player.inputBuffer.shift();
        }
        
        player.lastInput = Date.now();
        room.lastUpdate = Date.now();
        room.stateVersion++;
        
        // Broadcast to other players
        this.emit('playerInput', { roomCode, playerId, input });
        
        return true;
    }
    
    /**
     * Validate player input
     */
    validateInput(input, player) {
        if (!input.type) return false;
        
        switch (input.type) {
            case 'move':
                // Validate movement bounds and speed
                if (input.x < 0 || input.x > 1920 || input.y < 0 || input.y > 1080) {
                    return false;
                }
                
                // Check movement speed (basic anti-cheat)
                if (player.position) {
                    const distance = Math.sqrt(
                        Math.pow(input.x - player.position.x, 2) + 
                        Math.pow(input.y - player.position.y, 2)
                    );
                    const timeDiff = Math.max(0.016, (Date.now() - player.lastUpdate) / 1000);
                    const speed = distance / timeDiff;
                    
                    if (speed > 300) { // Max speed check
                        return false;
                    }
                }
                return true;
                
            case 'attack':
            case 'dash':
            case 'interact':
                return true;
                
            default:
                return false;
        }
    }
    
    /**
     * Apply player input to game state
     */
    applyPlayerInput(player, input) {
        switch (input.type) {
            case 'move':
                player.position.x = input.x;
                player.position.y = input.y;
                player.velocity.x = input.vx || 0;
                player.velocity.y = input.vy || 0;
                break;
                
            case 'attack':
                // Handle attack logic
                break;
                
            case 'dash':
                // Handle dash logic
                break;
        }
        
        player.lastUpdate = Date.now();
    }
    
    /**
     * Get room state for synchronization
     */
    getRoomState(roomCode, full = false) {
        const room = this.rooms.get(roomCode);
        if (!room) return null;
        
        const state = {
            roomCode,
            state: room.state,
            currentLevel: room.currentLevel,
            stateVersion: room.stateVersion,
            timestamp: Date.now(),
            
            players: Array.from(room.players.values()).map(player => ({
                id: player.id,
                name: player.name,
                position: { ...player.position },
                velocity: { ...player.velocity },
                health: player.health,
                isAlive: player.isAlive,
                connected: player.connected,
                ready: player.ready
            }))
        };
        
        if (full) {
            // Include additional data for full sync
            state.gameObjects = Array.from(room.gameObjects.values());
            state.playerOrder = [...room.playerOrder];
        }
        
        return state;
    }
    
    /**
     * Start game in room
     */
    startGame(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room) return false;
        
        if (room.players.size !== room.maxPlayers) {
            return false;
        }
        
        // Check if all players are ready
        for (const [, player] of room.players) {
            if (!player.ready) {
                return false;
            }
        }
        
        room.state = 'playing';
        room.currentLevel = 0;
        room.lastUpdate = Date.now();
        room.stateVersion++;
        
        this.emit('gameStarted', { roomCode });
        
        return true;
    }
    
    /**
     * Set player ready status
     */
    setPlayerReady(roomCode, playerId, ready = true) {
        const room = this.rooms.get(roomCode);
        if (!room) return false;
        
        const player = room.players.get(playerId);
        if (!player) return false;
        
        player.ready = ready;
        room.lastUpdate = Date.now();
        room.stateVersion++;
        
        this.emit('playerReady', { roomCode, playerId, ready });
        
        return true;
    }
    
    /**
     * Update player ping
     */
    updatePlayerPing(roomCode, playerId, ping) {
        const room = this.rooms.get(roomCode);
        if (!room) return;
        
        const player = room.players.get(playerId);
        if (!player) return;
        
        player.ping = ping;
        player.lastPingTime = Date.now();
    }
    
    /**
     * Generate unique room code
     */
    generateRoomCode() {
        let code;
        do {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (this.rooms.has(code));
        return code;
    }
    
    /**
     * Start synchronization loops
     */
    startSyncLoops() {
        // Fast sync for active game states
        setInterval(() => {
            for (const [roomCode, room] of this.rooms) {
                if (room.state === 'playing') {
                    const state = this.getRoomState(roomCode, false);
                    this.emit('stateSync', { roomCode, state });
                }
            }
        }, this.syncInterval);
        
        // Full sync for reliability
        setInterval(() => {
            for (const [roomCode, room] of this.rooms) {
                if (room.state === 'playing') {
                    const state = this.getRoomState(roomCode, true);
                    this.emit('fullStateSync', { roomCode, state });
                    room.lastFullSync = Date.now();
                }
            }
        }, this.fullSyncInterval);
    }
    
    /**
     * Get all rooms (for debugging)
     */
    getAllRooms() {
        return Array.from(this.rooms.entries()).map(([code, room]) => ({
            code,
            playerCount: room.players.size,
            state: room.state,
            players: Array.from(room.players.values()).map(p => ({
                name: p.name,
                connected: p.connected,
                ready: p.ready
            }))
        }));
    }
}