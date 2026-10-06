export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELED';
export type TaskCategory = 'WORK' | 'PERSONAL' | 'IMPORTANT' | 'STUDY' | 'OTHER';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  taskStatus: TaskStatus;
  dueDate?: string | null;
  taskCategory: TaskCategory;
}

export interface TaskPage {
  content: Task[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface TaskCreateRequest {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  taskCategory: TaskCategory;
}

export interface TaskUpdateRequest {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  taskCategory: TaskCategory;
}

export interface TaskStatusRequest {
  status: TaskStatus;
}
