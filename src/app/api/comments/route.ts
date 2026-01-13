import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import {
  validateCommentInput,
  sanitizeContent
} from '@/utils/comment';
import { hashPassword } from '@/utils/comment.server';

// 댓글 작성
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { postId, authorId, password, content, parentId } = body;

    // 입력 검증
    const validation = validateCommentInput(authorId, password, content);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.errors.join(' ')
          }
        },
        { status: 400 }
      );
    }

    // postId 검증
    if (!postId || typeof postId !== 'string') {
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

    // XSS 방지: 콘텐츠 sanitization
    const sanitizedContent = sanitizeContent(content);

    // 비밀번호 해싱
    const hashedPassword = await hashPassword(password);

    // 댓글 생성
    const comment = await Comment.create({
      postId,
      authorId: authorId.trim(),
      password: hashedPassword,
      content: sanitizedContent,
      parentId: parentId || null,
      isDeleted: false
    });

    // 비밀번호 제외하고 응답
    const commentResponse = {
      id: comment._id.toString(),
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      parentId: comment.parentId?.toString() || null,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    };

    return NextResponse.json(
      {
        success: true,
        comment: commentResponse
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '댓글 작성 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}

// 댓글 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

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

    // 삭제되지 않은 댓글만 조회
    const query = {
      postId,
      isDeleted: false
    };

    // 총 댓글 수
    const total = await Comment.countDocuments(query);

    // 페이지네이션
    const skip = (page - 1) * limit;
    const comments = await Comment.find(query)
      .select('-password') // 비밀번호 제외
      .sort({ createdAt: -1 }) // 최신순
      .skip(skip)
      .limit(limit)
      .lean();

    // 응답 형식 변환
    const commentsResponse = comments.map((comment) => ({
      id: comment._id.toString(),
      postId: comment.postId,
      authorId: comment.authorId,
      content: comment.content,
      parentId: comment.parentId?.toString() || null,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      comments: commentsResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '댓글 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}
