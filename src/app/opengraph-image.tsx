import { ImageResponse } from 'next/og';

export const alt = 'Toris Blog — Full-Stack Developer Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const AVATAR_URL = 'https://github.com/toris-dev.png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050810',
          position: 'relative',
          fontFamily: 'sans-serif'
        }}
      >
        {/* 앰비언트 글로우 */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            left: -100,
            width: 600,
            height: 600,
            borderRadius: 9999,
            background:
              'radial-gradient(circle, rgba(99,102,241,0.45), transparent 65%)',
            display: 'flex'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -260,
            right: -120,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background:
              'radial-gradient(circle, rgba(236,72,153,0.4), transparent 65%)',
            display: 'flex'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: 300,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background:
              'radial-gradient(circle, rgba(52,211,153,0.22), transparent 65%)',
            display: 'flex'
          }}
        />

        {/* 콘텐츠 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 64,
            padding: '0 96px'
          }}
        >
          {/* GitHub 아바타 + 그라디언트 링 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 232,
              height: 232,
              borderRadius: 9999,
              background: 'linear-gradient(135deg, #6366F1, #EC4899)',
              padding: 8,
              boxShadow: '0 24px 80px rgba(99,102,241,0.35)'
            }}
          >
            { }
            <img
              src={AVATAR_URL}
              alt=""
              width={216}
              height={216}
              style={{ borderRadius: 9999, border: '6px solid #050810' }}
            />
          </div>

          {/* 텍스트 블록 */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: '#94A3B8',
                fontSize: 26,
                letterSpacing: 6
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 14,
                  height: 14,
                  borderRadius: 9999,
                  background: '#34D399'
                }}
              />
              TORIS-DEV
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 14,
                fontSize: 96,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: -3
              }}
            >
              Toris Blog
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 10,
                fontSize: 34,
                color: '#CBD5E1'
              }}
            >
              Full-Stack Developer · Tech Blog & Projects
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 34 }}>
              {['Next.js', 'React', 'TypeScript', 'Web3', 'AI'].map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    padding: '10px 22px',
                    borderRadius: 9999,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#E2E8F0',
                    fontSize: 24
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 그라디언트 바 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 10,
            background:
              'linear-gradient(90deg, #6366F1 0%, #EC4899 50%, #34D399 100%)',
            display: 'flex'
          }}
        />
      </div>
    ),
    { ...size }
  );
}
