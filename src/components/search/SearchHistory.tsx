'use client';

import { useState, useEffect } from 'react';
import { getSearchHistory, removeSearchHistoryItem, clearSearchHistory } from '@/utils/search';
import { SearchHistoryItem } from '@/utils/search';
import { Button } from '@/components/ui/Button';
import { FaTrash, FaTimes } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchHistoryProps {
  onSelect: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchHistory({ onSelect, isOpen, onClose }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getSearchHistory());
    }
  }, [isOpen]);

  const handleSelect = (query: string) => {
    onSelect(query);
    onClose();
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearchHistoryItem(index);
    setHistory(getSearchHistory());
  };

  const handleClear = () => {
    clearSearchHistory();
    setHistory([]);
  };

  if (!isOpen || history.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full z-50 mt-2 w-full rounded-lg border border-border bg-card shadow-lg"
        >
          <div className="max-h-64 overflow-y-auto p-2">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-medium text-muted-foreground">최근 검색</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 text-xs"
              >
                전체 삭제
              </Button>
            </div>
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelect(item.query)}
                className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="flex-1 truncate">{item.query}</span>
                <button
                  onClick={(e) => handleRemove(index, e)}
                  className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="삭제"
                >
                  <FaTimes className="size-3 text-muted-foreground" />
                </button>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
