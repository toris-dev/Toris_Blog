import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: string;
  authorId: string;
  password: string;
  content: string;
  parentId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: {
      type: String,
      required: true,
      index: true
    },
    authorId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    password: {
      type: String,
      required: true,
      select: false // 기본 조회 시 제외
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'comments'
  }
);

// 인덱스
CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1 });

const Comment =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
