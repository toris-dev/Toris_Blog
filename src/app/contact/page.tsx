'use client';

import { submitContactForm } from '@/app/actions/contact';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Message } from '@/components/ui/Message';
import { useState, useTransition } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [responseMessage, setResponseMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setResponseMessage('');

    startTransition(async () => {
      const result = await submitContactForm({ name, email, message });

      if (result.success) {
        setStatus('success');
        setResponseMessage(result.message);
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setResponseMessage(result.message || '메시지 전송에 실패했습니다.');
      }
    });
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="neon-glow mb-8 text-center text-4xl font-bold">
        문의하기
      </h1>
      <p className="mb-8 text-center text-lg text-foreground">
        질문이 있으시거나 함께 작업하고 싶으시다면 메시지를 보내주세요!
      </p>

      <form
        onSubmit={handleSubmit}
        className="neon-border space-y-6 rounded-2xl border border-primary/30 bg-card/50 p-8 backdrop-blur-sm"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            이름
          </label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            이메일
          </label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            메시지
          </label>
          <textarea
            id="message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="block w-full rounded-md border border-primary/30 bg-background/50 p-3 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          ></textarea>
        </div>
        <Button
          type="submit"
          disabled={isPending || status === 'loading'}
          className="w-full"
        >
          {isPending || status === 'loading' ? '전송 중...' : '메시지 보내기'}
        </Button>

        {responseMessage && (
          <Message type={status === 'success' ? 'success' : 'error'}>
            {responseMessage}
          </Message>
        )}
      </form>
    </div>
  );
}
