import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { GameStateManager } from './GameStateManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// API route to get room info (for debugging)
app.get('/api/rooms', (req, res) => {
    const rooms = gameStateManager.getAllRooms();
    res.json(rooms);
});

// API route to get specific room info
app.get('/api/rooms/:code', (req, res) => {
    const roomState = gameStateManager.getRoomState(req.params.code.toUpperCase(), true);
    if (!roomState) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(roomState);
});

// Initialize game state manager
const gameStateManager = new GameStateManager();

// Game rooms storage
const gameRooms = new Map();

// Generate unique room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Clean up disconnected players after timeout
function cleanupDisconnectedPlayer(roomCode, playerName) {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.name === playerName);
    if (!player || player.connected) return; // Player reconnected

    console.log(`Cleaning up disconnected player: ${playerName} from room ${roomCode}`);

    // Remove player from room
    room.players = room.players.filter(p => p.name !== playerName);

    // Notify remaining players
    io.to(roomCode).emit('playerLeft', {
        playerName: playerName,
        reason: 'timeout'
    });

    // Check if room should be deleted
    const connectedPlayers = room.players.filter(p => p.connected);
    if (connectedPlayers.length === 0) {
        gameRooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted - no connected players`);
    } else {
        // Update room state
        io.to(roomCode).emit('roomUpdate', {
            players: room.players,
            gameState: room.gameState
        });

        // If only one player left, end the game
        if (room.players.length === 1) {
            room.gameState = 'ended';
            io.to(roomCode).emit('gameEnded', {
                reason: 'insufficient_players',
                message: 'Game ended - not enough players'
            });
        }
    }
}

// Validation system removed for compatibility

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Handle room creation
    socket.on('createRoom', (playerName) => {
        const roomCode = generateRoomCode();
        const room = {
            code: roomCode,
            players: [{
                id: socket.id,
                name: playerName,
                isHost: true,
                connected: true,
                lastPosition: { x: 100, y: 100 },
                lastActionTime: Date.now(),
                lastAttackTime: 0,
                lastDashTime: 0,
                disconnectedAt: null,
                health: 100,
                isAlive: true
            }],
            gameState: 'waiting', // waiting, playing, paused, ended
            currentLevel: 0
        };

        gameRooms.set(roomCode, room);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`Room ${roomCode} created by ${playerName} (${socket.id})`);

        socket.emit('roomCreated', {
            roomCode: roomCode,
            playerId: socket.id,
            playerName: playerName,
            isHost: true
        });

        // Broadcast room update to all players in room
        io.to(roomCode).emit('roomUpdate', {
            players: room.players,
            gameState: room.gameState
        });
    });

    // Handle room joining
    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        const room = gameRooms.get(roomCode);

        if (!room) {
            socket.emit('joinError', { message: 'Room not found' });
            return;
        }

        if (room.players.length >= 3) {
            socket.emit('joinError', { message: 'Room is full (3 players maximum)' });
            return;
        }

        if (room.gameState !== 'waiting') {
            socket.emit('joinError', { message: 'Game already in progress' });
            return;
        }

        // Check if player name already exists in room
        if (room.players.some(p => p.name === playerName)) {
            socket.emit('joinError', { message: 'Player name already taken in this room' });
            return;
        }

        // Add player to room
        const newPlayer = {
            id: socket.id,
            name: playerName,
            isHost: false,
            connected: true,
            lastPosition: { x: 100, y: 100 },
            lastActionTime: Date.now(),
            lastAttackTime: 0,
            lastDashTime: 0,
            disconnectedAt: null,
            health: 100,
            isAlive: true
        };

        room.players.push(newPlayer);
        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`${playerName} (${socket.id}) joined room ${roomCode}`);

        socket.emit('roomJoined', {
            roomCode: roomCode,
            playerId: socket.id,
            playerName: playerName,
            isHost: false
        });

        // Broadcast room update to all players in room
        io.to(roomCode).emit('roomUpdate', {
            players: room.players,
            gameState: room.gameState
        });

        // Notify other players
        socket.to(roomCode).emit('playerJoined', {
            playerId: socket.id,
            playerName: playerName
        });
    });

    // Handle player ready status
    socket.on('playerReady', () => {
        const roomCode = socket.roomCode;
        const room = gameRooms.get(roomCode);

        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.ready = !player.ready; // Toggle ready status

            console.log(`${player.name} is now ${player.ready ? 'ready' : 'not ready'} in room ${roomCode}`);

            // Check if all players are ready and room has 3 players
            const allReady = room.players.length === 3 && room.players.every(p => p.ready);

            io.to(roomCode).emit('roomUpdate', {
                players: room.players,
                gameState: room.gameState,
                allReady: allReady
            });

            if (allReady) {
                console.log(`All players ready in room ${roomCode}, starting game in 3 seconds...`);
                // Start game countdown
                setTimeout(() => {
                    room.gameState = 'playing';
                    io.to(roomCode).emit('gameStart', {
                        level: 0,
                        players: room.players
                    });
                    console.log(`Game started in room ${roomCode}`);
                }, 3000); // 3 second countdown
            }
        }
    });

    // Handle basic game messages
    socket.on('gameMessage', (data) => {
        const roomCode = socket.roomCode;
        if (roomCode) {
            // Broadcast message to all players in room except sender
            socket.to(roomCode).emit('gameMessage', {
                playerId: socket.id,
                ...data
            });
        }
    });

    // Handle player actions (movement, attacks, etc.) with enhanced validation
    socket.on('playerAction', (action) => {
        const roomCode = socket.roomCode;
        if (!roomCode) return;

        const room = gameRooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        // Validation removed for compatibility - process action directly

        // Update player's state tracking
        if (action.x !== undefined && action.y !== undefined) {
            player.lastPosition = { x: action.x, y: action.y };
        }

        // Update action-specific timestamps
        player.lastActionTime = Date.now();
        if (action.type === 'attack') {
            player.lastAttackTime = Date.now();
        } else if (action.type === 'dash') {
            player.lastDashTime = Date.now();
        }

        // Broadcast validated action to all players in room except sender
        socket.to(roomCode).emit('playerAction', {
            playerId: socket.id,
            action: action,
            timestamp: Date.now(),
            validated: true
        });

        // Reduced frequency of authoritative state updates to prevent conflicts
        if (Math.random() < 0.02) { // 2% chance to send state sync (reduced from 10%)
            broadcastGameState(roomCode);
        }
    });

    // Handle state synchronization requests
    socket.on('requestStateSync', () => {
        const roomCode = socket.roomCode;
        if (roomCode) {
            broadcastGameState(roomCode);
        }
    });

    // Cheat reporting removed for compatibility

    // Handle ping for latency monitoring
    socket.on('ping', (timestamp) => {
        socket.emit('pong', timestamp);
    });

    // Handle room rejoining after disconnection
    socket.on('rejoinRoom', (data) => {
        const { roomCode, playerName, playerId } = data;
        const room = gameRooms.get(roomCode);

        if (!room) {
            socket.emit('rejoinError', { message: 'Room no longer exists' });
            return;
        }

        // Find player by name (since socket ID changes on reconnection)
        const player = room.players.find(p => p.name === playerName);

        if (!player) {
            socket.emit('rejoinError', { message: 'Player not found in room' });
            return;
        }

        // Update player connection info
        player.connected = true;
        player.id = socket.id; // Update to new socket ID
        socket.join(roomCode);
        socket.roomCode = roomCode;

        console.log(`${playerName} (${socket.id}) rejoined room ${roomCode}`);

        socket.emit('rejoinSuccess', {
            roomCode: roomCode,
            playerId: socket.id,
            playerName: playerName,
            gameState: room.gameState,
            currentLevel: room.currentLevel
        });

        // Check if all players are now connected
        const allConnected = room.players.every(p => p.connected);

        if (allConnected && room.gameState === 'paused') {
            // Resume game if it was paused due to disconnections
            room.gameState = 'playing';
            io.to(roomCode).emit('gameResumed', {
                message: 'All players reconnected'
            });
            console.log(`Game resumed in room ${roomCode} - all players reconnected`);
        }

        // Notify other players
        socket.to(roomCode).emit('playerReconnected', {
            playerId: socket.id,
            playerName: playerName
        });

        // Send current room state
        io.to(roomCode).emit('roomUpdate', {
            players: room.players,
            gameState: room.gameState
        });
    });

    // Handle disconnection with timeout for reconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);

        const roomCode = socket.roomCode;
        if (roomCode) {
            const room = gameRooms.get(roomCode);
            if (room) {
                const player = room.players.find(p => p.id === socket.id);
                if (player) {
                    player.connected = false;
                    player.disconnectedAt = Date.now();

                    console.log(`${player.name} disconnected from room ${roomCode}`);

                    // Notify other players
                    socket.to(roomCode).emit('playerDisconnected', {
                        playerId: socket.id,
                        playerName: player.name
                    });

                    // If game is in progress, pause it
                    if (room.gameState === 'playing') {
                        room.gameState = 'paused';
                        io.to(roomCode).emit('gamePaused', {
                            reason: `${player.name} disconnected`,
                            disconnectedPlayer: player.name
                        });
                    }

                    // Set timeout for player cleanup (5 minutes)
                    setTimeout(() => {
                        cleanupDisconnectedPlayer(roomCode, player.name);
                    }, 300000); // 5 minutes

                    // Update room state
                    io.to(roomCode).emit('roomUpdate', {
                        players: room.players,
                        gameState: room.gameState
                    });
                }
            }
        }
    });

    // Handle reconnection
    socket.on('reconnect', (data) => {
        const { roomCode, playerId } = data;
        const room = gameRooms.get(roomCode);

        if (room) {
            const player = room.players.find(p => p.id === playerId);
            if (player) {
                // Update player connection status
                player.connected = true;
                player.id = socket.id; // Update socket ID
                socket.join(roomCode);
                socket.roomCode = roomCode;

                console.log(`${player.name} reconnected to room ${roomCode}`);

                socket.emit('reconnected', {
                    roomCode: roomCode,
                    playerId: socket.id,
                    playerName: player.name
                });

                // Resume game if it was paused due to disconnection
                if (room.gameState === 'paused') {
                    const allConnected = room.players.every(p => p.connected);
                    if (allConnected) {
                        room.gameState = 'playing';
                        io.to(roomCode).emit('gameResumed', {
                            message: 'All players reconnected'
                        });
                    }
                }

                // Notify other players
                socket.to(roomCode).emit('playerReconnected', {
                    playerId: socket.id,
                    playerName: player.name
                });

                // Send current room state to reconnected player
                io.to(roomCode).emit('roomUpdate', {
                    players: room.players,
                    gameState: room.gameState
                });
            }
        }
    });

    // Basic connection confirmation
    socket.emit('connected', {
        message: 'Connected to Sacrifices Must Be Made server',
        playerId: socket.id
    });
});

// Broadcast authoritative game state to all players in a room
function broadcastGameState(roomCode) {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    const gameState = {
        roomCode: roomCode,
        currentLevel: room.currentLevel,
        gameState: room.gameState,
        players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            x: p.lastPosition.x,
            y: p.lastPosition.y,
            health: p.health,
            isAlive: p.isAlive,
            connected: p.connected
        })),
        timestamp: Date.now()
    };

    io.to(roomCode).emit('gameStateSync', gameState);
}

// Periodic state synchronization (every 5 seconds) - TEMPORARILY DISABLED
// setInterval(() => {
//     for (const [roomCode, room] of gameRooms.entries()) {
//         if (room.gameState === 'playing') {
//             broadcastGameState(roomCode);
//         }
//     }
// }, 5000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sacrifices Must Be Made server running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);

    // Get and display network IP addresses
    const networkInterfaces = os.networkInterfaces();

    console.log('\n🌐 Network Access URLs:');
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(networkInterface => {
            if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                console.log(`   http://${networkInterface.address}:${PORT}`);
            }
        });
    });
    console.log('\nShare these URLs with friends on your network!\n');
});