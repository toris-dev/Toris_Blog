import { NextRequest, NextResponse } from 'next/server';
import { toggleLike, getLikeStatus } from '@/lib/fileStorage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = decodeURIComponent(id);

    if (!postId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '포스트 ID가 필요합니다.'
          }
        },
        { status: 400 }
      );
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const result = await toggleLike(postId, ipAddress);

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likeCount: result.likeCount
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '좋아요 처리 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = decodeURIComponent(id);

    if (!postId) {
      return NextResponse.json({
        liked: false,
        likeCount: 0
      });
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const result = await getLikeStatus(postId, ipAddress);

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likeCount: result.likeCount
    });
  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json({
      liked: false,
      likeCount: 0
    });
  }
}
