import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { InitialScreenComponent } from './initial-screen.component';
import { LeaderboardComponent } from './leaderboard.component';
import { WebSocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';

// Define the Card structure
interface Card {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Player {
  id: string;
  name: string;
  score: number;
}

@Component({
  selector: 'app-memory-game',
  imports: [
    CommonModule,
    HttpClientModule,
    InitialScreenComponent,
    LeaderboardComponent
  ],
  template: `
    <app-initial-screen
      *ngIf="showInitialScreen && !showLeaderboard"
      (gameStart)="onGameStart($event)"
      (leaderboardRequested)="onLeaderboardRequested()">
    </app-initial-screen>

    <app-leaderboard *ngIf="showLeaderboard" (closeRequested)="onLeaderboardClosed()"></app-leaderboard>

    <div *ngIf="isWaitingForOpponent" class="waiting-container">
      <h2>⏳ Waiting for opponent...</h2>
      <p>Grid Size: {{ gridSize }} x {{ gridSize }}</p>
      <p>Share this game with a friend!</p>
    </div>

    <div *ngIf="!showInitialScreen && !isWaitingForOpponent && !showLeaderboard" class="game-container">
      <p class="status">{{ statusMessage }}</p>

      <div class="scoreboard">
        <div *ngIf="isMultiplayer" class="players-info">
          <div *ngFor="let player of players" class="player-card"
               [class.active]="player.id === currentTurnPlayerId">
            <span class="player-name">{{ player.name }}</span>
            <span class="player-score">Score: {{ player.score }}</span>
            <span *ngIf="player.id === currentTurnPlayerId" class="turn-indicator">👈 Your Turn</span>
          </div>
        </div>
        <div *ngIf="!isMultiplayer" class="single-player-info">
          <span>Player: {{ playerName }}</span> |
          <span>Score: {{ matchesFound }}</span> |
          <span>Tries: {{ tries }}</span> |
          <span>Remaining Pairs: {{ remainingPairs }}</span>
        </div>
      </div>

      <div class="grid" [style.grid-template-columns]="'repeat(' + gridSize + ', 1fr)'">
        <div
          *ngFor="let card of cards"
          class="card"
          [class.matched]="card.isMatched"
          [class.disabled]="isMultiplayer && !isMyTurn()"
          (click)="onCardClick(card)"
        >
          <div class="card-inner" [class.flipped]="card.isFlipped || card.isMatched">
            <div class="card-face card-back">
              <img src="cover.png" alt="cover" class="cover-img" />
            </div>
            <div class="card-face card-front">{{ card.content }}</div>
          </div>
        </div>
      </div>

      <button (click)="resetGame()" *ngIf="isGameOver">Play Again</button>
      <button (click)="resetGame()" *ngIf="!isMultiplayer && !cards.length">Start New Game</button>
    </div>
  `,
  styles: [`
    .game-container {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
      font-family: Arial, sans-serif;
      padding: 10px;
    }

    .waiting-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 20px;
    }

    .waiting-container h2 {
      color: gold;
      font-size: 2em;
    }

    .status {
      margin-bottom: 10px;
      font-weight: bold;
      font-size: 1.1em;
    }

    .scoreboard {
      margin-bottom: 10px;
      font-size: 14px;
      color: #fff;
      background: #222;
      padding: 8px;
      border-radius: 6px;
    }

    .players-info {
      display: flex;
      justify-content: center;
      gap: 30px;
    }

    .player-card {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 10px 20px;
      border-radius: 6px;
      background: #333;
      transition: all 0.3s;
    }

    .player-card.active {
      background: #444;
      border: 2px solid gold;
      transform: scale(1.05);
    }

    .player-name {
      font-weight: bold;
      font-size: 1.1em;
    }

    .player-score {
      color: gold;
    }

    .turn-indicator {
      color: #4CAF50;
      font-weight: bold;
    }

    .single-player-info {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    .grid {
      display: grid;
      gap: 8px;
      perspective: 1000px;
      width: 100%;
      max-width: min(90vw, 800px);
      margin: 0 auto;
      max-height: calc(100vh - 250px);
    }

    .card {
      width: 100%;
      aspect-ratio: 3 / 4;
      max-height: calc((100vh - 250px) / var(--grid-size) - 8px);
      background-color: transparent;
      border: 2px solid gold;
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    }

    .card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s;
      transform-style: preserve-3d;
    }

    .card-inner.flipped {
      transform: rotateY(180deg);
      pointer-events: none;
    }

    .card-face {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border-radius: 6px;
      padding: 4px;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow: hidden;
    }

    .card-back {
      background-color: #333;
      color: gold;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
      display: block;
    }

    .card-front {
      background-color: white;
      color: black;
      transform: rotateY(180deg);
      font-size: clamp(10px, 1vw, 14px);
      padding: 8px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      border-radius: 6px;
      text-align: center;
      line-height: 1.2;
    }

    .card.matched .card-front {
      background-color: #4CAF50;
      color: white;
    }

    button {
      margin-top: 15px;
      padding: 10px 20px;
      font-size: 1em;
      cursor: pointer;
      background-color: gold;
      border: none;
      border-radius: 6px;
      font-weight: bold;
    }

    button:hover {
      background-color: #ffd700;
    }

    /* Responsive adjustments for different grid sizes */
    @media (max-height: 800px) {
      .status {
        margin-bottom: 5px;
        font-size: 1em;
      }

      .scoreboard {
        margin-bottom: 5px;
        font-size: 12px;
        padding: 6px;
      }

      .grid {
        max-height: calc(100vh - 200px);
      }
    }
  `]
})
export class MemoryGameComponent implements OnInit, OnDestroy {
  // GAME STATE
  gridSize = 6;
  cards: Card[] = [];
  flippedCards: Card[] = [];
  isChecking = false;
  matchesFound = 0;
  isGameOver = false;
  statusMessage = 'Click Start New Game to begin!';
  isLoading = false;

  // SWAPI Data
  swapiCharacters: string[] = [];

  // Single player metrics
  tries = 0;
  remainingPairs = 0;

  // Initial screen state
  showInitialScreen = true;
  playerName = '';

  // Multiplayer state
  isMultiplayer = false;
  playerId: string = '';
  currentTurnPlayerId: string = '';
  players: Player[] = [];
  isWaitingForOpponent = false;
  private wsSubscription?: Subscription;

  // Leaderboard state
  showLeaderboard = false;

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {
    this.playerId = this.generatePlayerId();
  }

  ngOnInit() {}

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.isMultiplayer) {
      this.wsService.disconnect();
    }
  }

  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  async onGameStart(event: { playerName: string, gridSize: number, gameMode: string }) {
    this.playerName = event.playerName;
    this.gridSize = event.gridSize;
    this.isMultiplayer = event.gameMode === 'multiplayer';
    this.showInitialScreen = false;

    if (this.isMultiplayer) {
      await this.startMultiplayerGame();
    } else {
      this.startSinglePlayerGame();
    }
  }

  // SINGLE PLAYER MODE
  startSinglePlayerGame(): void {
    this.matchesFound = 0;
    this.isGameOver = false;
    this.statusMessage = 'May the Force be with you. Find the pairs!';
    this.isLoading = true;
    this.tries = 0;
    this.remainingPairs = (this.gridSize * this.gridSize) / 2;
    this.fetchSwapiCharacters();
  }

  // MULTIPLAYER MODE
  async startMultiplayerGame(): Promise<void> {
    try {
      await this.wsService.connect();
      this.isWaitingForOpponent = true;
      this.statusMessage = 'Connecting to game server...';

      // Subscribe to WebSocket messages
      this.wsSubscription = this.wsService.messages$.subscribe(message => {
        this.handleWebSocketMessage(message);
      });

      // Join game
      this.wsService.send({
        action: 'join',
        player_id: this.playerId,
        player_name: this.playerName,
        grid_size: this.gridSize
      });

    } catch (error) {
      console.error('Failed to connect to game server:', error);
      this.statusMessage = 'Failed to connect to server. Please try again.';
      this.isWaitingForOpponent = false;
    }
  }

  private handleWebSocketMessage(message: any): void {
    console.log('Handling message:', message);

    switch (message.type) {
      case 'waiting':
        this.isWaitingForOpponent = true;
        this.statusMessage = 'Waiting for opponent to join...';
        break;

      case 'game_start':
        this.isWaitingForOpponent = false;
        this.players = message.game.players;
        this.currentTurnPlayerId = message.game.current_turn_player_id;
        this.statusMessage = this.isMyTurn() ? 'Your turn! Find a pair!' : 'Opponent\'s turn...';

        // Store the server's card order and character names for multiplayer
        const cardOrder = message.game.card_order;
        const characterNames = message.game.character_names;

        // Use server-provided characters in multiplayer mode
        if (characterNames && characterNames.length > 0) {
          this.swapiCharacters = characterNames;
          this.cards = this.createShuffledCards(cardOrder);
          this.isLoading = false;
        } else {
          // Fallback to fetching if server didn't provide characters
          this.fetchSwapiCharacters(cardOrder);
        }
        break;

      case 'move':
        // Only update for opponent's moves, not our own
        if (message.player_id !== this.playerId) {
          const card = this.cards.find(c => c.id === message.card_id);
          if (card && !card.isMatched) {
            card.isFlipped = true;
          }
        }
        break;

      case 'match_found':
        // Update scores and mark cards as matched
        this.players = message.game.players;
        const matchedCards = message.cards;

        // Mark cards as matched for both players
        matchedCards.forEach((cardId: number) => {
          const card = this.cards.find(c => c.id === cardId);
          if (card) {
            card.isMatched = true;
            card.isFlipped = true;
          }
        });

        // Clear flipped cards tracking
        this.flippedCards = [];
        this.isChecking = false;

        if (message.player_id === this.playerId) {
          this.statusMessage = '🎉 You found a match!';
        } else {
          this.statusMessage = 'Opponent found a match!';
        }

        // Check if game is over
        const totalPairs = (this.gridSize * this.gridSize) / 2;
        const totalMatches = this.players.reduce((sum, p) => sum + p.score, 0);
        if (totalMatches === totalPairs) {
          this.isGameOver = true;
          const winner = this.players.reduce((prev, curr) =>
            curr.score > prev.score ? curr : prev
          );
          this.statusMessage = winner.id === this.playerId
            ? '🎉 You won!'
            : `${winner.name} won!`;

          // Submit scores to leaderboard for multiplayer
          this.submitMultiplayerScoresToLeaderboard(message.game);
        }
        break;

      case 'turn_change':
        this.currentTurnPlayerId = message.current_turn_player_id;
        this.players = message.game.players;
        this.statusMessage = this.isMyTurn() ? 'Your turn!' : 'Opponent\'s turn...';

        // Flip back ALL unmatched flipped cards (for both players)
        this.cards.forEach(card => {
          if (!card.isMatched && card.isFlipped) {
            card.isFlipped = false;
          }
        });
        this.flippedCards = [];
        this.isChecking = false;
        break;

      case 'player_left':
        this.statusMessage = 'Opponent left the game.';
        this.isGameOver = true;
        break;

      case 'error':
        this.statusMessage = message.message;
        break;
    }
  }

  isMyTurn(): boolean {
    return this.currentTurnPlayerId === this.playerId;
  }

  // SHARED LOGIC
  private fetchSwapiCharacters(cardOrder?: number[]): void {
    const needed = (this.gridSize * this.gridSize) / 2;
    let characters: string[] = [];

    // Fetch multiple pages to get a larger pool of characters
    const maxPages = 9; // SWAPI has 9 pages of people, ~82 total characters
    let pagesLoaded = 0;

    const fetchPage = (page: number) => {
      this.http.get<any>(`https://swapi.dev/api/people/?page=${page}`).subscribe({
        next: (data) => {
          characters = characters.concat(data.results.map((c: any) => c.name));
          pagesLoaded++;

          // Continue fetching if we have more pages and haven't reached max
          if (data.next && pagesLoaded < maxPages) {
            fetchPage(page + 1);
          } else {
            // Once we have all characters, randomly select the needed amount
            const randomizedCharacters = this.getRandomCharacters(characters, needed);
            this.swapiCharacters = randomizedCharacters;
            this.cards = this.createShuffledCards(cardOrder);
            this.isLoading = false;
          }
        },
        error: () => {
          this.statusMessage = 'Failed to load SWAPI characters. Try again!';
          this.isLoading = false;
        }
      });
    };

    fetchPage(1);
  }

  private getRandomCharacters(allCharacters: string[], count: number): string[] {
    // Create a copy to avoid modifying the original array
    const shuffled = [...allCharacters];

    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Return the first 'count' items from the shuffled array
    return shuffled.slice(0, count);
  }

  private createShuffledCards(cardOrder?: number[]): Card[] {
    const pairs: string[] = this.swapiCharacters;
    let allCards: Card[] = [];

    if (cardOrder && this.isMultiplayer) {
      // Use server's card order for multiplayer
      for (let i = 0; i < cardOrder.length; i++) {
        const characterIndex = cardOrder[i] - 1; // Server sends 1-indexed pairs
        allCards.push({
          id: i,
          content: pairs[characterIndex],
          isFlipped: false,
          isMatched: false
        });
      }
    } else {
      // Single player - shuffle locally
      for (let i = 0; i < pairs.length; i++) {
        allCards.push({id: allCards.length, content: pairs[i], isFlipped: false, isMatched: false});
        allCards.push({id: allCards.length, content: pairs[i], isFlipped: false, isMatched: false});
      }

      // Shuffle
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
      }
    }

    return allCards;
  }

  onCardClick(card: Card): void {
    // Prevent clicks during checking or if card is already flipped/matched
    if (this.isChecking || card.isFlipped || card.isMatched || this.isGameOver) {
      return;
    }

    // In multiplayer, check if it's player's turn
    if (this.isMultiplayer && !this.isMyTurn()) {
      this.statusMessage = 'Wait for your turn!';
      return;
    }

    card.isFlipped = true;
    this.flippedCards.push(card);

    // Send move to server in multiplayer
    if (this.isMultiplayer) {
      this.wsService.send({
        action: 'move',
        card_id: card.id,
        flip_count: this.flippedCards.length
      });
    }

    if(this.flippedCards.length === 2) {
      this.isChecking = true;
      if (!this.isMultiplayer) {
        this.tries++;
      }
      this.checkForMatch();
    }
  }

  private checkForMatch(): void {
    const [card1, card2] = this.flippedCards;

    if (card1.content === card2.content) {
      // Match found!
      card1.isMatched = true;
      card2.isMatched = true;

      if (this.isMultiplayer) {
        // Notify server of match
        this.wsService.send({
          action: 'match_found',
          cards: [card1.id, card2.id]
        });
        // Don't clear flippedCards yet - wait for server response
        this.isChecking = false;
      } else {
        // Single player
        this.matchesFound++;
        this.remainingPairs--;
        this.statusMessage = `Match Found! ${card1.content} is correct!`;
        this.flippedCards = [];
        this.isChecking = false;
        this.checkWinState();
      }

    } else {
      // No match
      this.statusMessage = 'No match. Try again...';

      if (this.isMultiplayer) {
        // In multiplayer, wait a bit then tell server to change turn
        setTimeout(() => {
          this.wsService.send({
            action: 'next_turn'
          });
        }, 1000);
      } else {
        // Single player - flip back after delay
        setTimeout(() => {
          card1.isFlipped = false;
          card2.isFlipped = false;
          this.flippedCards = [];
          this.isChecking = false;
        }, 1000);
      }
    }
  }

  private checkWinState(): void {
    const totalPairs = (this.gridSize * this.gridSize) / 2;
    if (this.matchesFound === totalPairs) {
      this.isGameOver = true;
      this.statusMessage = '🎉 Congratulations! You have mastered the Force!';

      // Submit score to leaderboard for single player
      if (!this.isMultiplayer) {
        this.submitScoreToLeaderboard();
      }
    }
  }

  resetGame(): void {
    if (this.isMultiplayer) {
      this.wsService.disconnect();
    }

    this.showInitialScreen = true;
    this.showLeaderboard = false;
    this.isWaitingForOpponent = false;
    this.cards = [];
    this.flippedCards = [];
    this.isChecking = false;
    this.matchesFound = 0;
    this.isGameOver = false;
    this.tries = 0;
    this.remainingPairs = 0;
    this.players = [];
    this.currentTurnPlayerId = '';
  }

  // LEADERBOARD LOGIC
  onLeaderboardRequested(): void {
    this.showLeaderboard = true;
    this.showInitialScreen = false;
  }

  onLeaderboardClosed(): void {
    this.showLeaderboard = false;
    this.showInitialScreen = false;
    this.resetGame();
  }

  private async submitScoreToLeaderboard(): Promise<void> {
    if (!this.wsService.isConnected()) {
      await this.wsService.connect();
    }

    this.wsService.send({
      action: 'game_complete',
      player_name: this.playerName,
      score: this.matchesFound,
      tries: this.tries,
      grid_size: this.gridSize,
      game_mode: 'single'
    });
  }

  private async submitMultiplayerScoresToLeaderboard(gameData: any): Promise<void> {
    // Only submit the current player's own score to avoid duplicates
    // (each client will submit their own score)
    const currentPlayer = gameData.players.find((p: any) => p.id === this.playerId);

    // Only submit if the player has a score greater than 0 (actually found matches)
    if (currentPlayer && currentPlayer.score > 0) {
      this.wsService.send({
        action: 'game_complete',
        player_name: currentPlayer.name,
        score: currentPlayer.score,
        tries: gameData.tries || 0,
        grid_size: this.gridSize,
        game_mode: 'multiplayer'
      });
    }
  }
}
