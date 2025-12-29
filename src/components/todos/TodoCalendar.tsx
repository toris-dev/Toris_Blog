'use client';

import { TodoItem as TodoItemType } from '@/types/todo';
import { useTodos } from '@/hooks/useTodos';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/Button';
import { FaPlus, FaChevronLeft, FaChevronRight } from '@/components/icons';
import { useState } from 'react';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import TodoItem from './TodoItem';

interface TodoCalendarProps {
  onAddTodo: () => void;
  onEditTodo: (todo: TodoItemType) => void;
}

export default function TodoCalendar({
  onAddTodo,
  onEditTodo
}: TodoCalendarProps) {
  const { todos, getTodosByDate } = useTodos();
  const { isAuthorized } = useWallet();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfWeek = startOfMonth.day();

  const monthStart = startOfMonth.format('YYYY-MM-DD');
  const monthEnd = endOfMonth.format('YYYY-MM-DD');

  // 해당 월의 할일들
  const monthTodos = todos.filter((todo) => {
    if (!todo.dueDate) return false;
    const todoDate = dayjs(todo.dueDate).format('YYYY-MM-DD');
    return todoDate >= monthStart && todoDate <= monthEnd;
  });

  const getTodosForDate = (date: string) => {
    return getTodosByDate(date);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
  };

  const renderCalendarDays = () => {
    const days = [];
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 요일 헤더
    weekDays.forEach((day) => {
      days.push(
        <div
          key={day}
          className="flex items-center justify-center p-2 text-sm font-semibold text-muted-foreground"
        >
          {day}
        </div>
      );
    });

    // 빈 칸 (첫 주의 시작일 전)
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // 날짜 칸
    for (let day = 1; day <= daysInMonth; day++) {
      const date = startOfMonth.add(day - 1, 'day');
      const dateString = date.format('YYYY-MM-DD');
      const isToday = dateString === dayjs().format('YYYY-MM-DD');
      const isSelected = selectedDate === dateString;
      const dayTodos = getTodosForDate(dateString);
      const hasTodos = dayTodos.length > 0;

      days.push(
        <motion.button
          key={day}
          onClick={() => setSelectedDate(isSelected ? null : dateString)}
          className={`
            relative p-2 rounded-lg border transition-colors
            ${isToday ? 'border-primary bg-primary/10' : 'border-border'}
            ${isSelected ? 'ring-2 ring-primary' : ''}
            ${hasTodos ? 'hover:bg-muted' : ''}
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div
            className={`text-sm font-medium ${
              isToday ? 'text-primary' : 'text-foreground'
            }`}
          >
            {day}
          </div>
          {hasTodos && (
            <div className="mt-1 flex flex-wrap gap-1">
              {dayTodos.slice(0, 2).map((todo) => (
                <div
                  key={todo.id}
                  className={`h-1 w-1 rounded-full ${
                    todo.status === 'completed'
                      ? 'bg-green-500'
                      : todo.status === 'in-progress'
                        ? 'bg-blue-500'
                        : 'bg-gray-500'
                  }`}
                />
              ))}
              {dayTodos.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{dayTodos.length - 2}
                </div>
              )}
            </div>
          )}
        </motion.button>
      );
    }

    return days;
  };

  const selectedDateTodos = selectedDate
    ? getTodosForDate(selectedDate)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <FaChevronLeft className="size-4" />
          </Button>
          <h2 className="text-xl font-bold min-w-[200px] text-center">
            {currentDate.format('YYYY년 MM월')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <FaChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            오늘
          </Button>
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
      </div>

      <div className="grid grid-cols-7 gap-2 rounded-lg border border-border bg-card p-4">
        {renderCalendarDays()}
      </div>

      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-lg border border-border bg-card p-4"
        >
          <h3 className="mb-4 text-lg font-semibold">
            {dayjs(selectedDate).format('YYYY년 MM월 DD일')} 할일
          </h3>
          {selectedDateTodos.length === 0 ? (
            <p className="text-muted-foreground">해당 날짜의 할일이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {selectedDateTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onEdit={onEditTodo}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

