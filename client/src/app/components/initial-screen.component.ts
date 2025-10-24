import {Component, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-initial-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="initial-screen">
      <form (ngSubmit)="startGame()">
        <label>
          Player Name:
          <input type="text" [(ngModel)]="playerName" name="playerName" required/>
        </label>
        <label>
          Game Mode:
          <select [(ngModel)]="gameMode" name="gameMode">
            <option value="single">Single Player</option>
            <option value="multiplayer">Multiplayer</option>
          </select>
        </label>
        <label>
          Grid Size:
          <select [(ngModel)]="gridSize" name="gridSize">
            <option *ngFor="let size of gridSizes" [value]="size">{{ size }} x {{ size }}</option>
          </select>
        </label>
        <button type="submit">Start Game</button>
      </form>
      <button class="leaderboard-btn" (click)="showLeaderboard()">🏆 View Leaderboard</button>
    </div>
  `,
  styles: [`
    .initial-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 20px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    label {
      font-size: 1.1em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    input, select {
      padding: 4px 8px;
      font-size: 1em;
    }

    button {
      padding: 8px 16px;
      font-size: 1em;
      cursor: pointer;
      background-color: gold;
      border: none;
      border-radius: 4px;
      font-weight: bold;
    }

    button:hover {
      background-color: #ffd700;
    }

    .leaderboard-btn {
      background-color: #4CAF50;
      padding: 10px 20px;
      font-size: 1.1em;
    }

    .leaderboard-btn:hover {
      background-color: #45a049;
    }
  `]
})
export class InitialScreenComponent {
  @Output() gameStart = new EventEmitter<{ playerName: string, gridSize: number, gameMode: string }>();
  @Output() leaderboardRequested = new EventEmitter<void>();
  playerName: string = '';
  gridSize: number = 6;
  gameMode: string = 'single';
  gridSizes = [2, 4, 6, 8];

  startGame() {
    if (this.playerName && this.gridSize) {
      this.gameStart.emit({
        playerName: this.playerName,
        gridSize: this.gridSize,
        gameMode: this.gameMode
      });
    }
  }

  showLeaderboard() {
    this.leaderboardRequested.emit();
  }
}
