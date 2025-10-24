import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../services/websocket.service';
import { Subscription } from 'rxjs';

interface LeaderboardEntry {
  player_name: string;
  score: number;
  tries: number;
  grid_size: number;
  game_mode: string;
  timestamp: string;
}

interface LeaderboardMessage {
  type: string;
  entries: LeaderboardEntry[];
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="leaderboard-container">
      <h2>🏆 Leaderboard</h2>

      <div class="filters">
        <label>
          Grid Size:
          <select [(ngModel)]="gridSizeFilter" (change)="loadLeaderboard()" name="gridSizeFilter">
            <option value="">All</option>
            <option *ngFor="let size of gridSizes" [value]="size">{{ size }}x{{ size }}</option>
          </select>
        </label>
        <label>
          Game Mode:
          <select [(ngModel)]="gameModeFilter" (change)="loadLeaderboard()" name="gameModeFilter">
            <option value="">All</option>
            <option value="single">Single Player</option>
            <option value="multiplayer">Multiplayer</option>
          </select>
        </label>
        <button (click)="loadLeaderboard()" class="refresh-btn">🔄 Refresh</button>
      </div>

      <div *ngIf="isLoading" class="loading">Loading leaderboard...</div>

      <div *ngIf="!isLoading && entries.length === 0" class="no-data">
        No entries yet. Be the first to play! 🎮
      </div>

      <table *ngIf="!isLoading && entries.length > 0" class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Tries</th>
            <th>Grid</th>
            <th>Mode</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let entry of entries; let i = index" [class.top-three]="i < 3">
            <td class="rank">
              <span *ngIf="i === 0">🥇</span>
              <span *ngIf="i === 1">🥈</span>
              <span *ngIf="i === 2">🥉</span>
              <span *ngIf="i >= 3">{{ i + 1 }}</span>
            </td>
            <td class="player-name">{{ entry.player_name }}</td>
            <td class="score">{{ entry.score }}</td>
            <td>{{ entry.tries }}</td>
            <td>{{ entry.grid_size }}x{{ entry.grid_size }}</td>
            <td>{{ entry.game_mode === 'single' ? 'Single' : 'Multi' }}</td>
            <td class="date">{{ formatDate(entry.timestamp) }}</td>
          </tr>
        </tbody>
      </table>

      <button (click)="close()" class="close-btn">Close</button>
    </div>
  `,
  styles: [`
    .leaderboard-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
      background: #1a1a1a;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    h2 {
      text-align: center;
      color: gold;
      margin-bottom: 20px;
      font-size: 2em;
    }

    .filters {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
    }

    .filters label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;
      font-size: 14px;
    }

    .filters select {
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid gold;
      background: #333;
      color: #fff;
      cursor: pointer;
    }

    .refresh-btn {
      padding: 6px 12px;
      background: gold;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.3s;
    }

    .refresh-btn:hover {
      background: #ffd700;
    }

    .loading, .no-data {
      text-align: center;
      padding: 40px;
      color: #999;
      font-size: 1.1em;
    }

    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .leaderboard-table th {
      background: #2a2a2a;
      color: gold;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid gold;
      font-weight: bold;
    }

    .leaderboard-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #333;
      color: #fff;
    }

    .leaderboard-table tbody tr {
      transition: background 0.2s;
    }

    .leaderboard-table tbody tr:hover {
      background: #2a2a2a;
    }

    .leaderboard-table tbody tr.top-three {
      background: rgba(255, 215, 0, 0.1);
    }

    .rank {
      font-size: 1.2em;
      text-align: center;
      width: 60px;
    }

    .player-name {
      font-weight: bold;
      color: gold;
    }

    .score {
      color: #4CAF50;
      font-weight: bold;
      font-size: 1.1em;
    }

    .date {
      color: #999;
      font-size: 0.9em;
    }

    .close-btn {
      width: 100%;
      padding: 12px;
      background: #444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1em;
      font-weight: bold;
      transition: background 0.3s;
    }

    .close-btn:hover {
      background: #555;
    }

    @media (max-width: 768px) {
      .leaderboard-container {
        padding: 15px;
        margin: 10px;
      }

      .leaderboard-table {
        font-size: 0.9em;
      }

      .leaderboard-table th,
      .leaderboard-table td {
        padding: 8px 6px;
      }

      h2 {
        font-size: 1.5em;
      }
    }
  `]
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  @Output() closeRequested = new EventEmitter<void>();
  entries: LeaderboardEntry[] = [];
  isLoading = false;
  gridSizeFilter = '';
  gameModeFilter = '';
  gridSizes = [2, 4, 6, 8];
  private wsSubscription?: Subscription;

  constructor(private wsService: WebSocketService) {}

  ngOnInit() {
    this.loadLeaderboard();

    // Subscribe to WebSocket messages
    this.wsSubscription = this.wsService.messages$.subscribe((message: any) => {
      if (message.type === 'leaderboard') {
        const leaderboardMsg = message as LeaderboardMessage;
        this.entries = leaderboardMsg.entries || [];
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  async loadLeaderboard() {
    this.isLoading = true;

    if (!this.wsService.isConnected()) {
      await this.wsService.connect();
    }

    const filters: any = {
      action: 'get_leaderboard'
    };

    if (this.gridSizeFilter) {
      filters.grid_size = this.gridSizeFilter;
    }

    if (this.gameModeFilter) {
      filters.game_mode = this.gameModeFilter;
    }

    this.wsService.send(filters);
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  close() {
    this.closeRequested.emit();
  }
}
