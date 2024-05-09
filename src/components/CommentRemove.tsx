'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FC, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from './Button';
import Input from './Input';

type ModalProps = {
  commentId: number;
  writerId: string;
  onClose: () => void;
};

const CommentRemove: FC<ModalProps> = ({ commentId, onClose, writerId }) => {
  const pwdRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const handleRemove = async () => {
    const password = pwdRef.current?.value;
    const { data } = await axios.delete('/api/comment', {
      data: { comment_id: commentId, writer_id: writerId, password }
    });
    if (data.error) {
      toast.error('댓글 삭제 실패😥');
    } else {
      toast.success('댓글 삭제 성공😁');
    }
    router.refresh();
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-[0.5]">
      <div className="flex flex-col gap-3 rounded p-5">
        <Input
          placeholder="댓글의 패스워드를 작성하세요"
          type="password"
          ref={pwdRef}
        />
        <p className="text-xl">정말 삭제하시겠습니까?</p>
        <div className="flex gap-3">
          <Button onClick={handleRemove}>삭제하기</Button>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
};

export default CommentRemove;
