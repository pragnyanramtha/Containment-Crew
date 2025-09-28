export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.roomCode = null;
        this.playerId = null;
        this.playerName = null;
        
        // Connection state management
        this.connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'reconnecting', 'error'
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.reconnectTimer = null;
        this.connectionTimeout = null;
        this.connectionTimeoutDuration = 10000; // 10 seconds
        
        // Game state management
        this.gameState = 'waiting'; // 'waiting', 'playing', 'paused', 'ended'
        this.lastKnownGameState = null;
        this.isGamePaused = false;
        
        // Network quality monitoring
        this.lastPingTime = 0;
        this.pingInterval = null;
        this.latency = 0;
        this.connectionQuality = 'good'; // 'good', 'poor', 'bad'
        
        // Message queue for offline actions
        this.messageQueue = [];
        this.maxQueueSize = 100;
        
        // Event callbacks
        this.onConnectionChange = null;
        this.onGameStateUpdate = null;
        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onNetworkError = null;
        this.onReconnectAttempt = null;
        this.onGamePaused = null;
        this.onGameResumed = null;
        
        // Lobby callbacks
        this.onRoomCreated = null;
        this.onRoomJoined = null;
        this.onRoomUpdate = null;
        this.onJoinError = null;
        this.onGameStart = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        
        this.updateConnectionStatus('Disconnected');
    }
    
    connect(serverUrl = null) {
        if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
            console.log('Already connected or connecting');
            return;
        }
        
        // Auto-detect server URL if not provided
        if (!serverUrl) {
            serverUrl = `${window.location.protocol}//${window.location.host}`;
        }
        
        console.log('Attempting to connect to server:', serverUrl);
        this.connectionState = 'connecting';
        this.updateConnectionStatus('Connecting...');
        
        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
            this.handleConnectionTimeout();
        }, this.connectionTimeoutDuration);
        
        // Load Socket.IO from CDN if not already loaded
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = '/socket.io/socket.io.js';
            script.onload = () => {
                this.initializeSocket(serverUrl);
            };
            script.onerror = () => {
                console.error('Failed to load Socket.IO');
                this.handleConnectionError('Failed to load Socket.IO library');
            };
            document.head.appendChild(script);
        } else {
            this.initializeSocket(serverUrl);
        }
    }
    
    initializeSocket(serverUrl) {
        try {
            console.log('Initializing socket connection to:', serverUrl);
            this.socket = io(serverUrl, {
                timeout: 10000, // Increased timeout for network connections
                reconnection: false, // We'll handle reconnection manually
                forceNew: true,
                transports: ['websocket', 'polling'] // Allow fallback to polling
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.handleSuccessfulConnection();
            });
            
            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected from server:', reason);
                this.handleDisconnection(reason);
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.handleConnectionError(error.message || 'Connection failed');
            });
            
            // Room management events
            this.socket.on('roomCreated', (data) => {
                console.log('Room created:', data);
                if (this.onRoomCreated) {
                    this.onRoomCreated(data);
                }
            });
            
            this.socket.on('roomJoined', (data) => {
                console.log('Room joined:', data);
                if (this.onRoomJoined) {
                    this.onRoomJoined(data);
                }
            });
            
            this.socket.on('roomUpdate', (data) => {
                console.log('Room update:', data);
                if (this.onRoomUpdate) {
                    this.onRoomUpdate(data);
                }
            });
            
            this.socket.on('joinError', (error) => {
                console.log('Join error:', error);
                if (this.onJoinError) {
                    this.onJoinError(error);
                }
            });
            
            this.socket.on('gameStart', (data) => {
                console.log('Game starting:', data);
                if (this.onGameStart) {
                    this.onGameStart(data);
                }
            });
            
            this.socket.on('playerJoined', (data) => {
                console.log('Player joined:', data);
                if (this.onPlayerJoined) {
                    this.onPlayerJoined(data);
                }
            });
            
            this.socket.on('playerDisconnected', (data) => {
                console.log('Player disconnected:', data);
                if (this.onPlayerLeft) {
                    this.onPlayerLeft(data);
                }
            });
            
            // Game events
            this.socket.on('playerAction', (data) => {
                console.log('Received player action:', data);
                if (this.onPlayerAction) {
                    this.onPlayerAction(data);
                }
            });
            
            // Network quality events
            this.socket.on('pong', (timestamp) => {
                this.handlePong(timestamp);
            });
            
            // Game state events
            this.socket.on('gamePaused', (data) => {
                console.log('Game paused by server:', data);
                this.pauseGame(data.reason || 'Server paused game');
            });
            
            this.socket.on('gameResumed', (data) => {
                console.log('Game resumed by server:', data);
                this.resumeGame();
            });
            
            // Reconnection events
            this.socket.on('rejoinSuccess', (data) => {
                console.log('Successfully rejoined room:', data);
                if (this.onRoomJoined) {
                    this.onRoomJoined(data);
                }
                
                // Resume game if it was paused due to disconnection
                if (this.isGamePaused && data.gameState === 'playing') {
                    this.resumeGame();
                }
            });
            
            this.socket.on('rejoinError', (error) => {
                console.error('Failed to rejoin room:', error);
                this.roomCode = null;
                this.playerName = null;
                
                if (this.onJoinError) {
                    this.onJoinError(error);
                }
            });
            
            // Game state synchronization
            this.socket.on('gameStateSync', (gameState) => {
                console.log('Received game state sync:', gameState);
                
                // Validate the game state if validation manager is available
                if (this.gameEngine && this.gameEngine.validationManager) {
                    const validation = this.gameEngine.validationManager.validateGameState(gameState);
                    if (!validation.valid) {
                        console.warn('Game state validation failed:', validation.issues);
                        // Request fresh state sync
                        this.requestStateSync();
                        return;
                    }
                }
                
                // Apply game state to local game
                if (this.onGameStateUpdate) {
                    this.onGameStateUpdate(gameState);
                }
            });
            
            // Handle being kicked for violations
            this.socket.on('kicked', (data) => {
                console.error('Kicked from server:', data);
                this.handleConnectionError(`Kicked: ${data.reason}`);
                
                if (this.onNetworkError) {
                    this.onNetworkError(`Kicked from server: ${data.reason}`);
                }
            });
            
        } catch (error) {
            console.error('Socket initialization error:', error);
            this.handleConnectionError('Socket initialization failed');
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.isConnected = false;
        this.updateConnectionStatus('Disconnected');
    }
    
    createRoom(playerName) {
        if (!this.isConnected || !this.socket) {
            console.warn('Cannot create room: not connected to server');
            if (this.onJoinError) {
                this.onJoinError({ message: 'Not connected to server' });
            }
            return false;
        }
        
        this.playerName = playerName;
        console.log(`Creating room for player: ${playerName}`);
        this.socket.emit('createRoom', playerName);
        return true;
    }
    
    joinRoom(roomCode, playerName) {
        if (!this.isConnected || !this.socket) {
            console.warn('Cannot join room: not connected to server');
            if (this.onJoinError) {
                this.onJoinError({ message: 'Not connected to server' });
            }
            return false;
        }
        
        this.roomCode = roomCode;
        this.playerName = playerName;
        console.log(`Joining room: ${roomCode} as ${playerName}`);
        this.socket.emit('joinRoom', { roomCode, playerName });
        return true;
    }
    
    setPlayerReady(ready) {
        if (!this.isConnected || !this.socket) {
            console.warn('Cannot set ready status: not connected to server');
            return false;
        }
        
        console.log(`Setting ready status: ${ready}`);
        this.socket.emit('playerReady');
        return true;
    }
    
    leaveRoom() {
        if (!this.isConnected || !this.socket) {
            return;
        }
        
        console.log('Leaving room');
        this.socket.disconnect();
        this.socket.connect();
        this.roomCode = null;
    }
    
    sendPlayerAction(action) {
        if (!this.isConnected || !this.socket) {
            // Queue the action if not connected
            this.queueMessage('playerAction', action);
            return;
        }
        
        // Send action to server
        console.log('Sending player action:', action);
        this.socket.emit('playerAction', action);
    }
    
    // Enhanced method with validation
    sendValidatedPlayerAction(action) {
        // Client-side validation first (if validation manager is available)
        if (this.gameEngine && this.gameEngine.validationManager) {
            const validation = this.gameEngine.validationManager.validatePlayerAction(this.playerId, action);
            if (!validation.valid) {
                console.warn('Client-side validation failed:', validation.reason);
                return false;
            }
        }
        
        this.sendPlayerAction(action);
        return true;
    }
    
    // Request state synchronization from server
    requestStateSync() {
        if (this.isConnected && this.socket) {
            this.socket.emit('requestStateSync');
        }
    }
    
    // Report suspected cheating
    reportCheat(suspectedPlayerId, reason, evidence) {
        if (this.isConnected && this.socket) {
            this.socket.emit('reportCheat', {
                suspectedPlayerId,
                reason,
                evidence,
                timestamp: Date.now()
            });
        }
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
    
    // Connection state management methods
    handleSuccessfulConnection() {
        // Clear any existing timeouts
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        
        this.isConnected = true;
        this.connectionState = 'connected';
        this.playerId = this.socket.id;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000; // Reset delay
        
        this.updateConnectionStatus('Connected');
        this.startPingMonitoring();
        
        // Process any queued messages
        this.processMessageQueue();
        
        // Attempt to rejoin room if we were in one
        if (this.roomCode && this.playerName) {
            console.log('Attempting to rejoin room after reconnection...');
            this.rejoinRoom();
        }
        
        if (this.onConnectionChange) {
            this.onConnectionChange(true);
        }
    }
    
    handleDisconnection(reason) {
        this.isConnected = false;
        this.connectionState = 'disconnected';
        this.stopPingMonitoring();
        
        // Pause game if it was playing
        if (this.gameState === 'playing') {
            this.pauseGame('Connection lost');
        }
        
        this.updateConnectionStatus('Disconnected');
        
        if (this.onConnectionChange) {
            this.onConnectionChange(false);
        }
        
        // Attempt reconnection unless it was intentional
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
            this.attemptReconnection();
        }
    }
    
    handleConnectionError(errorMessage) {
        console.error('Network error:', errorMessage);
        
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        
        this.connectionState = 'error';
        this.updateConnectionStatus(`Error: ${errorMessage}`);
        
        if (this.onNetworkError) {
            this.onNetworkError(errorMessage);
        }
        
        // Attempt reconnection after a delay
        this.attemptReconnection();
    }
    
    handleConnectionTimeout() {
        console.warn('Connection attempt timed out');
        this.handleConnectionError('Connection timeout');
    }
    
    attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.connectionState = 'error';
            this.updateConnectionStatus('Connection failed - max attempts reached');
            
            if (this.onNetworkError) {
                this.onNetworkError('Unable to reconnect after multiple attempts');
            }
            return;
        }
        
        this.reconnectAttempts++;
        this.connectionState = 'reconnecting';
        
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
        
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
        this.updateConnectionStatus(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        if (this.onReconnectAttempt) {
            this.onReconnectAttempt(this.reconnectAttempts, this.maxReconnectAttempts);
        }
        
        this.reconnectTimer = setTimeout(() => {
            if (this.socket) {
                this.socket.disconnect();
            }
            this.connect();
        }, delay);
    }
    
    rejoinRoom() {
        if (!this.roomCode || !this.playerName) {
            return;
        }
        
        console.log(`Rejoining room ${this.roomCode} as ${this.playerName}...`);
        this.socket.emit('rejoinRoom', {
            roomCode: this.roomCode,
            playerName: this.playerName,
            playerId: this.playerId
        });
    }
    
    // Network quality monitoring
    startPingMonitoring() {
        this.pingInterval = setInterval(() => {
            this.sendPing();
        }, 5000); // Ping every 5 seconds
    }
    
    stopPingMonitoring() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    sendPing() {
        if (!this.isConnected || !this.socket) {
            return;
        }
        
        this.lastPingTime = Date.now();
        this.socket.emit('ping', this.lastPingTime);
    }
    
    handlePong(timestamp) {
        const now = Date.now();
        this.latency = now - timestamp;
        
        // Update connection quality based on latency
        if (this.latency < 100) {
            this.connectionQuality = 'good';
        } else if (this.latency < 300) {
            this.connectionQuality = 'poor';
        } else {
            this.connectionQuality = 'bad';
        }
        
        console.log(`Latency: ${this.latency}ms (${this.connectionQuality})`);
    }
    
    // Game state management
    pauseGame(reason) {
        if (this.isGamePaused) {
            return;
        }
        
        this.isGamePaused = true;
        this.gameState = 'paused';
        
        console.log(`Game paused: ${reason}`);
        
        if (this.onGamePaused) {
            this.onGamePaused(reason);
        }
    }
    
    resumeGame() {
        if (!this.isGamePaused) {
            return;
        }
        
        this.isGamePaused = false;
        this.gameState = 'playing';
        
        console.log('Game resumed');
        
        if (this.onGameResumed) {
            this.onGameResumed();
        }
    }
    
    // Message queue management
    queueMessage(eventName, data) {
        if (this.messageQueue.length >= this.maxQueueSize) {
            // Remove oldest message
            this.messageQueue.shift();
        }
        
        this.messageQueue.push({
            eventName,
            data,
            timestamp: Date.now()
        });
        
        console.log(`Queued message: ${eventName} (queue size: ${this.messageQueue.length})`);
    }
    
    processMessageQueue() {
        if (!this.isConnected || this.messageQueue.length === 0) {
            return;
        }
        
        console.log(`Processing ${this.messageQueue.length} queued messages...`);
        
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            
            // Check if message is not too old (30 seconds)
            if (Date.now() - message.timestamp < 30000) {
                this.socket.emit(message.eventName, message.data);
            } else {
                console.log(`Discarding old message: ${message.eventName}`);
            }
        }
    }
    
    // Enhanced send methods with queuing
    sendPlayerActionSafe(action) {
        if (this.isConnected && this.socket) {
            this.socket.emit('playerAction', action);
        } else {
            // Queue the action for later
            this.queueMessage('playerAction', action);
        }
    }
    
    // Connection status and diagnostics
    getConnectionInfo() {
        return {
            isConnected: this.isConnected,
            connectionState: this.connectionState,
            reconnectAttempts: this.reconnectAttempts,
            latency: this.latency,
            connectionQuality: this.connectionQuality,
            gameState: this.gameState,
            isGamePaused: this.isGamePaused,
            queuedMessages: this.messageQueue.length
        };
    }
    
    // Cleanup method
    destroy() {
        // Clear all timers
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }
        
        this.stopPingMonitoring();
        
        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
        }
        
        // Clear message queue
        this.messageQueue = [];
        
        // Reset state
        this.isConnected = false;
        this.connectionState = 'disconnected';
    }
}