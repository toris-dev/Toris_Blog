import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: 40,
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 42,
            width: 96,
            height: 21,
            borderRadius: 11,
            background: '#FFFFFF'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 79,
            width: 21,
            height: 84,
            borderRadius: 11,
            background: '#FFFFFF'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 107,
            width: 20,
            height: 20,
            borderRadius: 5,
            background: '#34D399'
          }}
        />
      </div>
    ),
    { ...size }
  );
}
