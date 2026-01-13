import mongoose, { Schema, Document } from 'mongoose';

export interface IPostView extends Document {
  postId: string;
  viewCount: number;
  lastViewedAt: Date;
  uniqueViews: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostViewSchema = new Schema<IPostView>(
  {
    postId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastViewedAt: {
      type: Date,
      default: Date.now
    },
    uniqueViews: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    collection: 'postviews'
  }
);

// 인덱스
PostViewSchema.index({ postId: 1 });
PostViewSchema.index({ viewCount: -1 });

const PostView =
  mongoose.models.PostView || mongoose.model<IPostView>('PostView', PostViewSchema);

export default PostView;
