export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.roomCode = null;
        this.playerId = null;
        
        // Event callbacks
        this.onConnectionChange = null;
        this.onGameStateUpdate = null;
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        
        this.updateConnectionStatus('Disconnected');
    }
    
    connect(serverUrl = 'http://localhost:3000') {
        console.log('Attempting to connect to server...');
        this.updateConnectionStatus('Connecting...');
        
        // Socket.IO connection will be implemented when server is ready
        // For now, simulate connection for testing
        setTimeout(() => {
            this.isConnected = true;
            this.updateConnectionStatus('Connected');
            console.log('Network manager initialized (simulation mode)');
        }, 1000);
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.isConnected = false;
        this.updateConnectionStatus('Disconnected');
    }
    
    joinRoom(roomCode) {
        if (!this.isConnected) {
            console.warn('Cannot join room: not connected to server');
            return false;
        }
        
        this.roomCode = roomCode;
        console.log(`Joining room: ${roomCode}`);
        // Room joining logic will be implemented with server
        return true;
    }
    
    createRoom() {
        if (!this.isConnected) {
            console.warn('Cannot create room: not connected to server');
            return null;
        }
        
        // Room creation logic will be implemented with server
        const roomCode = this.generateRoomCode();
        this.roomCode = roomCode;
        console.log(`Created room: ${roomCode}`);
        return roomCode;
    }
    
    sendPlayerAction(action) {
        if (!this.isConnected || !this.socket) {
            return;
        }
        
        // Send action to server
        console.log('Sending player action:', action);
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = 'connection-status';
            
            if (status === 'Connected') {
                statusElement.classList.add('connected');
            } else if (status === 'Disconnected') {
                statusElement.classList.add('disconnected');
            }
        }
    }
    
    generateRoomCode() {
        // Generate a 6-character room code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}