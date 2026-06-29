import { NextRequest } from 'next/server';

export function isSecondBrainAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const configuredKey = process.env.SECOND_BRAIN_API_KEY;

  if (!configuredKey) {
    return false;
  }

  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;
  const headerKey = request.headers.get('x-second-brain-key');

  return bearerToken === configuredKey || headerKey === configuredKey;
}
