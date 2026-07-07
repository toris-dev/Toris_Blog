import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { Project } from '@/data/projects';

export type LandingComponent = ComponentType<{ project: Project }>;

/** slug → 서비스 전용 프로덕션 랜딩 컴포넌트 */
export const LANDINGS: Record<string, LandingComponent> = {
  'nova-chain': dynamic(() => import('./NovaChainLanding')),
  'love-trip': dynamic(() => import('./LoveTripLanding')),
  tracedesk: dynamic(() => import('./TraceDeskLanding')),
  snapmate: dynamic(() => import('./SnapMateLanding')),
  devpulse: dynamic(() => import('./DevPulseLanding')),
  loca: dynamic(() => import('./LocaLanding')),
  'bubble-bible': dynamic(() => import('./BubbleBibleLanding')),
  pepebear: dynamic(() => import('./PepeBearLanding')),
  yeti: dynamic(() => import('./YetiLanding'))
};
