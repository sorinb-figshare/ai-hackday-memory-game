import asyncio
import websockets
import json
from typing import Dict, Set, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import random

class GameState(Enum):
    WAITING = "waiting"
    PLAYING = "playing"
    FINISHED = "finished"

@dataclass
class Player:
    id: str
    name: str
    websocket: websockets.WebSocketServerProtocol
    score: int = 0

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "score": self.score
        }

@dataclass
class Game:
    id: str
    players: Dict[str, Player]
    state: GameState
    current_turn_player_id: Optional[str] = None
    grid_size: int = 6
    card_order: Optional[list] = None

    def to_dict(self):
        return {
            "id": self.id,
            "players": [p.to_dict() for p in self.players.values()],
            "state": self.state.value,
            "current_turn_player_id": self.current_turn_player_id,
            "grid_size": self.grid_size,
            "card_order": self.card_order
        }

    def generate_card_order(self):
        """Generate a random order for the cards for the game."""
        num_pairs = (self.grid_size * self.grid_size) // 2
        pairs = list(range(1, num_pairs + 1)) * 2
        random.shuffle(pairs)
        self.card_order = pairs

class GameServer:
    def __init__(self):
        self.games: Dict[str, Game] = {}
        self.player_to_game: Dict[str, str] = {}  # player_id -> game_id
        self.waiting_players: Set[str] = set()

    async def handle_client(self, websocket: websockets.WebSocketServerProtocol):
        player_id = None
        try:
            async for message in websocket:
                data = json.loads(message)
                action = data.get("action")

                if action == "join":
                    player_id = data.get("player_id")
                    player_name = data.get("player_name", "Player")
                    grid_size = int(data.get("grid_size", 6))

                    await self.handle_join(player_id, player_name, websocket, grid_size)

                elif action == "move":
                    await self.handle_move(player_id, data)

                elif action == "match_found":
                    await self.handle_match_found(player_id, data)

                elif action == "next_turn":
                    await self.handle_next_turn(player_id)

                elif action == "leave":
                    await self.handle_leave(player_id)

        except websockets.exceptions.ConnectionClosed:
            print(f"Connection closed for player {player_id}")
        finally:
            if player_id:
                await self.handle_disconnect(player_id)

    async def handle_join(self, player_id: str, player_name: str, websocket: websockets.WebSocketServerProtocol, grid_size: int):
        player = Player(id=player_id, name=player_name, websocket=websocket)

        # Try to find a waiting game with matching grid size
        matching_game_id = None
        for waiting_player_id in list(self.waiting_players):
            game_id = self.player_to_game.get(waiting_player_id)
            if game_id and self.games[game_id].grid_size == grid_size:
                matching_game_id = game_id
                break

        if matching_game_id:
            # Join existing game
            game = self.games[matching_game_id]
            game.players[player_id] = player
            game.state = GameState.PLAYING

            # Set first player's turn
            player_ids = list(game.players.keys())
            game.current_turn_player_id = player_ids[0]

            # Generate the shared card order
            game.generate_card_order()

            self.player_to_game[player_id] = matching_game_id
            self.waiting_players.discard(list(game.players.keys())[0])

            # Notify both players with the card order
            await self.broadcast_to_game(matching_game_id, {
                "type": "game_start",
                "game": game.to_dict()
            })

        else:
            # Create new game
            game_id = f"game_{len(self.games)}"
            game = Game(
                id=game_id,
                players={player_id: player},
                state=GameState.WAITING,
                grid_size=grid_size
            )
            self.games[game_id] = game
            self.player_to_game[player_id] = game_id
            self.waiting_players.add(player_id)

            # Notify player they're waiting
            await websocket.send(json.dumps({
                "type": "waiting",
                "game": game.to_dict()
            }))

    async def handle_move(self, player_id: str, data: Dict):
        game_id = self.player_to_game.get(player_id)
        if not game_id:
            return

        game = self.games[game_id]

        # Verify it's this player's turn
        if game.current_turn_player_id != player_id:
            await game.players[player_id].websocket.send(json.dumps({
                "type": "error",
                "message": "Not your turn"
            }))
            return

        # Broadcast move to all players
        await self.broadcast_to_game(game_id, {
            "type": "move",
            "player_id": player_id,
            "card_id": data.get("card_id"),
            "flip_count": data.get("flip_count")
        })

    async def handle_match_found(self, player_id: str, data: Dict):
        game_id = self.player_to_game.get(player_id)
        if not game_id:
            return

        game = self.games[game_id]

        # Update player score
        if player_id in game.players:
            game.players[player_id].score += 1

        # Broadcast match found
        await self.broadcast_to_game(game_id, {
            "type": "match_found",
            "player_id": player_id,
            "cards": data.get("cards"),
            "game": game.to_dict()
        })

    async def handle_next_turn(self, player_id: str):
        game_id = self.player_to_game.get(player_id)
        if not game_id:
            return

        game = self.games[game_id]

        # Switch to next player
        player_ids = list(game.players.keys())
        current_index = player_ids.index(game.current_turn_player_id)
        next_index = (current_index + 1) % len(player_ids)
        game.current_turn_player_id = player_ids[next_index]

        # Broadcast turn change
        await self.broadcast_to_game(game_id, {
            "type": "turn_change",
            "current_turn_player_id": game.current_turn_player_id,
            "game": game.to_dict()
        })

    async def handle_leave(self, player_id: str):
        await self.handle_disconnect(player_id)

    async def handle_disconnect(self, player_id: str):
        game_id = self.player_to_game.get(player_id)
        if not game_id:
            return

        game = self.games.get(game_id)
        if not game:
            return

        # Remove player from game
        if player_id in game.players:
            del game.players[player_id]

        self.waiting_players.discard(player_id)

        # If game is empty, remove it
        if not game.players:
            del self.games[game_id]
        else:
            # Notify remaining players
            game.state = GameState.FINISHED
            await self.broadcast_to_game(game_id, {
                "type": "player_left",
                "player_id": player_id,
                "game": game.to_dict()
            })

        del self.player_to_game[player_id]

    async def broadcast_to_game(self, game_id: str, message: Dict):
        """Send a message to all players in a game"""
        game = self.games.get(game_id)
        if not game:
            return

        message_json = json.dumps(message)
        disconnected_players = []

        for player_id, player in game.players.items():
            try:
                await player.websocket.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected_players.append(player_id)

        # Clean up disconnected players
        for player_id in disconnected_players:
            await self.handle_disconnect(player_id)

async def main():
    server = GameServer()

    async with websockets.serve(server.handle_client, "localhost", 8765):
        print("🎮 Game Server started on ws://localhost:8765")
        print("Waiting for players to connect...")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
