import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Task, TaskCategory, TaskStatus } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  tasks = signal<Task[]>([]);
  loading = signal(false);
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
    return this.tasks().length;
  }

  get pendingTasks(): number {
    return this.tasks().filter((task) => task.taskStatus === 'PENDING').length;
  }

  get inProgressTasks(): number {
    return this.tasks().filter((task) => task.taskStatus === 'IN_PROGRESS').length;
  }

  get finishedTasks(): number {
    return this.tasks().filter((task) => task.taskStatus === 'FINISHED').length;
  }

  get overdueTasks(): number {
    return this.tasks().filter((task) => this.isTaskOverdue(task)).length;
  }

  get recentTasks(): Task[] {
    return this.tasks().slice(0, 3);
  }

  getCategoryLabel(category: TaskCategory): string {
    const map: Record<TaskCategory, string> = {
      WORK: 'Trabalho',
      PERSONAL: 'Pessoal',
      IMPORTANT: 'Importante',
      STUDY: 'Estudos',
      OTHER: 'Outros',
    };

    return map[category] ?? category;
  }

  formatDueDate(value?: string | null): string {
    if (!value) {
      return 'Sem data';
    }

    const parsed = new Date(value.includes(' ') ? value.replace(' ', 'T') : value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  }

  isTaskOverdue(task: Task): boolean {
    if (!task.dueDate || task.taskStatus === 'FINISHED' || task.taskStatus === 'CANCELED') {
      return false;
    }

    const dueDate = new Date(task.dueDate.includes(' ') ? task.dueDate.replace(' ', 'T') : task.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      return false;
    }

    return dueDate.getTime() < Date.now();
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error = '';

    this.taskService.list({ size: 50 }).subscribe({
      next: (page) => {
        this.tasks.set(page.content ?? []); 
        this.loading.set(false);
      },
      error: () => {
        this.error = 'Não foi possível carregar o resumo das tasks.';
        this.loading.set(false);
      },
    });
  }
}
