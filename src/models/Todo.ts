import mongoose, { Schema, Document } from 'mongoose';
import { TodoItem, TodoStatus, TodoPriority } from '@/types/todo';

export interface TodoDocument extends Omit<TodoItem, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const TodoSchema = new Schema<TodoDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed'],
      default: 'planned',
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: undefined
    },
    dueDate: {
      type: String,
      default: undefined
    },
    tags: {
      type: [String],
      default: []
    },
    createdAt: {
      type: String,
      required: true
    },
    updatedAt: {
      type: String,
      required: true
    }
  },
  {
    timestamps: false, // createdAt, updatedAt을 수동으로 관리
    collection: 'todos'
  }
);

// 인덱스 추가 (성능 최적화)
TodoSchema.index({ status: 1 });
TodoSchema.index({ dueDate: 1 });
TodoSchema.index({ createdAt: -1 });

const Todo = mongoose.models.Todo || mongoose.model<TodoDocument>('Todo', TodoSchema);

export default Todo;

