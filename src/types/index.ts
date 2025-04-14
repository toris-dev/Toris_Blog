// Markdown file type
export interface MarkdownFile {
  id: number;
  title: string;
  date: string;
  slug: string;
  content: string;
  filePath: string;
  tags: string[];
  category: string;
  image?: string;
  description?: string;
}

// Post type for PostCard component
export interface Post {
  id: number;
  title: string;
  content: string;
  preview_image_url?: string;
  category: string;
  tags: string[] | string;
  date: string;
  slug: string;
  filePath: string;
}

// GitHub comment types
export interface GitHubUser {
  login: string;
  avatar: string;
  url: string;
}

export interface GitHubComment {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: GitHubUser;
  url: string;
}

// CommentType for Comment component
export interface CommentType {
  id: number;
  content: string;
  created_at: string;
  writer_id: string;
  like: number;
  post_id: number;
  parent_comment_id: number | null;
  replies: CommentType[];
}
