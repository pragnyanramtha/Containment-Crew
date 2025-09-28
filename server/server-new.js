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

// Initialize game state manager
const gameStateManager = new GameStateManager();

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// API routes
app.get('/api/rooms', (req, res) => {
    const rooms = gameStateManager.getAllRooms();
    res.json(rooms);
});

app.get('/api/rooms/:code', (req, res) => {
    const roomState = gameStateManager.getRoomState(req.params.code.toUpperCase(), true);
    if (!roomState) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(roomState);
});

// Set up GameStateManager event handlers
gameStateManager.on('playerJoined', ({ roomCode, player }) => {
    const roomState = gameStateManager.getRoomState(roomCode);
    io.to(roomCode).emit('roomUpdate', {
        players: roomState.players,
        gameState: roomState.state
    });
    
    io.to(roomCode).emit('playerJoined', {
        playerId: player.id,
        playerName: player.name
    });
});

gameStateManager.on('playerLeft', ({ roomCode, playerId, playerName }) => {
    const roomState = gameStateManager.getRoomState(roomCode);
    if (roomState) {
        io.to(roomCode).emit('roomUpdate', {
            players: roomState.players,
            gameState: roomState.state
        });
    }
    
    io.to(roomCode).emit('playerLeft', {
        playerId,
        playerName
    });
});

gameStateManager.on('playerReady', ({ roomCode, playerId, ready }) => {
    const roomState = gameStateManager.getRoomState(roomCode);
    if (roomState) {
        const allReady = roomState.players.length === 3 && roomState.players.every(p => p.ready);
        
        io.to(roomCode).emit('roomUpdate', {
            players: roomState.players,
            gameState: roomState.state,
            allReady: allReady
        });
        
        // Auto-start game if all players ready
        if (allReady && roomState.state === 'waiting') {
            setTimeout(() => {
                if (gameStateManager.startGame(roomCode)) {
                    const updatedState = gameStateManager.getRoomState(roomCode);
                    io.to(roomCode).emit('gameStart', {
                        level: updatedState.currentLevel,
                        players: updatedState.players
                    });
                }
            }, 3000);
        }
    }
});

gameStateManager.on('gameStarted', ({ roomCode }) => {
    console.log(`Game started in room ${roomCode}`);
});

gameStateManager.on('playerInput', ({ roomCode, playerId, input }) => {
    // Broadcast input to other players for immediate feedback
    io.to(roomCode).except(playerId).emit('playerAction', {
        playerId,
        action: input,
        timestamp: Date.now(),
        validated: true
    });
});

gameStateManager.on('stateSync', ({ roomCode, state }) => {
    // Send lightweight state updates
    io.to(roomCode).emit('gameStateSync', state);
});

gameStateManager.on('fullStateSync', ({ roomCode, state }) => {
    // Send full state for reliability
    io.to(roomCode).emit('gameStateFull', state);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Handle room creation
    socket.on('createRoom', (playerName) => {
        try {
            const room = gameStateManager.createRoom(socket.id, playerName);
            socket.join(room.code);
            socket.roomCode = room.code;
            
            socket.emit('roomCreated', {
                roomCode: room.code,
                playerId: socket.id,
                playerName: playerName,
                isHost: true
            });
        } catch (error) {
            socket.emit('createError', { message: error.message });
        }
    });
    
    // Handle room joining
    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        
        try {
            gameStateManager.addPlayerToRoom(roomCode, socket.id, playerName);
            socket.join(roomCode);
            socket.roomCode = roomCode;
            
            socket.emit('roomJoined', {
                roomCode: roomCode,
                playerId: socket.id,
                playerName: playerName,
                isHost: false
            });
        } catch (error) {
            socket.emit('joinError', { message: error.message });
        }
    });
    
    // Handle player ready status
    socket.on('playerReady', () => {
        const roomCode = socket.roomCode;
        if (roomCode) {
            // Toggle ready status
            const roomState = gameStateManager.getRoomState(roomCode);
            if (roomState) {
                const player = roomState.players.find(p => p.id === socket.id);
                if (player) {
                    gameStateManager.setPlayerReady(roomCode, socket.id, !player.ready);
                }
            }
        }
    });
    
    // Handle player actions with proper state management
    socket.on('playerAction', (action) => {
        const roomCode = socket.roomCode;
        if (roomCode) {
            // Use the game state manager to handle input properly
            gameStateManager.handlePlayerInput(roomCode, socket.id, action);
        }
    });
    
    // Handle ping for latency monitoring
    socket.on('ping', (timestamp) => {
        const roomCode = socket.roomCode;
        if (roomCode) {
            const ping = Date.now() - timestamp;
            gameStateManager.updatePlayerPing(roomCode, socket.id, ping);
        }
        socket.emit('pong', timestamp);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        const roomCode = socket.roomCode;
        if (roomCode) {
            gameStateManager.removePlayerFromRoom(roomCode, socket.id);
        }
    });
    
    // Basic connection confirmation
    socket.emit('connected', { 
        message: 'Connected to Sacrifices Must Be Made server',
        playerId: socket.id 
    });
});

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