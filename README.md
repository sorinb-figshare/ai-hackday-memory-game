# 🃏 Star Wars Memory Game

A turn-based memory card game built with Angular and Python WebSocket server, featuring characters from the Star Wars universe via the SWAPI (Star Wars API).

## 🎮 Features

- **Single Player Mode**: Play solo and test your memory skills
- **Multiplayer Mode**: Real-time turn-based gameplay against another player
- **Multiple Grid Sizes**: Choose from 4x4, 6x6, or 8x8 grids
- **Star Wars Theme**: Match cards featuring Star Wars characters
- **Leaderboard**: Track high scores for different game modes and grid sizes
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Synchronization**: Multiplayer moves are instantly synchronized

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/)
- **pip** (comes with Python)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd memory-game
```

### 2. Start the Backend Server

The WebSocket server handles multiplayer matchmaking and game state synchronization.

```bash
cd server
pip install -r requirements.txt
python game_server.py
```

The server will start on `ws://localhost:8765`

**Note**: Keep this terminal window open while playing.

### 3. Start the Frontend Client

Open a **new terminal window** and run:

```bash
cd client
npm install
npm start
```

The client will be available at `http://localhost:4200`

### 4. Play the Game!

1. Open your browser and navigate to `http://localhost:4200`
2. Enter your player name
3. Choose a grid size (4x4, 6x6, or 8x8)
4. Select game mode:
   - **Single Player**: Play alone and try to match all pairs
   - **Multiplayer**: Wait for another player to join and compete!

For multiplayer, open another browser window (or share the link with a friend on your network) and have a second player join with the same grid size.

## 📁 Project Structure

```
memory-game/
├── client/                  # Angular frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Game components
│   │   │   │   ├── initial-screen.component.ts
│   │   │   │   ├── leaderboard.component.ts
│   │   │   │   └── memory-game.component.ts
│   │   │   └── services/    # WebSocket service
│   │   │       └── websocket.service.ts
│   │   ├── styles.scss      # Global styles
│   │   └── index.html
│   ├── package.json
│   └── angular.json
└── server/                  # Python WebSocket server
    ├── game_server.py       # Main server file
    ├── requirements.txt     # Python dependencies
    └── README.md
```

## 🎯 How to Play

### Single Player Mode
1. Select "Single Player" mode
2. Click on cards to flip them over
3. Try to find matching pairs of Star Wars characters
4. Complete all pairs to win!
5. Your score and tries are tracked

### Multiplayer Mode
1. Select "Multiplayer" mode
2. Wait for another player to join with the same grid size
3. Take turns flipping two cards at a time
4. If you find a match, you score a point and continue your turn
5. If no match, the turn passes to your opponent
6. Player with the most matches wins!

## 🛠️ Technologies Used

### Frontend
- **Angular 19** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **RxJS** - Reactive programming for WebSocket handling
- **SCSS** - Styling with variables and nesting
- **SWAPI** - Star Wars API for character data

### Backend
- **Python 3** - Server-side language
- **websockets** - WebSocket server implementation
- **asyncio** - Asynchronous I/O for handling multiple connections
- **aiohttp** - Async HTTP client for external API calls

## 🔧 Development

### Frontend Development

```bash
cd client
npm start           # Start dev server
npm run build       # Build for production
npm test           # Run unit tests
npm run watch      # Build in watch mode
```

### Backend Development

```bash
cd server
python game_server.py    # Start the server
```

The server includes detailed logging to help with debugging multiplayer sessions.

## 🎨 Customization

### Change Grid Sizes
Edit the grid size options in `client/src/app/components/initial-screen.component.ts`:

```typescript
gridSizes = [4, 6, 8, 10];  // Add more sizes
```

### Change WebSocket Port
In `client/src/app/services/websocket.service.ts`, update:

```typescript
private wsUrl = 'ws://localhost:YOUR_PORT';
```

And in `server/game_server.py`:

```python
await websockets.serve(handler, "localhost", YOUR_PORT)
```

## 🐛 Troubleshooting

### Server Connection Issues
- Ensure the Python server is running on port 8765
- Check that no firewall is blocking the WebSocket connection
- Verify Python dependencies are installed: `pip list`

### Frontend Issues
- Clear browser cache and reload
- Ensure Node.js and npm are up to date
- Delete `node_modules` and run `npm install` again
- Check browser console for errors (F12)

### Multiplayer Not Working
- Both players must select the same grid size
- Ensure the WebSocket server is running
- Check that both clients can connect to `ws://localhost:8765`
- For playing across different machines, update the WebSocket URL to use the server's IP address instead of localhost

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Star Wars character data provided by [SWAPI](https://swapi.dev/)
- Inspired by the classic memory card game

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

---

**May the Force be with you!** 🌟

