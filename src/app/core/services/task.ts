import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Task,
  TaskCategory,
  TaskCreateRequest,
  TaskPage,
  TaskStatus,
  TaskStatusRequest,
  TaskUpdateRequest,
} from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiUrl = 'http://localhost:8080/tasks';

  constructor(private readonly http: HttpClient) {}

  list(filters?: {
    page?: number;
    size?: number;
    status?: TaskStatus;
    category?: TaskCategory;
    title?: string;
    overdue?: boolean;
  }): Observable<TaskPage> {
    let params = new HttpParams();

    params = params.set('page', String(filters?.page ?? 0));
    params = params.set('size', String(filters?.size ?? 10));

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    if (filters?.category) {
      params = params.set('category', filters.category);
    }

    if (filters?.title?.trim()) {
      params = params.set('title', filters.title.trim());
    }

    if (filters?.overdue === true) {
      params = params.set('overdue', 'true');
    }

    return this.http.get<TaskPage>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  create(task: TaskCreateRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  update(id: number, task: TaskUpdateRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, status: TaskStatus): Observable<Task> {
    const payload: TaskStatusRequest = { status };
    return this.http.patch<Task>(`${this.apiUrl}/${id}/status`, payload);
  }
}
