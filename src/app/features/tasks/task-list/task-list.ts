import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Task, TaskCategory, TaskStatus } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: './task-list.css',
  templateUrl: './task-list.html',
})
export class TaskList implements OnInit {
  tasks = signal<Task[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  error = '';
  readonly statusOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'Todos os status' },
    { value: 'PENDING', label: 'Pendente' },
    { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'FINISHED', label: 'Concluída' },
    { value: 'CANCELED', label: 'Cancelada' },
  ];

  readonly categoryOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'Todas as categorias' },
    { value: 'WORK', label: 'Trabalho' },
    { value: 'PERSONAL', label: 'Pessoal' },
    { value: 'IMPORTANT', label: 'Importante' },
    { value: 'STUDY', label: 'Estudos' },
    { value: 'OTHER', label: 'Outros' },
  ];

  filters = {
    title: '',
    status: '',
    category: '',
  };

  constructor(private readonly taskService: TaskService) { }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {

    this.loading.set(true);
    this.error = '';

    this.taskService
      .list({
        page: 0,
        size: 20,
        status: (this.filters.status || undefined) as TaskStatus | undefined,
        category: (this.filters.category || undefined) as TaskCategory | undefined,
        title: this.filters.title,
      })
      .subscribe({
        next: (page) => {
          this.tasks.set(page.content ?? []);
          this.totalItems.set(page.page?.totalElements ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error = 'Não foi possível carregar as tarefas.';
          this.loading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filters = { title: '', status: '', category: '' };
    this.loadTasks();
  }

  completeTask(task: Task): void {
    if (task.taskStatus === 'FINISHED') {
      return;
    }

    this.taskService.updateStatus(task.id, 'FINISHED').subscribe({
      next: () => this.loadTasks(),
      error: () => this.error = 'Não foi possível concluir a tarefa.',
    });
  }

  deleteTask(task: Task): void {
    if (!this.canDeleteTask(task)) {
      this.error = this.getDeleteErrorMessage(task);
      return;
    }

    const confirmed = window.confirm(`Deseja excluir a tarefa "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    this.taskService.delete(task.id).subscribe({
      next: () => {
        this.error = '';
        this.loadTasks();
      },
      error: (err) => {
        this.error = this.getDeleteErrorMessage(task, err);
      },
    });
  }

  private canDeleteTask(task: Task): boolean {
    return task.taskStatus === 'FINISHED' || task.taskStatus === 'CANCELED';
  }

  private extractApiErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return '';
    }

    const candidate = error as {
      error?: unknown;
      message?: unknown;
      statusText?: string;
    };

    const directMessage = candidate.message;
    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage;
    }

    const responseError = candidate.error;
    if (responseError && typeof responseError === 'object') {
      const responsePayload = responseError as {
        message?: unknown;
        error?: unknown;
        details?: unknown;
      };

      const nestedMessage = responsePayload.message ?? responsePayload.error ?? responsePayload.details;
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        return nestedMessage;
      }
    }

    if (candidate.statusText && candidate.statusText.trim()) {
      return candidate.statusText;
    }

    return '';
  }

  private getDeleteErrorMessage(task: Task, error?: unknown): string {
    const apiMessage = this.extractApiErrorMessage(error ?? {});
    const blockingMessage = 'Não é possível excluir uma tarefa que ainda não está concluída ou cancelada. A API só permite remover tarefas com status finalizado ou cancelado.';

    if (!this.canDeleteTask(task) || /pendente|pending|em andamento|in_progress|não.*final|not.*finished|cancelada|canceled/i.test(apiMessage)) {
      return blockingMessage;
    }

    if (apiMessage) {
      return apiMessage;
    }

    return 'Não foi possível excluir a tarefa.';
  }

  getStatusLabel(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      PENDING: 'Pendente',
      IN_PROGRESS: 'Em andamento',
      FINISHED: 'Concluída',
      CANCELED: 'Cancelada',
    };

    return map[status] ?? status;
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
}
