# Memory Game WebSocket Server

A Python asyncio-based WebSocket server for turn-based multiplayer memory game.

## Features

- **Multiplayer Matchmaking**: Automatically pairs players with matching grid sizes
- **Turn-Based Gameplay**: Manages player turns and validates moves
- **Real-time Updates**: Broadcasts game state changes to all players
- **Score Tracking**: Keeps track of each player's score
- **Connection Management**: Handles player disconnections gracefully

## Installation

```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python game_server.py
```

The server will start on `ws://localhost:8765`

## Client Protocol

### Messages from Client to Server

#### Join Game
```json
{
  "action": "join",
  "player_id": "unique-player-id",
  "player_name": "Player Name",
  "grid_size": 6
}
```

#### Make a Move
```json
{
  "action": "move",
  "card_id": 5,
  "flip_count": 1
}
```

#### Match Found
```json
{
  "action": "match_found",
  "cards": [1, 5]
}
```

#### Next Turn
```json
{
  "action": "next_turn"
}
```

#### Leave Game
```json
{
  "action": "leave"
}
```

### Messages from Server to Client

#### Waiting for Opponent
```json
{
  "type": "waiting",
  "game": {
    "id": "game_0",
    "players": [...],
    "state": "waiting",
    "grid_size": 6
  }
}
```

#### Game Started
```json
{
  "type": "game_start",
  "game": {
    "id": "game_0",
    "players": [...],
    "state": "playing",
    "current_turn_player_id": "player-1",
    "grid_size": 6
  }
}
```

#### Move Made
```json
{
  "type": "move",
  "player_id": "player-1",
  "card_id": 5,
  "flip_count": 1
}
```

#### Match Found
```json
{
  "type": "match_found",
  "player_id": "player-1",
  "cards": [1, 5],
  "game": {...}
}
```

#### Turn Changed
```json
{
  "type": "turn_change",
  "current_turn_player_id": "player-2",
  "game": {...}
}
```

#### Player Left
```json
{
  "type": "player_left",
  "player_id": "player-1",
  "game": {...}
}
```

#### Error
```json
{
  "type": "error",
  "message": "Not your turn"
}
```

## Architecture

- **GameServer**: Main server class managing all games and connections
- **Game**: Represents a single game session with 2 players
- **Player**: Represents a connected player with their websocket connection
- **GameState**: Enum for game states (WAITING, PLAYING, FINISHED)

## Game Flow

1. Player 1 joins → creates a new game in WAITING state
2. Player 2 joins with matching grid size → game starts in PLAYING state
3. Players take turns making moves
4. Server validates turns and broadcasts updates
5. When a match is found, player's score increments
6. Game continues until all pairs are found
7. If a player disconnects, the other player is notified

