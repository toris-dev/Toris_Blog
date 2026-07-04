import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), '.data');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (e) {
    // 디렉토리 생성 실패해도 계속 진행
  }
}

// ============ Views (조회수) ============

interface ViewsData {
  [postId: string]: number;
}

async function getViewsData(): Promise<ViewsData> {
  await ensureDataDir();
  try {
    const filePath = path.join(dataDir, 'views.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

async function saveViewsData(data: ViewsData): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(dataDir, 'views.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function incrementViewCount(postId: string): Promise<number> {
  const data = await getViewsData();
  data[postId] = (data[postId] || 0) + 1;
  await saveViewsData(data);
  return data[postId];
}

export async function getViewCount(postId: string): Promise<number> {
  const data = await getViewsData();
  return data[postId] || 0;
}

// ============ Likes (좋아요) ============

interface LikeData {
  count: number;
  ips: string[];
  lastLikedAt?: string;
}

interface LikesData {
  [postId: string]: LikeData;
}

async function getLikesData(): Promise<LikesData> {
  await ensureDataDir();
  try {
    const filePath = path.join(dataDir, 'likes.json');
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

async function saveLikesData(data: LikesData): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(dataDir, 'likes.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function toggleLike(
  postId: string,
  ipAddress: string
): Promise<{ liked: boolean; likeCount: number }> {
  const data = await getLikesData();
  let postData = data[postId] || { count: 0, ips: [] };

  const alreadyLiked = postData.ips.includes(ipAddress);

  if (alreadyLiked) {
    postData.count = Math.max(0, postData.count - 1);
    postData.ips = postData.ips.filter((ip) => ip !== ipAddress);
  } else {
    postData.count += 1;
    postData.ips.push(ipAddress);
    postData.lastLikedAt = new Date().toISOString();
  }

  data[postId] = postData;
  await saveLikesData(data);

  return {
    liked: !alreadyLiked,
    likeCount: postData.count
  };
}

export async function getLikeStatus(
  postId: string,
  ipAddress: string
): Promise<{ liked: boolean; likeCount: number }> {
  const data = await getLikesData();
  const postData = data[postId] || { count: 0, ips: [] };

  return {
    liked: postData.ips.includes(ipAddress),
    likeCount: postData.count
  };
}
