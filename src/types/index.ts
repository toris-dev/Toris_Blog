import { Database } from './supabase';

export type PostRequest = Database['public']['Tables']['Post']['Insert'];

export type Post = Omit<Database['public']['Tables']['Post']['Row'], 'tags'> & {
  tags: string[];
  postId?: number;
};

export type CommentType = {
  content: string;
  created_at: string;
  id: number;
  like: number;
  parent_comment_id: number | null;
  post_id: number;
  writer_id: string;
  replies: CommentType[];
};
