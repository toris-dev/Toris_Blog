'use client';

import { TodoItem, TodoStatus, TodoPriority } from '@/types/todo';
import { useTodos } from '@/hooks/useTodos';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FaTimes } from '@/components/icons';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface TodoFormProps {
  todo?: TodoItem;
  onClose: () => void;
  onSave?: () => void;
}

export default function TodoForm({ todo, onClose, onSave }: TodoFormProps) {
  const { createTodo, updateTodo } = useTodos();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TodoStatus>('planned');
  const [priority, setPriority] = useState<TodoPriority | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setStatus(todo.status);
      setPriority(todo.priority || '');
      setDueDate(todo.dueDate ? dayjs(todo.dueDate).format('YYYY-MM-DD') : '');
      setTags(todo.tags || []);
    }
  }, [todo]);

  // 모달이 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (mounted) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [mounted]);

  const { isAuthorized } = useWallet();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthorized) {
      toast.error('인가된 지갑으로 연결해주세요.');
      return;
    }

    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    const todoData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority: priority || undefined,
      dueDate: dueDate || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    if (todo) {
      updateTodo(todo.id, todoData);
    } else {
      createTodo(todoData);
    }

    onSave?.();
    onClose();
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[1400px] max-h-[90vh] rounded-lg border border-border bg-card p-6 shadow-lg overflow-y-auto"
        >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {todo ? '할일 수정' : '새 할일 추가'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <FaTimes className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              제목 <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할일 제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              설명
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="할일 설명을 입력하세요 (선택사항)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium mb-1"
              >
                상태
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TodoStatus)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="planned">계획 전</option>
                <option value="in-progress">진행중</option>
                <option value="completed">완료</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium mb-1"
              >
                우선순위
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TodoPriority | '')
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">선택 안함</option>
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
              마감일
            </label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              태그
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="태그를 입력하고 Enter를 누르세요"
              />
              <Button type="button" onClick={handleAddTag}>
                추가
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600"
                    >
                      <FaTimes className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button 
              type="submit"
              disabled={!isAuthorized}
              title={!isAuthorized ? '인가된 지갑으로 연결해주세요' : ''}
            >
              {todo ? '수정' : '추가'}
            </Button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

