'use client';

import { cn } from '@/utils/style';
import { Tab } from '@headlessui/react';
import { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';
import MarkdownPreview from './MarkdownPreview';

interface MarkdownEditorWithPreviewProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MarkdownEditorWithPreview({
  value,
  onChange,
  placeholder,
  className
}: MarkdownEditorWithPreviewProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex rounded-t-lg bg-gray-100 dark:bg-gray-800">
          <Tab
            className={({ selected }: { selected: boolean }) =>
              cn(
                'w-1/2 rounded-tl-lg py-3 text-sm font-medium',
                'focus:outline-none',
                selected
                  ? 'bg-white text-blue-600 dark:bg-gray-900 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              )
            }
          >
            Edit
          </Tab>
          <Tab
            className={({ selected }: { selected: boolean }) =>
              cn(
                'w-1/2 rounded-tr-lg py-3 text-sm font-medium',
                'focus:outline-none',
                selected
                  ? 'bg-white text-blue-600 dark:bg-gray-900 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              )
            }
          >
            Preview
          </Tab>
        </Tab.List>
        <Tab.Panels className="min-h-[400px] rounded-b-lg bg-white p-4 dark:bg-gray-900">
          <Tab.Panel>
            <MarkdownEditor
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="min-h-[350px] w-full bg-transparent"
            />
          </Tab.Panel>
          <Tab.Panel className="min-h-[350px] overflow-auto">
            <MarkdownPreview content={value} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
