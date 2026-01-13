export interface BookmarkData {
  postId: string;
  title: string;
  addedAt: string; // ISO string
}

export interface BookmarkStorage {
  bookmarks: BookmarkData[];
}
