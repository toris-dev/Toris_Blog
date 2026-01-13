import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PostLike from '@/models/PostLike';

// 좋아요 추가/제거 (토글)
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

    // IP 주소 추출 (중복 방지용)
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 좋아요 문서 조회 또는 생성
    let postLike = await PostLike.findOne({ postId });

    if (!postLike) {
      postLike = await PostLike.create({
        postId,
        likeCount: 0,
        likedBy: [],
        lastLikedAt: new Date()
      });
    }

    // IP 기반 중복 체크 (간단한 구현)
    const isAlreadyLiked = postLike.likedBy.includes(ipAddress);
    let liked = false;

    if (isAlreadyLiked) {
      // 좋아요 제거
      postLike.likeCount = Math.max(0, postLike.likeCount - 1);
      postLike.likedBy = postLike.likedBy.filter((ip) => ip !== ipAddress);
      liked = false;
    } else {
      // 좋아요 추가
      postLike.likeCount += 1;
      postLike.likedBy.push(ipAddress);
      postLike.lastLikedAt = new Date();
      liked = true;
    }

    await postLike.save();

    return NextResponse.json({
      success: true,
      liked,
      likeCount: postLike.likeCount
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

// 좋아요 상태 조회
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

    const postLike = await PostLike.findOne({ postId });

    if (!postLike) {
      return NextResponse.json({
        liked: false,
        likeCount: 0
      });
    }

    // IP 기반 좋아요 상태 확인
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const liked = postLike.likedBy.includes(ipAddress);

    return NextResponse.json({
      liked,
      likeCount: postLike.likeCount
    });
  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '좋아요 상태 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}
