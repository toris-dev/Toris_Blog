'use client';

import { TodoItem } from '@/types/todo';
import {
  loadTodosFromStorage,
  saveTodosToStorage,
  shouldResetTodos,
  resetTodosForNewDay,
  generateTodoId
} from '@/utils/todo';
import { useWallet } from './WalletContext';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import toast from 'react-hot-toast';

interface TodoContextType {
  todos: TodoItem[];
  createTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  toggleStatus: (id: string) => void;
  isLoading: boolean;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthorized, address } = useWallet();

  // 서버에서 할일 로드
  useEffect(() => {
    const fetchTodos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/todos');
        if (response.ok) {
          const data = await response.json();
          setTodos(data.todos || []);
        } else {
          console.error('Failed to fetch todos');
          // 실패 시 localStorage에서 로드 (폴백)
          const localTodos = loadTodosFromStorage();
          setTodos(localTodos);
        }
      } catch (error) {
        console.error('Error fetching todos:', error);
        // 에러 시 localStorage에서 로드 (폴백)
        const localTodos = loadTodosFromStorage();
        setTodos(localTodos);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, []);

  const createTodo = async (
    todoData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!isAuthorized || !address) {
      toast.error('할일을 추가하려면 인가된 지갑으로 연결해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          todo: todoData,
          walletAddress: address
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTodos((prev) => [...prev, data.todo]);
        toast.success('할일이 추가되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '할일 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error creating todo:', error);
      toast.error('할일 추가에 실패했습니다.');
    }
  };

  const updateTodo = async (id: string, updates: Partial<TodoItem>) => {
    if (!isAuthorized || !address) {
      toast.error('할일을 수정하려면 인가된 지갑으로 연결해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          updates,
          walletAddress: address
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? data.todo : todo))
        );
        toast.success('할일이 수정되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '할일 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('할일 수정에 실패했습니다.');
    }
  };

  const deleteTodo = async (id: string) => {
    if (!isAuthorized || !address) {
      toast.error('할일을 삭제하려면 인가된 지갑으로 연결해주세요.');
      return;
    }

    try {
      const response = await fetch(
        `/api/todos?id=${id}&walletAddress=${address}`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        setTodos((prev) => prev.filter((todo) => todo.id !== id));
        toast.success('할일이 삭제되었습니다.');
      } else {
        const error = await response.json();
        toast.error(error.error || '할일 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('할일 삭제에 실패했습니다.');
    }
  };

  const toggleStatus = async (id: string) => {
    if (!isAuthorized || !address) {
      toast.error('할일 상태를 변경하려면 인가된 지갑으로 연결해주세요.');
      return;
    }

    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    // 상태 순환: planned -> in-progress -> completed -> planned
    let nextStatus: TodoItem['status'];
    switch (todo.status) {
      case 'planned':
        nextStatus = 'in-progress';
        break;
      case 'in-progress':
        nextStatus = 'completed';
        break;
      case 'completed':
        nextStatus = 'planned';
        break;
      default:
        nextStatus = 'planned';
    }

    await updateTodo(id, { status: nextStatus });
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        createTodo,
        updateTodo,
        deleteTodo,
        toggleStatus,
        isLoading
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}

export function useTodoContext() {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
}
