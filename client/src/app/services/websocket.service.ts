import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface GameMessage {
  type: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<GameMessage>();
  public messages$: Observable<GameMessage> = this.messageSubject.asObservable();

  connect(url: string = 'ws://localhost:8765'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        this.messageSubject.next(message);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
      };
    });
  }

  send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

