import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default async function Icon() {
  const mark = await readFile(
    path.join(process.cwd(), 'public/brand/toris-mark-v3.svg'),
    'utf8'
  );

  return new ImageResponse(
    (
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(mark).toString('base64')}`}
        alt=""
        width={size.width}
        height={size.height}
        style={{ objectFit: 'contain' }}
      />
    ),
    { ...size }
  );
}
