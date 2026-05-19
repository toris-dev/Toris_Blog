import mongoose, { Schema, Document } from 'mongoose';

export interface IPostLike extends Document {
  postId: string;
  likeCount: number;
  likedBy: string[];
  lastLikedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PostLikeSchema = new Schema<IPostLike>(
  {
    postId: {
      type: String,
      required: true,
      unique: true
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likedBy: {
      type: [String],
      default: []
    },
    lastLikedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: 'postlikes'
  }
);

PostLikeSchema.index({ likeCount: -1 });

const PostLike =
  mongoose.models.PostLike || mongoose.model<IPostLike>('PostLike', PostLikeSchema);

export default PostLike;
