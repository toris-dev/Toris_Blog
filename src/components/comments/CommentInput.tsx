'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FC, FormEvent, useRef } from 'react';
import toast from 'react-hot-toast';
import { useComments } from '../context/CommentContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

type CommentInputProps = {
  postId: number | string;
};

const CommentInput: FC<CommentInputProps> = ({ postId }) => {
  const router = useRouter();
  const { setOrganizedComments } = useComments();
  const idRef = useRef<HTMLInputElement>(null);
  const pwdRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // postId가 string인 경우 number로 변환
  const numericPostId =
    typeof postId === 'string' ? parseInt(postId, 10) : postId;

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
          postId: numericPostId
        });
        router.refresh();
        toast.success('댓글 작성 성공😁', response.data);
        setOrganizedComments((prev) => [
          ...prev,
          { ...response.data, replies: [] }
        ]);
      } catch (error) {
        toast.error('댓글 작성 실패😥');
      }
    } else {
      // 필수 값 중 하나라도 없는 경우
      toast.error('빈 값을 제대로 작성해주세요');
    }
  };

  const handleCancel = () => {
    idRef.current && (idRef.current.value = '');
    pwdRef.current && (pwdRef.current.value = '');
    contentRef.current && (contentRef.current.value = '');
  };

  return (
    <div className="m-3 w-4/5 max-w-xl rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 dark:shadow-gray-900/30">
      <div className="flex items-start ">
        <div className="grid gap-2">{/* Your comment content here */}</div>
        <div className="border-gray-200 p-4">
          <Input
            ref={idRef}
            placeholder="닉네임 입력"
            className="mr-3 transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
            type="id"
          />
          <Input
            ref={pwdRef}
            placeholder="PWD입력"
            type="password"
            className="transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
          />
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="w-full">
              <span className="sr-only">Comment</span>
              <textarea
                className="mt-3 min-h-[80px] w-full resize-none rounded-lg border border-solid border-gray-300 p-2 text-sm transition-all duration-300 ease-in-out focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                id="comment"
                placeholder="What are your thoughts?"
                style={{ maxHeight: '200px' }}
                ref={contentRef}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="peer text-sm dark:bg-gray-700 dark:hover:bg-gray-600"
                type="submit"
              >
                Submit
              </Button>
              <Button
                className="peer text-sm dark:bg-gray-700 dark:hover:bg-gray-600"
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
