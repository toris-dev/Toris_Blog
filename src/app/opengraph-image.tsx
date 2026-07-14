import { ImageResponse } from 'next/og';

export const alt = 'TORIS — 아이디어를 작동하게, 끝까지';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: '#F4F1E8',
          color: '#080A0D',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
          padding: '76px 84px'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(90deg, rgba(8,10,13,0.055) 1px, transparent 1px), linear-gradient(rgba(8,10,13,0.055) 1px, transparent 1px)',
            backgroundSize: '72px 72px'
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 690,
            position: 'relative'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: '#535B66',
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: 5
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 12,
                height: 12,
                background: '#5CEBFF'
              }}
            />
            TORIS · PRODUCT ENGINEERING LAB
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 38,
              fontSize: 78,
              lineHeight: 0.94,
              fontWeight: 800,
              letterSpacing: -5
            }}
          >
            <span>아이디어를 작동하게,</span>
            <span style={{ color: '#006877', marginTop: 15 }}>끝까지.</span>
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              fontSize: 26,
              lineHeight: 1.45,
              color: '#535B66'
            }}
          >
            앱 · 웹 · 데스크톱 제품을 설계하고 개발합니다.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 38,
              gap: 28,
              color: '#080A0D',
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: 2
            }}
          >
            <span>DIAGNOSE</span>
            <span>DESIGN</span>
            <span>ENGINEER</span>
            <span>DEPLOY</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: 65,
            top: 65,
            width: 390,
            height: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#080A0D',
            borderRadius: 28
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 280,
              height: 280,
              border: '2px dashed #C99A3D',
              borderRadius: 9999,
              display: 'flex'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 132,
              left: 72,
              width: 246,
              height: 36,
              background: '#F4F1E8',
              display: 'flex'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 132,
              left: 177,
              width: 36,
              height: 230,
              background: '#F4F1E8',
              display: 'flex'
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 116,
              height: 116,
              borderRadius: 9999,
              background: '#F4F1E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 68,
                height: 68,
                borderRadius: 9999,
                background: '#5CEBFF'
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 52,
              top: 257,
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: '#C99A3D',
              display: 'flex'
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 52,
              top: 257,
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: '#B72E2C',
              display: 'flex'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 48,
              width: 24,
              height: 24,
              borderRadius: 9999,
              background: '#5CEBFF',
              display: 'flex'
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: 12,
            background:
              'linear-gradient(90deg, #C99A3D 0 33%, #5CEBFF 33% 76%, #B72E2C 76%)',
            display: 'flex'
          }}
        />
      </div>
    ),
    { ...size }
  );
}
