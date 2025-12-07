import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js 16: 캐시 태그를 활용한 부분 재검증 API
 *
 * 사용 예시:
 * - 포스트 추가/수정/삭제 시: POST /api/revalidate?tag=posts
 * - 카테고리 변경 시: POST /api/revalidate?tag=categories
 * - 전체 재검증: POST /api/revalidate?tag=posts&tag=categories
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tags = searchParams.getAll('tag');

    // 보안: 환경 변수로 보호된 토큰 확인 (선택사항)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.REVALIDATE_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (tags.length === 0) {
      return NextResponse.json({ error: 'No tags provided' }, { status: 400 });
    }

    // 각 태그에 대해 재검증
    // Next.js 16: revalidateTag는 tag와 type을 받습니다
    for (const tag of tags) {
      revalidateTag(tag, { expire: 6 * 60 * 60 * 1000 });
    }

    return NextResponse.json({
      revalidated: true,
      tags,
      now: Date.now()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error revalidating cache' },
      { status: 500 }
    );
  }
}
