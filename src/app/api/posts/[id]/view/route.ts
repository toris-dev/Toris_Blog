import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PostView from '@/models/PostView';

// 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

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

    // 조회수 증가 (upsert 사용)
    const postView = await PostView.findOneAndUpdate(
      { postId },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() }
      },
      {
        upsert: true,
        new: true
      }
    );

    return NextResponse.json({
      success: true,
      viewCount: postView.viewCount
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

// 조회수 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

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

    const postView = await PostView.findOne({ postId });

    if (!postView) {
      return NextResponse.json({
        viewCount: 0,
        uniqueViews: 0
      });
    }

    return NextResponse.json({
      viewCount: postView.viewCount,
      uniqueViews: postView.uniqueViews || 0
    });
  } catch (error) {
    console.error('Error fetching view count:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '조회수 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}
