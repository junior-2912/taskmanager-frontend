import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task, TaskStatus } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  tasks: Task[] = [];
  loading = false;
  error = '';

  readonly statusLabels: Record<TaskStatus, string> = {
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em andamento',
    FINISHED: 'Concluída',
    CANCELED: 'Cancelada',
  };

  constructor(private readonly taskService: TaskService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get totalTasks(): number {
    return this.tasks.length;
  }

  get pendingTasks(): number {
    return this.tasks.filter((task) => task.taskStatus === 'PENDING').length;
  }

  get inProgressTasks(): number {
    return this.tasks.filter((task) => task.taskStatus === 'IN_PROGRESS').length;
  }

  get finishedTasks(): number {
    return this.tasks.filter((task) => task.taskStatus === 'FINISHED').length;
  }

  get recentTasks(): Task[] {
    return this.tasks.slice(0, 3);
  }

  private loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.taskService.list({ size: 50 }).subscribe({
      next: (page) => {
        this.tasks = page.content ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar o resumo das tasks.';
        this.loading = false;
      },
    });
  }
}
