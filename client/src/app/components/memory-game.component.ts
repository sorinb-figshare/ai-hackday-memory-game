import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { InitialScreenComponent } from './initial-screen.component';

// Define the Card structure
interface Card {
  id: number; // Unique identifier for the card's position
  content: string; // The character name (e.g., 'Luke Skywalker')
  isFlipped: boolean;
  isMatched: boolean;
}

@Component({
  selector: 'app-memory-game',
  imports: [
    CommonModule,
    HttpClientModule,
    InitialScreenComponent
  ],
  template: `
    <app-initial-screen
      *ngIf="showInitialScreen"
      (gameStart)="onGameStart($event)">
    </app-initial-screen>
    <div *ngIf="!showInitialScreen" class="game-container">
      <p class="status">{{ statusMessage }}</p>

      <div class="scoreboard">
        <span>Player: {{ playerName }}</span> |
        <span>Score: {{ matchesFound }}</span> |
        <span>Tries: {{ tries }}</span> |
        <span>Remaining Pairs: {{ remainingPairs }}</span> |
        <span>Guessed Pairs: {{ guessedPairs }}</span>
      </div>

      <div class="grid" [style.grid-template-columns]="'repeat(' + gridSize + ', 1fr)'">
        <div
          *ngFor="let card of cards"
          class="card"
          [class.matched]="card.isMatched"
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

      <button (click)="startGame()" *ngIf="isGameOver || !cards.length">Start New Game</button>
    </div>
  `,
  styles: [`
    .game-container {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
      font-family: Arial, sans-serif;
    }

    .status {
      margin-bottom: 20px;
      font-weight: bold;
    }

    .scoreboard {
      margin-bottom: 16px;
      font-size: 16px;
      color: #fff;
      background: #222;
      padding: 8px;
      border-radius: 6px;
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    .grid {
      display: grid;
      gap: 10px;
      perspective: 1000px;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .card {
      width: 100%;
      aspect-ratio: 275 / 384;
      background-color: transparent;
      border: 2px solid gold;
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
      /* Remove fixed width/height */
      /* aspect-ratio keeps the card shape */
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
      font-size: 14px;
      font-weight: bold;
      border-radius: 6px;
      padding: 0;
      box-sizing: border-box;
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
      font-size: 1.2em;
      padding: 10px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
      border-radius: 6px;
    }

    .card.matched .card-front {
      background-color: #4CAF50;
      color: white;
    }
  `]
})
export class MemoryGameComponent implements OnInit {
  // GAME STATE
  gridSize = 6; // Default, updated from initial screen
  cards: Card[] = [];
  flippedCards: Card[] = [];
  isChecking = false; // Flag to prevent rapid clicking while cards are being checked
  matchesFound = 0;
  isGameOver = false;
  statusMessage = 'Click Start New Game to begin!';
  isLoading = false;

  // SWAPI Data
  swapiCharacters: string[] = [];

  // Additional game metrics
  tries = 0;
  remainingPairs = 0;
  guessedPairs = 0;

  // Initial screen state
  showInitialScreen = true;
  playerName = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Optionally start a game automatically if you wish
    // this.startGame();
  }

  // CORE LOGIC FUNCTIONS

  startGame(): void {
    this.matchesFound = 0;
    this.isGameOver = false;
    this.statusMessage = 'May the Force be with you. Find the pairs!';
    this.isLoading = true;
    this.tries = 0;
    this.guessedPairs = 0;
    this.remainingPairs = (this.gridSize * this.gridSize) / 2;
    this.fetchSwapiCharacters();
  }

  private fetchSwapiCharacters(): void {
    const needed = (this.gridSize * this.gridSize) / 2;
    let characters: string[] = [];
    let page = 1;

    const fetchPage = () => {
      this.http.get<any>(`https://swapi.dev/api/people/?page=${page}`).subscribe({
        next: (data) => {
          characters = characters.concat(data.results.map((c: any) => c.name));
          if (characters.length < needed && data.next) {
            page++;
            fetchPage();
          } else {
            this.swapiCharacters = characters.slice(0, needed);
            this.cards = this.createShuffledCards();
            this.isLoading = false;
          }
        },
        error: () => {
          this.statusMessage = 'Failed to load SWAPI characters. Try again!';
          this.isLoading = false;
        }
      });
    };

    fetchPage();
  }

  private createShuffledCards(): Card[] {
    const pairs: string[] = this.swapiCharacters;
    let allCards: Card[] = [];

    // Create the pairs
    for (let i = 0; i < pairs.length; i++) {
      // Create two cards with the same content
      allCards.push({id: allCards.length, content: pairs[i], isFlipped: false, isMatched: false});
      allCards.push({id: allCards.length, content: pairs[i], isFlipped: false, isMatched: false});
    }

    // Shuffle the cards (Fisher-Yates algorithm)
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    return allCards;
  }

  onCardClick(card: Card): void {
    if (this.isChecking || card.isFlipped || this.isGameOver) {
      return;
    }

    card.isFlipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.isChecking = true;
      this.tries++;
      this.checkForMatch();
    }
  }

  private checkForMatch(): void {
    const [card1, card2] = this.flippedCards;

    if (card1.content === card2.content) {
      // Match found!
      this.matchesFound++;
      this.guessedPairs++;
      this.remainingPairs--;
      this.statusMessage = `Match Found! ${card1.content} is correct!`;

      // Mark as matched and keep them flipped
      card1.isMatched = true;
      card2.isMatched = true;

      this.flippedCards = []; // Clear for the next turn
      this.isChecking = false;

      this.checkWinState();

    } else {
      // No match, flip them back after a delay
      this.statusMessage = 'No match. Try again...';
      setTimeout(() => {
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.flippedCards = []; // Clear for the next turn
        this.isChecking = false;
      }, 1000); // 1 second delay to see the cards
    }
  }

  private checkWinState(): void {
    const totalPairs = (this.gridSize * this.gridSize) / 2;
    if (this.matchesFound === totalPairs) {
      this.isGameOver = true;
      this.statusMessage = '🎉 Congratulations! You have mastered the Force!';
    }
  }

  onGameStart(event: { playerName: string, gridSize: number }) {
    this.playerName = event.playerName;
    this.gridSize = event.gridSize;
    this.showInitialScreen = false;
    this.startGame();
  }
}
