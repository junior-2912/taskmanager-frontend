import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { Dashboard } from '../../dashboard/dashboard';
import { TaskList } from './task-list';
import { Task } from '../../../core/models/task.model';
import { TaskService } from '../../../core/services/task';
import { TaskForm } from '../task-form/task-form';

describe('TaskList', () => {
  it('should explain that only finished or canceled tasks may be deleted', () => {
    const component = new TaskList({} as any);
    const task: Task = {
      id: 1,
      title: 'Tarefa pendente',
      description: 'Descrição',
      taskStatus: 'PENDING',
      taskCategory: 'WORK',
    };

    const message = component['getDeleteErrorMessage'](task, { error: { message: 'Task cannot be deleted while status is PENDING' } });

    expect(message).toContain('concluída');
    expect(message).toContain('cancelado');
  });

  it('should mark overdue tasks only when the due date has passed and the task is active', () => {
    const component = new TaskList({} as any);
    const now = new Date();

    const overdueTask: Task = {
      id: 2,
      title: 'Tarefa atrasada',
      description: 'Prazo vencido',
      taskStatus: 'PENDING',
      dueDate: new Date(now.getTime() - 60000).toISOString(),
      taskCategory: 'WORK',
    };

    const finishedTask: Task = {
      ...overdueTask,
      id: 3,
      taskStatus: 'FINISHED',
    };

    const canceledTask: Task = {
      ...overdueTask,
      id: 4,
      taskStatus: 'CANCELED',
    };

    expect(component.isTaskOverdue(overdueTask)).toBeTrue();
    expect(component.isTaskOverdue(finishedTask)).toBeFalse();
    expect(component.isTaskOverdue(canceledTask)).toBeFalse();
  });
});

describe('TaskService', () => {
  it('should include overDue only when the overdue filter is active', () => {
    const http = {
      get: jasmine.createSpy('get').and.returnValue(of({ content: [], page: { totalElements: 0 } })),
    };

    const service = new TaskService(http as any);

    service.list({ page: 0, size: 10, overdue: true });
    const trueParams = http.get.calls.mostRecent().args[1].params;
    expect(trueParams.get('overdue')).toBe('true');

    service.list({ page: 0, size: 10, overdue: false });
    const falseParams = http.get.calls.mostRecent().args[1].params;
    expect(falseParams.has('overdue')).toBeFalse();
  });
});

describe('TaskForm', () => {
  it('should reject past due dates based on the same backend business rule', () => {
    const component = new TaskForm(
      new FormBuilder(),
      {} as any,
      { snapshot: { paramMap: { get: () => null } } } as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any,
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    expect(component.isDueDatePast(yesterday.toISOString().slice(0, 10))).toBeTrue();
    expect(component.isDueDatePast(new Date().toISOString().slice(0, 10))).toBeFalse();
  });

  it('should block status changes on tasks already finished or canceled', () => {
    const component = new TaskForm(
      new FormBuilder(),
      {} as any,
      { snapshot: { paramMap: { get: () => null } } } as any,
      { navigateByUrl: jasmine.createSpy('navigateByUrl') } as any,
    );

    component.form.patchValue({ taskStatus: 'FINISHED' });
    component.isEditing = true;
    component.taskId = 1;

    expect(component.canChangeStatus('PENDING')).toBeFalse();

    component.form.patchValue({ taskStatus: 'CANCELED' });
    expect(component.canChangeStatus('IN_PROGRESS')).toBeFalse();
  });
});

describe('Dashboard', () => {
  it('should count overdue tasks using the same API business rule', () => {
    const component = new Dashboard({ list: () => ({ subscribe: () => {} }) } as any);
    const now = new Date();

    component.tasks.set([
      { id: 1, title: 'Atrasada', taskStatus: 'PENDING', dueDate: new Date(now.getTime() - 60000).toISOString(), taskCategory: 'WORK' },
      { id: 2, title: 'Concluída', taskStatus: 'FINISHED', dueDate: new Date(now.getTime() - 60000).toISOString(), taskCategory: 'WORK' },
      { id: 3, title: 'Cancelada', taskStatus: 'CANCELED', dueDate: new Date(now.getTime() - 60000).toISOString(), taskCategory: 'WORK' },
      { id: 4, title: 'No prazo', taskStatus: 'IN_PROGRESS', dueDate: new Date(now.getTime() + 60000).toISOString(), taskCategory: 'WORK' },
    ]);

    expect(component.overdueTasks).toBe(1);
  });
});
