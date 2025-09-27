# Sacrifices Must Be Made

A browser-based multiplayer top-down 2D game for exactly 3 players. Set in a post-nuclear disaster scenario, players must work together through 6 levels where they progressively sacrifice team members to save humanity by shutting down a nuclear reactor.

## Project Structure

```
├── client/                 # Client-side code (browser)
│   ├── index.html         # Main HTML file with canvas
│   ├── styles.css         # CSS styling for pixel art game
│   └── js/                # JavaScript modules
│       ├── main.js        # Entry point and initialization
│       ├── engine/        # Game engine components
│       │   └── GameEngine.js
│       └── network/       # Networking components
│           └── NetworkManager.js
├── server/                # Server-side code (Node.js)
│   ├── package.json       # Server dependencies
│   └── server.js          # Express + Socket.IO server
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install server dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Development

The game uses:
- **Frontend**: HTML5 Canvas, JavaScript ES6+ modules, CSS3
- **Backend**: Node.js, Express, Socket.IO
- **Graphics**: 2D Canvas API with pixel art rendering
- **Real-time Communication**: WebSocket via Socket.IO

## Current Status

✅ Task 1: Project structure and HTML5 Canvas foundation
- Directory structure created
- HTML file with canvas element
- Basic CSS styling for pixel art
- JavaScript modules initialized
- Basic server setup with Express and Socket.IO
