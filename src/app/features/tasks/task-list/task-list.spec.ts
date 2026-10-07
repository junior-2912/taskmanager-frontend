import { TaskList } from './task-list';
import { Task } from '../../../core/models/task.model';

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
});
