import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
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

    console.log('LOAD TASKS FOI CHAMADO');
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
          console.log('RESPOSTA DA API:', page);
          this.tasks.set(page.content ?? []);
          this.totalItems.set(page.page?.totalElements ?? 0);
          this.loading.set(false);

          console.log('ESTADO FINAL:', {
            tasks: this.tasks,
            loading: this.loading,
            totalItems: this.totalItems
          });

        },
        error: (err) => {
          console.log('ERRO', err)
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
    const confirmed = window.confirm(`Deseja excluir a tarefa "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    this.taskService.delete(task.id).subscribe({
      next: () => this.loadTasks(),
      error: () => this.error = 'Não foi possível excluir a tarefa.',
    });
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
