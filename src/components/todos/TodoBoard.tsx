'use client';

import { TodoItem as TodoItemType, TodoStatus } from '@/types/todo';
import { useTodos } from '@/hooks/useTodos';
import { useWallet } from '@/contexts/WalletContext';
import TodoItem from './TodoItem';
import { Button } from '@/components/ui/Button';
import { FaPlus } from '@/components/icons';
import { motion } from 'framer-motion';

interface TodoBoardProps {
  onAddTodo: () => void;
  onEditTodo: (todo: TodoItemType) => void;
}

const columns: { status: TodoStatus; label: string }[] = [
  { status: 'planned', label: '계획 전' },
  { status: 'in-progress', label: '진행중' },
  { status: 'completed', label: '완료' }
];

export default function TodoBoard({ onAddTodo, onEditTodo }: TodoBoardProps) {
  const { getTodosByStatus } = useTodos();
  const { isAuthorized } = useWallet();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const todos = getTodosByStatus(column.status);

          return (
            <motion.div
              key={column.status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg">{column.label}</h3>
                <span className="rounded-full bg-background px-2 py-1 text-sm font-medium">
                  {todos.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px] max-h-[600px]">
                {todos.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    할일이 없습니다
                  </div>
                ) : (
                  todos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onEdit={onEditTodo}
                    />
                  ))
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

