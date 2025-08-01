'use client';

import { cn } from '@/utils/style';
import { AiOutlineRobot } from '@react-icons/all-files/ai/AiOutlineRobot';
import { BsFillPersonFill } from '@react-icons/all-files/bs/BsFillPersonFill';
import { FC } from 'react';
import PostCard, { type PostCardProps } from '../blog/PostCard';

export type ChatbotMessageProps = {
  content: string;
  role: 'user' | 'assistant';
  posts?: Omit<PostCardProps, 'className'>[];
};

const ChatbotMessage: FC<ChatbotMessageProps> = ({ content, role, posts }) => {
  return (
    <div
      className={cn('p-4 md:p-6', role === 'user' ? 'bg-white' : 'bg-gray-100')}
      data-cy={`message-${role}`}
    >
      <div className="container mx-auto flex items-start gap-3 md:gap-4">
        {role === 'user' ? (
          <BsFillPersonFill className="size-6 shrink-0" />
        ) : (
          <AiOutlineRobot className="size-6 shrink-0" />
        )}
        <div className="flex flex-col items-start">
          <div className="whitespace-pre-wrap">{content}</div>
          {posts && posts.length > 0 && (
            <div className="mt-4 flex justify-start">
              {posts.map((post) => (
                <PostCard
                  {...post}
                  key={post.id}
                  className="w-[300px] border"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotMessage;
