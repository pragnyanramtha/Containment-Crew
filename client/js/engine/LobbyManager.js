export class LobbyManager {
    constructor(networkManager) {
        this.networkManager = networkManager;
        this.currentScreen = 'mainMenu';
        this.isReady = false;
        this.roomData = null;
        this.playerId = null;
        this.playerName = null;
        
        // Bind methods
        this.showScreen = this.showScreen.bind(this);
        this.showError = this.showError.bind(this);
        this.clearError = this.clearError.bind(this);
        
        this.initializeEventListeners();
        this.setupNetworkListeners();
    }
    
    initializeEventListeners() {
        // Main menu buttons
        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.showScreen('createRoomMenu');
        });
        
        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.showScreen('joinRoomMenu');
        });
        
        // Create room menu
        document.getElementById('confirmCreateBtn').addEventListener('click', () => {
            this.handleCreateRoom();
        });
        
        document.getElementById('backFromCreateBtn').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Join room menu
        document.getElementById('confirmJoinBtn').addEventListener('click', () => {
            this.handleJoinRoom();
        });
        
        document.getElementById('backFromJoinBtn').addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Waiting room
        document.getElementById('readyBtn').addEventListener('click', () => {
            this.handleReadyToggle();
        });
        
        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.handleLeaveRoom();
        });
        
        // Input validation
        this.setupInputValidation();
    }
    
    setupInputValidation() {
        // Name inputs - only allow alphanumeric and spaces
        const nameInputs = ['hostNameInput', 'playerNameInput'];
        nameInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (inputId === 'hostNameInput') {
                        this.handleCreateRoom();
                    } else {
                        document.getElementById('roomCodeInput').focus();
                    }
                }
            });
        });
        
        // Room code input - only allow alphanumeric, convert to uppercase
        const roomCodeInput = document.getElementById('roomCodeInput');
        roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        });
        
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleJoinRoom();
            }
        });
    }
    
    setupNetworkListeners() {
        // Set up network event listeners
        this.networkManager.onRoomCreated = (data) => {
            this.handleRoomCreated(data);
        };
        
        this.networkManager.onRoomJoined = (data) => {
            this.handleRoomJoined(data);
        };
        
        this.networkManager.onRoomUpdate = (data) => {
            this.handleRoomUpdate(data);
        };
        
        this.networkManager.onJoinError = (error) => {
            this.showError(error.message);
        };
        
        this.networkManager.onGameStart = (data) => {
            this.handleGameStart(data);
        };
        
        this.networkManager.onPlayerJoined = (data) => {
            this.showMessage(`${data.playerName} joined the room`);
        };
        
        this.networkManager.onPlayerLeft = (data) => {
            this.showMessage(`${data.playerName} left the room`);
        };
        
        this.networkManager.onConnectionChange = (connected) => {
            this.updateConnectionStatus(connected);
        };
    }
    
    showScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.menu-section');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            this.clearError();
            
            // Focus first input if available
            const firstInput = targetScreen.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }
    
    handleCreateRoom() {
        const nameInput = document.getElementById('hostNameInput');
        const playerName = nameInput.value.trim();
        
        if (!this.validatePlayerName(playerName)) {
            return;
        }
        
        if (!this.networkManager.isConnected) {
            this.showError('Not connected to server. Please wait and try again.');
            return;
        }
        
        this.playerName = playerName;
        this.networkManager.createRoom(playerName);
    }
    
    handleJoinRoom() {
        const nameInput = document.getElementById('playerNameInput');
        const codeInput = document.getElementById('roomCodeInput');
        
        const playerName = nameInput.value.trim();
        const roomCode = codeInput.value.trim().toUpperCase();
        
        if (!this.validatePlayerName(playerName)) {
            return;
        }
        
        if (!this.validateRoomCode(roomCode)) {
            return;
        }
        
        if (!this.networkManager.isConnected) {
            this.showError('Not connected to server. Please wait and try again.');
            return;
        }
        
        this.playerName = playerName;
        this.networkManager.joinRoom(roomCode, playerName);
    }
    
    handleReadyToggle() {
        if (!this.roomData) return;
        
        this.isReady = !this.isReady;
        this.networkManager.setPlayerReady(this.isReady);
        
        const readyBtn = document.getElementById('readyBtn');
        const readyStatus = document.getElementById('readyStatus');
        
        if (this.isReady) {
            readyBtn.textContent = 'NOT READY';
            readyBtn.classList.add('ready');
            readyStatus.textContent = 'Waiting for other players...';
        } else {
            readyBtn.textContent = 'READY';
            readyBtn.classList.remove('ready');
            readyStatus.textContent = 'Click READY when you\'re prepared to start';
        }
    }
    
    handleLeaveRoom() {
        this.networkManager.leaveRoom();
        this.roomData = null;
        this.isReady = false;
        this.playerId = null;
        this.showScreen('mainMenu');
        
        // Reset ready button
        const readyBtn = document.getElementById('readyBtn');
        const readyStatus = document.getElementById('readyStatus');
        readyBtn.textContent = 'READY';
        readyBtn.classList.remove('ready');
        readyStatus.textContent = 'Click READY when you\'re prepared to start';
    }
    
    handleRoomCreated(data) {
        this.roomData = data;
        this.playerId = data.playerId;
        
        document.getElementById('displayRoomCode').textContent = data.roomCode;
        this.showScreen('waitingRoom');
        this.updatePlayersList(data.players || [{ 
            id: data.playerId, 
            name: this.playerName, 
            isHost: true, 
            ready: false 
        }]);
    }
    
    handleRoomJoined(data) {
        this.roomData = data;
        this.playerId = data.playerId;
        
        document.getElementById('displayRoomCode').textContent = data.roomCode;
        this.showScreen('waitingRoom');
    }
    
    handleRoomUpdate(data) {
        if (!this.roomData) return;
        
        this.updatePlayersList(data.players);
        
        // Check if all players are ready
        if (data.allReady && data.players.length === 3) {
            document.getElementById('readyStatus').textContent = 'Starting game in 3 seconds...';
        }
    }
    
    handleGameStart(data) {
        // Hide lobby and show game
        document.getElementById('lobbyScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'flex';
        
        // Notify game engine that game is starting
        if (this.onGameStart) {
            this.onGameStart(data);
        }
    }
    
    updatePlayersList(players) {
        const playersList = document.getElementById('playersList');
        const playerCount = document.getElementById('playerCount');
        
        playerCount.textContent = players.length;
        
        playersList.innerHTML = '';
        
        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            const playerName = document.createElement('span');
            playerName.className = 'player-name';
            playerName.textContent = player.name;
            
            const playerStatus = document.createElement('span');
            playerStatus.className = 'player-status';
            
            if (player.isHost) {
                playerStatus.textContent = 'HOST';
                playerStatus.classList.add('host');
            } else if (player.ready) {
                playerStatus.textContent = 'READY';
                playerStatus.classList.add('ready');
            } else {
                playerStatus.textContent = 'WAITING';
                playerStatus.classList.add('waiting');
            }
            
            playerItem.appendChild(playerName);
            playerItem.appendChild(playerStatus);
            playersList.appendChild(playerItem);
        });
    }
    
    validatePlayerName(name) {
        if (!name || name.length < 2) {
            this.showError('Player name must be at least 2 characters long');
            return false;
        }
        
        if (name.length > 20) {
            this.showError('Player name must be 20 characters or less');
            return false;
        }
        
        return true;
    }
    
    validateRoomCode(code) {
        if (!code || code.length !== 6) {
            this.showError('Room code must be exactly 6 characters');
            return false;
        }
        
        return true;
    }
    
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.clearError();
        }, 5000);
    }
    
    clearError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.classList.remove('show');
    }
    
    showMessage(message) {
        // For now, just log to console. Could be enhanced with a toast system
        console.log('Lobby message:', message);
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('lobbyConnectionStatus');
        if (connected) {
            statusElement.textContent = 'Connected to server';
            statusElement.classList.add('connected');
            statusElement.classList.remove('disconnected');
        } else {
            statusElement.textContent = 'Disconnected from server';
            statusElement.classList.add('disconnected');
            statusElement.classList.remove('connected');
        }
    }
    
    // Public method to show lobby (called when returning from game)
    showLobby() {
        document.getElementById('lobbyScreen').style.display = 'flex';
        document.getElementById('gameScreen').style.display = 'none';
        this.showScreen('mainMenu');
    }
}