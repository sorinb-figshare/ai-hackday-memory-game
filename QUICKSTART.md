# Memory Game - Quick Start Guide

## Running the Application

### 1. Start the WebSocket Server (Python)

```bash
cd server
pip install -r requirements.txt
python game_server.py
```

The server will start on `ws://localhost:8765`

### 2. Start the Angular Client

```bash
cd client
npm install
npm start
```

The client will be available at `http://localhost:4200`

## Features Implemented

### Frontend Changes

1. **Game Mode Selection**
   - Players can choose between "Single Player" and "Multiplayer" modes
   - Added to the initial screen component

2. **WebSocket Service** (`client/src/app/services/websocket.service.ts`)
   - Manages WebSocket connection to the game server
   - Handles message sending/receiving via RxJS observables
   - Auto-reconnection support

3. **Enhanced Memory Game Component**
   - **Single Player Mode**: Original gameplay experience
   - **Multiplayer Mode**: 
     - Real-time turn-based gameplay
     - Waiting room for opponent matching
     - Live scoreboard showing both players
     - Turn indicators showing whose turn it is
     - Card flipping synchronized across both players
     - Automatic turn switching after no match
     - Winner determination at game end

4. **UI Improvements**
   - Waiting screen while opponent connects
   - Player cards with active turn highlighting
   - Disabled card interaction when not your turn
   - Real-time status messages
   - Opponent move visualization

## Testing Multiplayer

1. Open two browser windows/tabs
2. In both windows, go to `http://localhost:4200`
3. In each window:
   - Enter a different player name
   - Select "Multiplayer" mode
   - Choose the SAME grid size (e.g., 4x4)
   - Click "Start Game"
4. The second player will be matched with the first
5. Take turns flipping cards!

## Game Flow

### Single Player
1. Select "Single Player" mode
2. Game starts immediately
3. Find all pairs to win

### Multiplayer
1. Select "Multiplayer" mode
2. Wait for opponent (or they join you)
3. Players take turns flipping 2 cards
4. If match found: same player continues
5. If no match: turn switches to opponent
6. Player with most matches wins!

## Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│   Browser 1     │◄──────────────────────────►│                 │
│  (Player 1)     │                             │   Python WS     │
└─────────────────┘                             │     Server      │
                                                 │   (Port 8765)   │
┌─────────────────┐         WebSocket          │                 │
│   Browser 2     │◄──────────────────────────►│                 │
│  (Player 2)     │                             └─────────────────┘
└─────────────────┘
```

## Key Files Modified/Created

- `client/src/app/services/websocket.service.ts` - NEW: WebSocket service
- `client/src/app/components/initial-screen.component.ts` - UPDATED: Added game mode
- `client/src/app/components/memory-game.component.ts` - UPDATED: Full multiplayer support
- `server/game_server.py` - NEW: Python WebSocket server
- `server/requirements.txt` - NEW: Python dependencies

