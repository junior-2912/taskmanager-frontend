import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './layout.css',
  templateUrl: './layout.html',
})
export class Layout {
  isDarkTheme = false;

  readonly navItems = [
    { label: 'Dashboard', path: '/', exact: true },
    { label: 'Tarefas', path: '/tasks', exact: false },
    { label: 'Nova tarefa', path: '/tasks/new', exact: false },
  ];

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
  }
}
