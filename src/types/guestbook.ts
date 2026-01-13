export interface GuestbookEntry {
  id: string;
  nickname: string;
  message: string;
  createdAt: string;
}

export interface GuestbookFormData {
  nickname: string;
  message: string;
}

export interface GuestbookPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GuestbookResponse {
  guestbooks: GuestbookEntry[];
  pagination: GuestbookPagination;
}
