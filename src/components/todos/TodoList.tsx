'use client';

import { TodoItem as TodoItemType, TodoStatus } from '@/types/todo';
import { useTodos } from '@/hooks/useTodos';
import { useWallet } from '@/contexts/WalletContext';
import TodoItem from './TodoItem';
import { Button } from '@/components/ui/Button';
import { FaPlus } from '@/components/icons';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TodoListProps {
  onAddTodo: () => void;
  onEditTodo: (todo: TodoItemType) => void;
}

export default function TodoList({ onAddTodo, onEditTodo }: TodoListProps) {
  const { todos, getSortedTodos } = useTodos();
  const { isAuthorized } = useWallet();
  const [filterStatus, setFilterStatus] = useState<TodoStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  const filteredTodos = todos.filter((todo) => {
    if (filterStatus === 'all') return true;
    return todo.status === filterStatus;
  });

  const sortedTodos = getSortedTodos(sortBy).filter((todo) => {
    if (filterStatus === 'all') return true;
    return todo.status === filterStatus;
  });

  const statusCounts = {
    all: todos.length,
    planned: todos.filter((t) => t.status === 'planned').length,
    'in-progress': todos.filter((t) => t.status === 'in-progress').length,
    completed: todos.filter((t) => t.status === 'completed').length
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={onAddTodo} 
            className="gap-2"
            disabled={!isAuthorized}
            title={!isAuthorized ? '인가된 지갑으로 연결해주세요' : ''}
          >
            <FaPlus className="size-4" />
            할일 추가
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as TodoStatus | 'all')
            }
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="all">전체 ({statusCounts.all})</option>
            <option value="planned">계획 전 ({statusCounts.planned})</option>
            <option value="in-progress">
              진행중 ({statusCounts['in-progress']})
            </option>
            <option value="completed">완료 ({statusCounts.completed})</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="date">날짜순</option>
            <option value="priority">우선순위순</option>
          </select>
        </div>
      </div>

      {sortedTodos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          {filterStatus === 'all' ? (
            <div className="space-y-2">
              <p className="text-lg">할일이 없습니다</p>
              <p className="text-sm">
                {isAuthorized
                  ? '새로운 할일을 추가해보세요!'
                  : '인가된 지갑으로 연결하면 할일을 추가할 수 있습니다.'}
              </p>
            </div>
          ) : (
            '해당 상태의 할일이 없습니다.'
          )}
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {sortedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={onEditTodo}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

