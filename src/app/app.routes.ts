import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard';
import { TaskForm } from './features/tasks/task-form/task-form';
import { TaskList } from './features/tasks/task-list/task-list';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'tasks', component: TaskList },
  { path: 'tasks/new', component: TaskForm },
  { path: 'tasks/:id/edit', component: TaskForm },
  { path: '**', redirectTo: '' },
];
