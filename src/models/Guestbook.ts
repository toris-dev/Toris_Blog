import mongoose, { Schema, Document } from 'mongoose';

export interface IGuestbook extends Document {
  nickname: string;
  message: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuestbookSchema = new Schema<IGuestbook>(
  {
    nickname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    ipAddress: {
      type: String,
      select: false // 기본 조회 시 제외
    }
  },
  {
    timestamps: true,
    collection: 'guestbooks'
  }
);

// 인덱스
GuestbookSchema.index({ createdAt: -1 });

const Guestbook =
  mongoose.models.Guestbook ||
  mongoose.model<IGuestbook>('Guestbook', GuestbookSchema);

export default Guestbook;
