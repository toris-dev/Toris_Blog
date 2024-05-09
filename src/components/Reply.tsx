'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useRef } from 'react';
import Button from './Button';

const ReplyInput: React.FC<{
  commentId: number;
  postId: number;
  setReplyOpen: () => void;
}> = ({ commentId, setReplyOpen, postId }) => {
  const idRef = useRef<HTMLInputElement>(null);
  const pwdRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      idRef.current?.value.length! <= 4 &&
      pwdRef.current?.value.length! <= 4
    ) {
      const id = idRef.current?.value;
      const pwd = pwdRef.current?.value;
      const content = contentRef.current?.value;
      axios.post('/api/comment', {
        id,
        pwd,
        content,
        postId,
        parent_comment_id: commentId
      });
    }
    router.refresh();
  };

  return (
    <form className="mt-4" onSubmit={handleSubmit}>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="아이디"
            className={`rounded-lg border p-2 text-sm transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500`}
            ref={idRef}
          />
          <input
            type="password"
            placeholder="패스워드"
            className={`rounded-lg border p-2 text-sm transition-all duration-300  ease-in-out focus:ring-2 focus:ring-blue-500`}
            ref={pwdRef}
          />
        </div>
        <textarea
          className="mt-3 min-h-[80px] w-full resize-none rounded-lg border border-solid border-gray-300 p-2 text-sm transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500"
          id="comment"
          placeholder="What are your thoughts?"
          style={{ maxHeight: '200px' }}
          ref={contentRef}
        />
      </div>
      <div className="flex gap-x-3">
        <Button
          type="submit"
          className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors duration-200 ease-in-out hover:bg-blue-600"
        >
          답글 달기
        </Button>
        <Button
          onClick={setReplyOpen}
          className="mt-2 rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors duration-200 ease-in-out hover:bg-gray-600"
        >
          댓글 입력 닫기
        </Button>
      </div>
    </form>
  );
};

export default ReplyInput;
