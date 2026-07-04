import { NextRequest, NextResponse } from 'next/server';
import { incrementViewCount, getViewCount } from '@/lib/fileStorage';

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

    const viewCount = await incrementViewCount(postId);

    return NextResponse.json({
      success: true,
      viewCount
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '조회수 증가 중 오류가 발생했습니다.'
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
        viewCount: 0
      });
    }

    const viewCount = await getViewCount(postId);

    return NextResponse.json({
      success: true,
      viewCount
    });
  } catch (error) {
    console.error('Error fetching view count:', error);
    return NextResponse.json({
      viewCount: 0
    });
  }
}
