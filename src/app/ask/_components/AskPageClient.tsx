'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/style';
import { FormEvent, useEffect, useRef, useState } from 'react';

const API_KEY_STORAGE_KEY = 'second-brain-api-key';

type ChatSource = {
  title: string;
  path: string;
  heading?: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AskPageClient() {
  const [apiKey, setApiKey] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const saveApiKey = () => {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    setError(null);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();

    const message = input.trim();
    if (!message || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: message
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (apiKey.trim()) {
        headers['x-second-brain-key'] = apiKey.trim();
      }

      const response = await fetch('/api/second-brain/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message })
      });

      const data = (await response.json()) as {
        answer?: string;
        sources?: ChatSource[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          content: data.answer || '(empty response)',
          sources: data.sources
        }
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : '요청에 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ask</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          제2의 뇌(toris-docs) 문서 검색. LLM 없이 로컬 검색만 사용합니다. 운영
          환경에서는 API 키가 필요합니다.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          API Key (SECOND_BRAIN_API_KEY)
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="운영 환경에서만 필요"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            autoComplete="off"
          />
          <Button type="button" variant="outline" size="sm" onClick={saveApiKey}>
            저장
          </Button>
        </div>
      </div>

      <div className="min-h-[320px] flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            SnapMate, Next.js, 21n 등 저장된 문서에서 키워드를 검색합니다.
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'rounded-md px-3 py-2 text-sm',
              message.role === 'user'
                ? 'ml-8 bg-primary/10 text-foreground'
                : 'mr-8 bg-card text-foreground'
            )}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {message.role === 'user' ? 'You' : 'Brain'}
            </p>
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.sources && message.sources.length > 0 && (
              <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
                {message.sources.map((source) => (
                  <li key={`${source.path}-${source.heading ?? ''}`}>
                    {source.title}
                    {source.heading ? ` · ${source.heading}` : ''} —{' '}
                    {source.path}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {isLoading && (
          <p className="text-sm text-muted-foreground">검색 중…</p>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={sendMessage} className="flex gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={2}
          placeholder="검색어 입력…"
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          전송
        </Button>
      </form>
    </div>
  );
}
