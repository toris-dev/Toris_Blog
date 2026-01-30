'use client';

import { TodoProvider } from '@/contexts/TodoContext';
import TodoList from '@/components/todos/TodoList';
import TodoBoard from '@/components/todos/TodoBoard';
import TodoCalendar from '@/components/todos/TodoCalendar';
import TodoViewSwitcher, { TodoViewType } from '@/components/todos/TodoViewSwitcher';
import TodoForm from '@/components/todos/TodoForm';
import WalletConnectButton from '@/components/todos/WalletConnectButton';
import AuthorizationBanner from '@/components/todos/AuthorizationBanner';
import { TodoItem } from '@/types/todo';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export function TodosPageClient() {
  const [currentView, setCurrentView] = useState<TodoViewType>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | undefined>();

  const handleAddTodo = useCallback(() => {
    setEditingTodo(undefined);
    setIsFormOpen(true);
  }, []);

  const handleEditTodo = useCallback((todo: TodoItem) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTodo(undefined);
  }, []);

  return (
    <TodoProvider>
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border border-primary/20 bg-primary/5 mb-4"
        >
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">toris-dev</span>의 할일 관리 시스템
            </p>
          </div>
        </motion.div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">할일 관리</h1>
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                  toris-dev
                </span>
              </div>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">toris-dev</span>의 개인 할일을 관리하고 추적하세요
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WalletConnectButton />
              <TodoViewSwitcher
                currentView={currentView}
                onViewChange={setCurrentView}
              />
            </div>
          </div>
          <AuthorizationBanner />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[400px] rounded-lg border border-border bg-card/50 p-6 shadow-sm"
        >
          {currentView === 'list' && (
            <TodoList onAddTodo={handleAddTodo} onEditTodo={handleEditTodo} />
          )}
          {currentView === 'board' && (
            <TodoBoard onAddTodo={handleAddTodo} onEditTodo={handleEditTodo} />
          )}
          {currentView === 'calendar' && (
            <TodoCalendar
              onAddTodo={handleAddTodo}
              onEditTodo={handleEditTodo}
            />
          )}
        </motion.div>

        {isFormOpen && (
          <TodoForm
            todo={editingTodo}
            onClose={handleCloseForm}
            onSave={() => {}}
          />
        )}
      </div>
    </TodoProvider>
  );
}
