import IconButton from '@/components/IconButton';
import Message, { MessageProps } from '@/components/Message';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import type { ChatCompletionMessageParam } from 'openai/resources/index';
import { FC, FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import Button from './Button';
const SearchPage: FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messageParams, setMessageParams] = useState<
    ChatCompletionMessageParam[]
  >(() => {
    const existingMessages = localStorage.getItem('messages');
    if (!existingMessages) return [];
    return JSON.parse(existingMessages);
  });

  const { mutate, isPending } = useMutation<
    ChatCompletionMessageParam[],
    unknown,
    ChatCompletionMessageParam[]
  >({
    mutationFn: async (messages) => {
      const res = await axios.post('/api/completions', { messages });
      return res.data.messages;
    },
    onSuccess: (data) => {
      setMessageParams(data);
      localStorage.setItem('messages', JSON.stringify(data));
    }
  });

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (isPending || !inputRef.current) return;
      const nextMessages = [
        ...messageParams,
        {
          content: inputRef.current.value ?? ('' as string),
          role: 'user' as const
        }
      ];
      setMessageParams(nextMessages);
      mutate(nextMessages);

      inputRef.current.value = '';
    },
    [isPending, messageParams, mutate]
  );

  const messagePropsList = useMemo(() => {
    return messageParams.filter(
      (param): param is MessageProps =>
        param.role === 'assistant' || param.role === 'user'
    );
  }, [messageParams]);

  const handleReset = useCallback(() => {
    if (window.confirm('대화를 초기화 하시겠습니까?')) {
      setMessageParams([]);
      localStorage.removeItem('messages');
    }
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Message content="무엇이든 물어보세요" role="assistant" />
      <div className="flex-1">
        {messagePropsList.map((props, index) => (
          <Message {...props} key={index} />
        ))}
        {isPending && <Message content="생각중..." role="assistant" />}
      </div>
      <div className="container mx-auto p-4 pb-12">
        <form
          onSubmit={handleSubmit}
          className="flex items-center rounded-md border"
        >
          <input
            ref={inputRef}
            type="text"
            className="flex-1 rounded-md p-2 pl-3"
            placeholder="NextJS가 뭐야?"
          />
          <IconButton Icon={AiOutlineSearch} type="submit" />
        </form>

        <Button
          className="ml-auto mt-2 block w-[100px]"
          type="button"
          onClick={handleReset}
        >
          대화 초기화
        </Button>
      </div>
    </div>
  );
};

export default SearchPage;