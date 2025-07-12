import { getPostData } from '@/utils/markdown';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const posts = getPostData();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
