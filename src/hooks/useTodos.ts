import { TodoItem, TodoStatus } from '@/types/todo';
import {
  filterTodosByStatus,
  filterTodosByDate,
  sortTodosByPriority,
  sortTodosByDate
} from '@/utils/todo';
import { useTodoContext } from '@/contexts/TodoContext';

export function useTodos() {
  const context = useTodoContext();

  const getTodosByStatus = (status: TodoStatus): TodoItem[] => {
    return filterTodosByStatus(context.todos, status);
  };

  const getTodosByDate = (date: string): TodoItem[] => {
    return filterTodosByDate(context.todos, date);
  };

  const getSortedTodos = (
    sortBy: 'priority' | 'date' = 'date'
  ): TodoItem[] => {
    if (sortBy === 'priority') {
      return sortTodosByPriority(context.todos);
    }
    return sortTodosByDate(context.todos);
  };

  const getPlannedTodos = (): TodoItem[] => {
    return getTodosByStatus('planned');
  };

  const getInProgressTodos = (): TodoItem[] => {
    return getTodosByStatus('in-progress');
  };

  const getCompletedTodos = (): TodoItem[] => {
    return getTodosByStatus('completed');
  };

  const getTodoById = (id: string): TodoItem | undefined => {
    return context.todos.find((todo) => todo.id === id);
  };

  return {
    ...context,
    getTodosByStatus,
    getTodosByDate,
    getSortedTodos,
    getPlannedTodos,
    getInProgressTodos,
    getCompletedTodos,
    getTodoById
  };
}

