import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MemoryGameComponent} from './components/memory-game.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MemoryGameComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'AI Hack Day: Memory Game';
}
