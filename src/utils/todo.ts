import { TodoItem } from '@/types/todo';
import dayjs from 'dayjs';

const STORAGE_KEY = 'toris-blog-todos';
const LAST_RESET_KEY = 'toris-blog-todos-last-reset';

/**
 * localStorage에서 할일 목록을 불러옵니다.
 */
export function loadTodosFromStorage(): TodoItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as TodoItem[];
  } catch (error) {
    console.error('Failed to load todos from storage:', error);
    return [];
  }
}

/**
 * localStorage에 할일 목록을 저장합니다.
 */
export function saveTodosToStorage(todos: TodoItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Failed to save todos to storage:', error);
  }
}

/**
 * 마지막 초기화 날짜를 가져옵니다.
 */
export function getLastResetDate(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(LAST_RESET_KEY);
}

/**
 * 마지막 초기화 날짜를 저장합니다.
 */
export function saveLastResetDate(date: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(LAST_RESET_KEY, date);
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 */
export function getTodayDateString(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * 일일 초기화가 필요한지 확인합니다.
 * 완료된 할일만 유지하고, 미완료는 다음날로 이월합니다.
 */
export function shouldResetTodos(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const lastReset = getLastResetDate();
  const today = getTodayDateString();

  // 첫 방문이거나 오늘 아직 초기화하지 않은 경우
  if (!lastReset || lastReset !== today) {
    return true;
  }

  return false;
}

/**
 * 할일 목록을 일일 초기화합니다.
 * 완료된 할일만 유지하고, 미완료는 다음날로 이월합니다.
 */
export function resetTodosForNewDay(todos: TodoItem[]): TodoItem[] {
  const today = getTodayDateString();

  // 완료된 할일만 유지
  const completedTodos = todos.filter((todo) => todo.status === 'completed');

  // 미완료 할일은 그대로 유지 (다음날로 이월)
  const incompleteTodos = todos.filter(
    (todo) => todo.status !== 'completed'
  );

  // 초기화 날짜 저장
  saveLastResetDate(today);

  return [...incompleteTodos, ...completedTodos];
}

/**
 * 날짜별로 할일을 필터링합니다.
 */
export function filterTodosByDate(
  todos: TodoItem[],
  date: string
): TodoItem[] {
  return todos.filter((todo) => {
    if (!todo.dueDate) {
      return false;
    }
    return dayjs(todo.dueDate).format('YYYY-MM-DD') === date;
  });
}

/**
 * 상태별로 할일을 필터링합니다.
 */
export function filterTodosByStatus(
  todos: TodoItem[],
  status: TodoItem['status']
): TodoItem[] {
  return todos.filter((todo) => todo.status === status);
}

/**
 * 우선순위별로 할일을 정렬합니다.
 */
export function sortTodosByPriority(todos: TodoItem[]): TodoItem[] {
  const priorityOrder: Record<TodoPriority, number> = {
    high: 3,
    medium: 2,
    low: 1
  };

  return [...todos].sort((a, b) => {
    const aPriority = a.priority ? priorityOrder[a.priority] : 0;
    const bPriority = b.priority ? priorityOrder[b.priority] : 0;
    return bPriority - aPriority;
  });
}

/**
 * 생성일 기준으로 할일을 정렬합니다.
 */
export function sortTodosByDate(todos: TodoItem[]): TodoItem[] {
  return [...todos].sort((a, b) => {
    return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
  });
}

/**
 * UUID를 생성합니다.
 */
export function generateTodoId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

