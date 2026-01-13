export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentFormData {
  authorId: string;
  password: string;
  content: string;
  parentId?: string;
}

export interface CommentAuthData {
  authorId: string;
  password: string;
}

export interface CommentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CommentResponse {
  comments: Comment[];
  pagination: CommentPagination;
}
