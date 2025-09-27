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

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
    });
    
    // Basic connection test
    socket.emit('connected', { 
        message: 'Connected to Sacrifices Must Be Made server',
        playerId: socket.id 
    });
});

server.listen(PORT, () => {
    console.log(`Sacrifices Must Be Made server running on port ${PORT}`);
    console.log(`Game available at: http://localhost:${PORT}`);
});