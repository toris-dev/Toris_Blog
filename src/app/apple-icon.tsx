import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const appIcon = await readFile(
    path.join(process.cwd(), 'public/brand/toris-app-icon-v2.svg'),
    'utf8'
  );

  return new ImageResponse(
    (
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(appIcon).toString('base64')}`}
        alt=""
        width={size.width}
        height={size.height}
        style={{ objectFit: 'cover' }}
      />
    ),
    { ...size }
  );
}
