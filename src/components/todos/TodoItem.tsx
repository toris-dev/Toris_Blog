'use client';

import { TodoItem as TodoItemType, TodoStatus, TodoPriority } from '@/types/todo';
import { useTodos } from '@/hooks/useTodos';
import { useWallet } from '@/contexts/WalletContext';
import { FaEdit, FaTrash, FaCheckCircle, FaClock, FaCircle, FaLock } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/style';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

interface TodoItemProps {
  todo: TodoItemType;
  onEdit?: (todo: TodoItemType) => void;
}

const statusConfig: Record<
  TodoStatus,
  { label: string; color: string; icon: React.ComponentType }
> = {
  planned: {
    label: '계획 전',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: FaCircle
  },
  'in-progress': {
    label: '진행중',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: FaClock
  },
  completed: {
    label: '완료',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: FaCheckCircle
  }
};

const priorityConfig: Record<
  TodoPriority,
  { label: string; color: string }
> = {
  low: { label: '낮음', color: 'text-gray-500' },
  medium: { label: '보통', color: 'text-yellow-500' },
  high: { label: '높음', color: 'text-red-500' }
};

export default function TodoItem({ todo, onEdit }: TodoItemProps) {
  const { deleteTodo, toggleStatus } = useTodos();
  const { isAuthorized } = useWallet();
  const statusInfo = statusConfig[todo.status];
  const StatusIcon = statusInfo.icon;
  const priorityInfo = todo.priority ? priorityConfig[todo.priority] : null;

  const handleDelete = () => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteTodo(todo.id);
    }
  };

  const handleToggleStatus = () => {
    toggleStatus(todo.id);
  };

  const isOverdue =
    todo.dueDate && dayjs(todo.dueDate).isBefore(dayjs(), 'day');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md',
        todo.status === 'completed' && 'opacity-75'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleToggleStatus}
              disabled={!isAuthorized}
              className={cn(
                "flex-shrink-0 mt-0.5 transition-opacity",
                !isAuthorized && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`상태 변경: ${statusInfo.label}`}
              title={!isAuthorized ? '인가된 지갑으로 연결해주세요' : ''}
            >
              <StatusIcon
                className={cn(
                  'size-5 transition-colors',
                  statusInfo.color,
                  todo.status === 'completed' && 'text-green-500'
                )}
              />
            </button>
            <h3
              className={cn(
                'font-semibold text-lg flex-1',
                todo.status === 'completed' && 'line-through text-muted-foreground'
              )}
            >
              {todo.title}
            </h3>
          </div>

          {todo.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {todo.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                'px-2 py-1 rounded-full font-medium',
                statusInfo.color
              )}
            >
              {statusInfo.label}
            </span>

            {priorityInfo && (
              <span className={cn('px-2 py-1 rounded-full', priorityInfo.color)}>
                우선순위: {priorityInfo.label}
              </span>
            )}

            {todo.dueDate && (
              <span
                className={cn(
                  'px-2 py-1 rounded-full',
                  isOverdue && todo.status !== 'completed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                )}
              >
                마감: {dayjs(todo.dueDate).format('YYYY-MM-DD')}
              </span>
            )}

            {todo.tags && todo.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {todo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!isAuthorized && (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground bg-muted/50">
              <FaLock className="size-3" />
              <span className="hidden sm:inline">읽기 전용</span>
            </div>
          )}
          {onEdit && isAuthorized && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(todo)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="수정"
            >
              <FaEdit className="size-4" />
            </Button>
          )}
          {isAuthorized && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              aria-label="삭제"
            >
              <FaTrash className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

