'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FC, FormEvent, useRef } from 'react';
import Button from './Button';
import Input from './Input';

type CommentInputProps = {
  postId: number;
};

const CommentInput: FC<CommentInputProps> = ({ postId }) => {
  const router = useRouter();
  const idRef = useRef<HTMLInputElement>(null);
  const pwdRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const id = idRef.current?.value;
    const pwd = pwdRef.current?.value;
    const content = contentRef.current?.value;

    // 값이 모두 존재하는지 확인
    if (id && pwd && content) {
      try {
        // 서버에 POST 요청 보내기
        const response = await axios.post('/api/comment', {
          id,
          pwd,
          content,
          postId
        });
        router.refresh();
        console.log('Success', response.data);
      } catch (error) {
        console.error('Error posting comment:', error);
      }
    } else {
      // 필수 값 중 하나라도 없는 경우
      console.error('All fields are required.');
      alert('제대로 입력해주세요.');
    }
  };

  const handleCancel = () => {
    idRef.current && (idRef.current.value = '');
    pwdRef.current && (pwdRef.current.value = '');
    contentRef.current && (contentRef.current.value = '');
  };

  return (
    <div className="m-3 w-4/5 max-w-xl rounded-lg bg-white p-4 shadow-md">
      <div className="flex items-start ">
        <div className="grid gap-2">{/* Your comment content here */}</div>
        <div className=" border-gray-200 p-4 dark:border-gray-400">
          <Input
            ref={idRef}
            placeholder="닉네임 입력"
            className="mr-3 transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500"
            type="id"
          />
          <Input
            ref={pwdRef}
            placeholder="PWD입력"
            type="password"
            className="transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500"
          />
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="w-full">
              <span className="sr-only">Comment</span>
              <textarea
                className="mt-3 min-h-[80px] w-full resize-none rounded-lg border border-solid border-gray-300 p-2 text-sm transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500"
                id="comment"
                placeholder="What are your thoughts?"
                style={{ maxHeight: '200px' }}
                ref={contentRef}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button className="peer text-sm" type="submit">
                Submit
              </Button>
              <Button
                className="peer text-sm"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;