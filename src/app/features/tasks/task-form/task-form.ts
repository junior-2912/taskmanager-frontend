import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskCategory, TaskStatus } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task';

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrl: './task-form.css',
  templateUrl: './task-form.html',
})
export class TaskForm implements OnInit {
  taskId: number | null = null;
  isEditing = false;
  loading = signal(false);
  submitError = '';
  successMessage = '';
  readonly terminalStatuses: TaskStatus[] = ['FINISHED', 'CANCELED'];

  readonly categoryOptions: Array<{ value: TaskCategory; label: string }> = [
    { value: 'WORK', label: 'Trabalho' },
    { value: 'PERSONAL', label: 'Pessoal' },
    { value: 'IMPORTANT', label: 'Importante' },
    { value: 'STUDY', label: 'Estudos' },
    { value: 'OTHER', label: 'Outros' },
  ];

  readonly statusOptions: Array<{ value: TaskStatus; label: string }> = [
    { value: 'PENDING', label: 'Pendente' },
    { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'FINISHED', label: 'Concluída' },
    { value: 'CANCELED', label: 'Cancelada' },
  ];

  form!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly taskService: TaskService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      taskCategory: ['WORK' as TaskCategory, Validators.required],
      taskStatus: ['PENDING' as TaskStatus, Validators.required],
      dueDate: ['', Validators.required],
    });

    const idFromRoute = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isFinite(idFromRoute) && idFromRoute > 0) {
      this.taskId = idFromRoute;
      this.isEditing = true;
    }
  }

  ngOnInit(): void {
    console.log("TaskId: ", this.taskId);
    if (!this.taskId) {
      return;
    }

    this.loading.set(true);
    this.taskService.getById(this.taskId).subscribe({
      next: (task) => {
        console.log('ANTES DO PATCH');

        this.form.patchValue({
          title: task.title,
          description: task.description ?? '',
          taskCategory: task.taskCategory,
          taskStatus: task.taskStatus,
          dueDate: this.formatDateTimeInput(task.dueDate),
        });

        console.log('ANTES DO LOADING FALSE');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao buscar task:', err);

        this.submitError = 'Não foi possível carregar a tarefa para edição.';
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError = 'Preencha todos os campos obrigatórios.';
      return;
    }

    const dueDateValue = this.form.value.dueDate as string | null;
    if (this.isDueDatePast(dueDateValue)) {
      this.form.get('dueDate')?.markAsTouched();
      this.submitError = 'A data e hora de entrega não podem estar no passado.';
      return;
    }

    if (this.isTaskLocked() && !this.isTerminalStatus(this.form.value.taskStatus as TaskStatus)) {
      this.submitError = 'Não é possível alterar o status de uma tarefa concluída ou cancelada.';
      return;
    }

    this.loading.set(true);
    this.submitError = '';
    this.successMessage = '';

    const payload = {
      title: this.form.value.title ?? '',
      description: this.form.value.description ?? '',
      dueDate: this.form.value.dueDate,
      taskCategory: this.form.value.taskCategory as TaskCategory,
    };

    if (this.taskId) {
      this.taskService.update(this.taskId, payload).subscribe({
        next: (updatedTask) => {
          const selectedStatus = this.form.value.taskStatus as TaskStatus;
          const currentStatus = updatedTask.taskStatus ?? 'PENDING';

          if (selectedStatus !== currentStatus) {
            this.taskService.updateStatus(this.taskId!, selectedStatus).subscribe({
              next: () => this.finishSubmit(),
              error: () => this.finishSubmit('Não foi possível atualizar o status da tarefa.'),
            });
            return;
          }

          this.finishSubmit();
        },
        error: () => {
          this.loading.set(false);
          this.submitError = 'Não foi possível atualizar a tarefa.';
        },
      });
      return;
    }

    this.taskService.create(payload).subscribe({
      next: (createdTask) => {
        const status = this.form.value.taskStatus as TaskStatus;

        if (status !== 'PENDING') {
          this.taskService.updateStatus(createdTask.id, status).subscribe({
            next: () => this.finishSubmit(),
            error: () => this.finishSubmit('Tarefa criada, mas não foi possível atualizar o status.'),
          });
          return;
        }

        this.finishSubmit();
      },
      error: () => {
        this.loading.set(false);
        this.submitError = 'Não foi possível criar a tarefa.';
      },
    });
  }

  private finishSubmit(errorMessage?: string): void {
    this.loading.set(false);
    this.submitError = errorMessage ?? '';
    this.successMessage = this.taskId ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.';

    setTimeout(() => {
      this.router.navigateByUrl('/tasks');
    }, 400);
  }

  isDueDatePast(value: string | null | undefined): boolean {
    if (!value || !value.trim()) {
      return false;
    }

    const selectedDateTime = new Date(value);
    if (Number.isNaN(selectedDateTime.getTime())) {
      return false;
    }

    return selectedDateTime.getTime() < Date.now();
  }

  canChangeStatus(status: TaskStatus): boolean {
    if (!this.isEditing || !this.taskId || !this.form) {
      return true;
    }

    const currentStatus = this.form.get('taskStatus')?.value as TaskStatus | undefined;
    if (this.isTerminalStatus(currentStatus)) {
      return false;
    }

    return !this.isTerminalStatus(status);
  }

  isTaskLocked(): boolean {
    if (!this.isEditing || !this.taskId) {
      return false;
    }

    const currentStatus = this.form.get('taskStatus')?.value as TaskStatus | undefined;
    return this.isTerminalStatus(currentStatus);
  }

  private isTerminalStatus(status?: TaskStatus | null): boolean {
    return status === 'FINISHED' || status === 'CANCELED';
  }

  private formatDateTimeInput(value?: string | null): string {
    return value?.trim().replace(' ', 'T').slice(0, 16) ?? '';
  }

  get fieldError(): string {
    const titleControl = this.form.get('title');
    const dueDateControl = this.form.get('dueDate');

    if (titleControl?.touched && titleControl.hasError('required')) {
      return 'Título obrigatório.';
    }

    if (titleControl?.touched && titleControl.hasError('minlength')) {
      return 'Título deve ter pelo menos 3 caracteres.';
    }

    if (dueDateControl?.touched && dueDateControl.hasError('required')) {
      return 'Data e hora de entrega obrigatórias.';
    }

    if (dueDateControl?.touched && this.isDueDatePast(dueDateControl.value)) {
      return 'Data e hora de entrega não podem estar no passado.';
    }

    return '';
  }
}
