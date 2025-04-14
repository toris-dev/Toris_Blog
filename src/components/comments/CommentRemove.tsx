'use client';

import axios from 'axios';
import { FC, useRef } from 'react';
import toast from 'react-hot-toast';
import { useComments } from '../context/CommentContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

type ModalProps = {
  commentId: number;
  writerId: string;
  onClose: () => void;
};

const CommentRemove: FC<ModalProps> = ({ commentId, onClose, writerId }) => {
  const pwdRef = useRef<HTMLInputElement>(null);
  const { setOrganizedComments } = useComments();

  const handleRemove = async () => {
    const password = pwdRef.current?.value;
    const { data } = await axios.delete('/api/comment', {
      data: { comment_id: commentId, writer_id: writerId, password }
    });
    setOrganizedComments((prevComments) => {
      // 대댓글 삭제
      if (data.parent_comment_id) {
        return prevComments.map((comment) =>
          comment.id === data.parent_comment_id
            ? {
                ...comment,
                replies: comment.replies?.filter(
                  (reply) => reply.id !== commentId
                )
              }
            : comment
        );
      }
      // 댓글 삭제
      else {
        return prevComments.filter((comment) => comment.id !== commentId);
      }
    });
    if (data.error) {
      toast.error('댓글 삭제 실패😥');
    } else {
      toast.success('댓글 삭제 성공😁');
    }
    onClose();
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-[0.5] dark:bg-gray-900 dark:bg-opacity-[0.5]">
      <div className="flex flex-col gap-3 rounded bg-white p-5 shadow-md dark:bg-gray-800 dark:shadow-gray-900/30">
        <Input
          placeholder="댓글의 패스워드를 작성하세요"
          type="password"
          ref={pwdRef}
          className="dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
        />
        <p className="text-xl dark:text-white">정말 삭제하시겠습니까?</p>
        <div className="flex gap-3">
          <Button
            onClick={handleRemove}
            className="dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            삭제하기
          </Button>
          <Button
            onClick={onClose}
            className="dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentRemove;
