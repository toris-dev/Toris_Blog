export type TodoStatus = 'planned' | 'in-progress' | 'completed';
export type TodoPriority = 'low' | 'medium' | 'high';

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority?: TodoPriority;
  createdAt: string; // ISO date string
  updatedAt: string;
  dueDate?: string; // ISO date string (선택적)
  tags?: string[];
}

