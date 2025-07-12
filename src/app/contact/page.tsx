'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Message } from '@/components/ui/Message';
import { useState } from 'react';

// 메타데이터는 Server Component에서만 export 가능하므로 별도 파일로 분리하거나
// generateMetadata 함수를 사용해야 합니다.

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setResponseMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setResponseMessage(
          data.message || 'Your message has been sent successfully!'
        );
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
        setResponseMessage(data.error || 'Failed to send message');
      }
    } catch (error) {
      setStatus('error');
      setResponseMessage('An unexpected error occurred.');
      console.error('Contact form error:', error);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="mb-8 text-center text-4xl font-bold">Contact Me</h1>
      <p className="mb-8 text-center text-lg text-gray-600 dark:text-gray-400">
        Have a question or want to work together? Send me a message!
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Name
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
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email
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
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Message
          </label>
          <textarea
            id="message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="block w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </div>
        <Button
          type="submit"
          disabled={status === 'loading'}
          className="w-full"
        >
          {status === 'loading' ? 'Sending...' : 'Send Message'}
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
