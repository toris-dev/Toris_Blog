'use client';

import { CommentType } from '@/types';
import { FcLike } from '@react-icons/all-files/fc/FcLike';
import axios from 'axios';
import dayjs from 'dayjs';
import Image from 'next/image';
import { FC, useState } from 'react';
import ReactModal from 'react-modal';
import Button from './Button';
import CommentRemove from './CommentRemove';
import CommentUpdateInput from './CommentUpdateInput';
import ReplyInput from './Reply';
import { useComments } from './context/CommentContext';

const customModalStyles: ReactModal.Styles = {
  overlay: {
    backgroundColor: ' rgba(0, 0, 0, 0.4)',
    width: '100%',
    height: '100vh',
    zIndex: '10',
    position: 'fixed',
    top: '0',
    left: '0'
  },
  content: {
    width: '360px',
    height: '180px',
    zIndex: '150',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '10px',
    boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.25)',
    backgroundColor: 'white',
    justifyContent: 'center',
    overflow: 'auto'
  }
};

const Comment: FC<CommentType> = ({
  content,
  created_at,
  id,
  like,
  replies,
  post_id,
  writer_id
}) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(like);
  const [update, setUpdate] = useState(false);
  const [removeModal, setRemoveModal] = useState(false);
  const handlerLike = () => {
    axios.put('/api/comment/like', { commentId: id }).then(() => {
      setLikeCount((prev) => prev + 1);
    });
  };
  const { organizedComments } = useComments();
  console.log(organizedComments);
  return (
    <div className="w-full rounded-xl bg-white p-4 shadow-xl">
      <div className="flex items-start">
        <div className="mr-4 flex size-24 items-center justify-center overflow-hidden rounded-full">
          <Image
            src="/placeholder-user.jpg"
            alt="user"
            width={100}
            height={100}
            objectFit="cover"
          />
        </div>
        {update ? (
          <CommentUpdateInput
            commentId={id}
            writerId={writer_id}
            content={content}
            onClose={() => setUpdate(false)}
          />
        ) : (
          <div className="grow">
            <ReactModal
              isOpen={removeModal}
              onRequestClose={() => setRemoveModal(false)}
              style={customModalStyles}
              ariaHideApp={false}
              contentLabel="Pop up Message"
              shouldCloseOnOverlayClick={true}
            >
              <CommentRemove
                writerId={writer_id}
                commentId={id}
                onClose={() => setRemoveModal(false)}
              />
            </ReactModal>
            <div className="flex items-center justify-between">
              <div className="flex w-full items-center justify-start gap-3">
                <div>
                  <span>Writer: </span>
                  <h5 className="inline text-lg font-bold">{writer_id}</h5>
                </div>
                <Button
                  className="flex h-7 w-10 items-center justify-center bg-gray-300 hover:bg-gray-500"
                  onClick={() => setUpdate(true)}
                >
                  수정
                </Button>
                <Button
                  className="flex h-7 w-10 items-center justify-center bg-gray-300 hover:bg-gray-500"
                  onClick={() => setRemoveModal(true)}
                >
                  삭제
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                {dayjs(new Date(created_at)).format('YY년 MM월 DD일 HH:mm')}
              </p>
            </div>
            <hr className="my-3 w-full border" />
            <p className="text-sm text-gray-700">{content}</p>
            <div className="mt-4 flex justify-center space-x-2">
              <Button
                className="flex h-10 w-32 items-center justify-center self-end rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                onClick={handlerLike}
              >
                좋아요
                <span className="flex gap-1 text-center">
                  <FcLike />
                  {likeCount}
                </span>
              </Button>
              {replyOpen ? (
                <ReplyInput
                  commentId={id}
                  postId={post_id}
                  setReplyOpen={() => setReplyOpen(false)}
                />
              ) : (
                <>
                  <Button
                    className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
                    onClick={() => setReplyOpen(true)}
                  >
                    답글 달기
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {replies.length > 0 && (
        <div className="mt-4">
          {replies.map((reply) => (
            <div className="ml-4" key={reply.id}>
              <Comment key={reply.id} {...reply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
