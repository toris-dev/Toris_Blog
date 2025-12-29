'use client';

import { Button } from '@/components/ui/Button';
import { FaListAlt, BsGrid, FaCalendarAlt } from '@/components/icons';
import { cn } from '@/utils/style';

export type TodoViewType = 'list' | 'board' | 'calendar';

interface TodoViewSwitcherProps {
  currentView: TodoViewType;
  onViewChange: (view: TodoViewType) => void;
}

const views: { type: TodoViewType; label: string; icon: React.ComponentType }[] =
  [
    { type: 'list', label: '리스트', icon: FaListAlt },
    { type: 'board', label: '칸반', icon: BsGrid },
    { type: 'calendar', label: '캘린더', icon: FaCalendarAlt }
  ];

export default function TodoViewSwitcher({
  currentView,
  onViewChange
}: TodoViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.type;

        return (
          <Button
            key={view.type}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange(view.type)}
            className={cn(
              'flex items-center gap-2 transition-all',
              isActive 
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{view.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

