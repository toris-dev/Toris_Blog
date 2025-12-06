import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Toris Blog';
    const subtitle = searchParams.get('subtitle') || '웹 개발자의 기술 블로그';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage:
              'radial-gradient(circle at 25px 25px, #1e293b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1e293b 2%, transparent 0%)',
            backgroundSize: '100px 100px'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              maxWidth: '1200px'
            }}
          >
            {/* 로고/아이콘 영역 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '40px'
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '60px',
                  background:
                    'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '60px',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                T
              </div>
            </div>

            {/* 제목 */}
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: '20px',
                lineHeight: '1.2',
                maxWidth: '1000px'
              }}
            >
              {title}
            </h1>

            {/* 부제목 */}
            {subtitle && (
              <p
                style={{
                  fontSize: '32px',
                  color: '#94a3b8',
                  textAlign: 'center',
                  marginTop: '20px',
                  maxWidth: '800px'
                }}
              >
                {subtitle}
              </p>
            )}

            {/* 하단 정보 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginTop: '60px',
                fontSize: '24px',
                color: '#64748b'
              }}
            >
              <span>toris-dev.vercel.app</span>
              <span>•</span>
              <span>웹 개발 기술 블로그</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    // 에러 발생 시 기본 이미지 반환
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            fontSize: '48px'
          }}
        >
          Toris Blog
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    );
  }
}
