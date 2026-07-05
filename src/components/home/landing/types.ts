/** 서버(page.tsx)에서 3D 랜딩 클라이언트로 넘기는 데이터 형태 */

export interface LandingPost {
  title: string;
  slug: string;
  category: string;
  date: string;
  description?: string;
  image?: string;
  tags?: string[];
}

export interface LandingCount {
  name: string;
  count: number;
}

export interface Home3DLandingData {
  postCount: number;
  categoryCount: number;
  tagCount: number;
  projectCount: number;
  featuredPosts: LandingPost[];
  categories: LandingCount[];
  topTags: LandingCount[];
}
