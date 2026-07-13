import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { Project } from '@/data/projects';

export type LandingComponent = ComponentType<{ project: Project }>;

/** slug → 서비스 전용 프로덕션 랜딩 컴포넌트 */
export const LANDINGS: Record<string, LandingComponent> = {
  'hanbutgil-garden': dynamic(() => import('./HanbutgilGardenLanding')),
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
  yeti: dynamic(() => import('./YetiLanding')),
  '21n-apps': dynamic(() => import('./21nAppsLanding')),
  snapmate: dynamic(() => import('./SnapMateLanding')),
  'bubble-bible': dynamic(() => import('./BubbleBibleLanding')),
  'dongne-paint': dynamic(() => import('./DongnePaintLanding')),
  'youth-money-guide': dynamic(() => import('./YouthMoneyGuideLanding')),
  'starlight-greenhouse': dynamic(() => import('./StarlightGreenhouseLanding')),
  'volley-king-30': dynamic(() => import('./VolleyKingLanding')),
  'toris-docs': dynamic(() => import('./TorisDocsLanding')),
  'product-growth-skills': dynamic(() => import('./ProductGrowthSkillsLanding'))
};
