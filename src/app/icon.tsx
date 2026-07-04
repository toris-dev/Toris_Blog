import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
          borderRadius: 14,
          position: 'relative'
        }}
      >
        {/* T 가로 바 */}
        <div
          style={{
            position: 'absolute',
            top: 17,
            left: 15,
            width: 34,
            height: 8,
            borderRadius: 4,
            background: '#FFFFFF'
          }}
        />
        {/* T 세로 스템 */}
        <div
          style={{
            position: 'absolute',
            top: 17,
            left: 28,
            width: 8,
            height: 30,
            borderRadius: 4,
            background: '#FFFFFF'
          }}
        />
        {/* 터미널 커서 */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 38,
            width: 7,
            height: 7,
            borderRadius: 2,
            background: '#34D399'
          }}
        />
      </div>
    ),
    { ...size }
  );
}
