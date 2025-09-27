import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const rooms = Array.from(gameRooms.entries()).map(([code, room]) => ({
        code,
        playerCount: room.players.length,
        gameState: room.gameState,
        players: room.players.map(p => ({
            name: p.name,
            connected: p.connected,
            ready: p.ready || false
        }))
    }));
    res.json(rooms);
});

// API route to get specific room info
app.get('/api/rooms/:code', (req, res) => {
    const room = gameRooms.get(req.params.code.toUpperCase());
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json({
        code: room.code,
        playerCount: room.players.length,
        gameState: room.gameState,
        currentLevel: room.currentLevel,
        players: room.players.map(p => ({
            name: p.name,
            connected: p.connected,
            ready: p.ready || false,
            isHost: p.isHost
        }))
    });
});

// Game rooms storage
const gameRooms = new Map();

// Generate unique room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
                connected: true
            }],
            gameState: 'waiting', // waiting, playing, ended
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
            connected: true
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
            player.ready = true;
            
            // Check if all players are ready and room has 3 players
            const allReady = room.players.length === 3 && room.players.every(p => p.ready);
            
            io.to(roomCode).emit('roomUpdate', {
                players: room.players,
                gameState: room.gameState,
                allReady: allReady
            });
            
            if (allReady) {
                // Start game countdown
                setTimeout(() => {
                    room.gameState = 'playing';
                    io.to(roomCode).emit('gameStart', {
                        level: 0,
                        players: room.players
                    });
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
    
    // Handle player actions (movement, attacks, etc.)
    socket.on('playerAction', (action) => {
        const roomCode = socket.roomCode;
        if (roomCode) {
            // Broadcast action to all players in room except sender
            socket.to(roomCode).emit('playerAction', {
                playerId: socket.id,
                action: action,
                timestamp: Date.now()
            });
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        const roomCode = socket.roomCode;
        if (roomCode) {
            const room = gameRooms.get(roomCode);
            if (room) {
                const player = room.players.find(p => p.id === socket.id);
                if (player) {
                    player.connected = false;
                    
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
                    
                    // Clean up empty rooms or rooms with no connected players
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
                    }
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

server.listen(PORT, () => {
    console.log(`Sacrifices Must Be Made server running on port ${PORT}`);
    console.log(`Game available at: http://localhost:${PORT}`);
});