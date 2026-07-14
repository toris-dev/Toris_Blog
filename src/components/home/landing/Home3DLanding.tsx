'use client';

import StudioLanding from '@/components/studio/StudioLanding';
import type { Home3DLandingData } from './types';

export default function Home3DLanding({ data }: { data: Home3DLandingData }) {
  return (
    <StudioLanding
      projectCount={data.projectCount}
      latestPosts={data.featuredPosts.slice(0, 3)}
    />
  );
}
