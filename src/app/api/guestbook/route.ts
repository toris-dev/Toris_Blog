import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Guestbook from '@/models/Guestbook';
import {
  validateGuestbookInput,
  sanitizeMessage
} from '@/utils/guestbook';

// 방명록 작성
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { nickname, message } = body;

    // 입력 검증
    const validation = validateGuestbookInput(nickname, message);
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

    // XSS 방지: 메시지 sanitization
    const sanitizedMessage = sanitizeMessage(message);

    // IP 주소 추출 (선택적)
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined;

    // 방명록 생성
    const guestbook = await Guestbook.create({
      nickname: nickname.trim(),
      message: sanitizedMessage,
      ipAddress
    });

    // IP 주소 제외하고 응답
    const guestbookResponse = {
      id: guestbook._id.toString(),
      nickname: guestbook.nickname,
      message: guestbook.message,
      createdAt: guestbook.createdAt.toISOString()
    };

    return NextResponse.json(
      {
        success: true,
        guestbook: guestbookResponse
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating guestbook entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '방명록 작성 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}

// 방명록 조회
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // 총 방명록 수
    const total = await Guestbook.countDocuments({});

    // 페이지네이션
    const skip = (page - 1) * limit;
    const guestbooks = await Guestbook.find({})
      .select('-ipAddress') // IP 주소 제외
      .sort({ createdAt: -1 }) // 최신순
      .skip(skip)
      .limit(limit)
      .lean();

    // 응답 형식 변환
    const guestbooksResponse = guestbooks.map((guestbook) => ({
      id: guestbook._id.toString(),
      nickname: guestbook.nickname,
      message: guestbook.message,
      createdAt: guestbook.createdAt.toISOString()
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      guestbooks: guestbooksResponse,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching guestbooks:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '방명록 조회 중 오류가 발생했습니다.'
        }
      },
      { status: 500 }
    );
  }
}
