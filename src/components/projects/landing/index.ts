import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { Project } from '@/data/projects';

export type LandingComponent = ComponentType<{ project: Project }>;

/** slug → 서비스 전용 프로덕션 랜딩 컴포넌트 */
export const LANDINGS: Record<string, LandingComponent> = {
  memecatch: dynamic(() => import('./MemeCatchLanding')),
  coursepick: dynamic(() => import('./CoursePickLanding')),
  'instagram-pipeline': dynamic(() => import('./InstaPipelineLanding')),
  'golmok-survivor': dynamic(() => import('./GolmokSurvivorLanding')),
  asyncraft: dynamic(() => import('./AsyncraftLanding')),
  'torisui-kit': dynamic(() => import('./TorisUiLanding')),
  'toris-blog': dynamic(() => import('./TorisBlogLanding')),
  'ym-guide': dynamic(() => import('./YmGuideLanding')),
  'cryptotrade-gg': dynamic(() => import('./CryptoTradeLanding')),
  'love-trip': dynamic(() => import('./LoveTripLanding')),
  tracedesk: dynamic(() => import('./TraceDeskLanding')),
  devpulse: dynamic(() => import('./DevPulseLanding')),
  loca: dynamic(() => import('./LocaLanding')),
  pepebear: dynamic(() => import('./PepeBearLanding')),
  yeti: dynamic(() => import('./YetiLanding'))
};
