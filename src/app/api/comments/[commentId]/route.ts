import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import {
  validateContent,
  sanitizeContent
} from '@/utils/comment';
import { verifyPassword } from '@/utils/comment.server';

// 댓글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await connectDB();

    const { commentId } = await params;
    const body = await request.json();
    const { authorId, password, content } = body;

    // 입력 검증
    if (!authorId || !password || !content) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '작성자 ID, 비밀번호, 내용이 필요합니다.'
          }
        },
        { status: 400 }
      );
    }

    const contentValidation = validateContent(content);
    if (!contentValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: contentValidation.errors.join(' ')
          }
        },
        { status: 400 }
      );
    }

    // 댓글 조회 (비밀번호 포함)
    const comment = await Comment.findById(commentId).select('+password');

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '댓글을 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      );
    }

    // 삭제된 댓글인지 확인
    if (comment.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '댓글을 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      );
    }

    // 작성자 ID 확인
    if (comment.authorId !== authorId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: '작성자 ID가 일치하지 않습니다.'
          }
        },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, comment.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: '비밀번호가 일치하지 않습니다.'
          }
        },
        { status: 401 }
      );
    }

    // XSS 방지: 콘텐츠 sanitization
    const sanitizedContent = sanitizeContent(content);

    // 댓글 수정
    comment.content = sanitizedContent;
    await comment.save();

    // 비밀번호 제외하고 응답
    const commentResponse = {
      id: comment._id.toString(),
      content: comment.content,
      updatedAt: comment.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      comment: commentResponse
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '댓글 수정 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}

// 댓글 삭제 (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await connectDB();

    const { commentId } = await params;
    const body = await request.json();
    const { authorId, password } = body;

    // 입력 검증
    if (!authorId || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '작성자 ID와 비밀번호가 필요합니다.'
          }
        },
        { status: 400 }
      );
    }

    // 댓글 조회 (비밀번호 포함)
    const comment = await Comment.findById(commentId).select('+password');

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '댓글을 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      );
    }

    // 삭제된 댓글인지 확인
    if (comment.isDeleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '댓글을 찾을 수 없습니다.'
          }
        },
        { status: 404 }
      );
    }

    // 작성자 ID 확인
    if (comment.authorId !== authorId.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: '작성자 ID가 일치하지 않습니다.'
          }
        },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, comment.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_FAILED',
            message: '비밀번호가 일치하지 않습니다.'
          }
        },
        { status: 401 }
      );
    }

    // Soft Delete
    comment.isDeleted = true;
    await comment.save();

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '댓글 삭제 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}
