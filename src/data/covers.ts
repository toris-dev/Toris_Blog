/**
 * 프로젝트 커버 이미지 레지스트리 — slug → 로컬 자산 매핑.
 * 실제 마케팅/스크린샷 자산(/Users/toris/projects/marketing 원본 보존)과
 * Higgsfield 컨셉 커버(생성 내역: public/media/generated/manifest.json)만 등록한다.
 * 여기 없는 프로젝트는 ProjectCover가 액센트 토큰 기반 CSS 커버로 대체한다.
 */
import type { ImageMetadata } from 'astro';
import memecatch from '../assets/projects/memecatch-cover.png';
import loveTrip from '../assets/projects/love-trip-cover.png';
// 플레이스토어 제출 자료(피처 그래픽 1024×500) — 실제 스토어에 게시된 이미지
import snapmate from '../assets/projects/snapmate-feature.png';
import loca from '../assets/projects/loca-feature.png';
import bubbleBible from '../assets/projects/bubble-bible-feature.png';
import hwanseung from '../assets/projects/hwanseung-jiok-feature.png';
import dongnePaint from '../assets/projects/dongne-paint-feature.png';
import tracedesk from '../assets/generated/project-tracedesk-cover-v1.png';
import hanbutgil from '../assets/generated/project-hanbutgil-garden-cover-v1.png';

export const covers: Record<string, ImageMetadata> = {
  memecatch,
  'love-trip': loveTrip,
  snapmate,
  loca,
  'bubble-bible': bubbleBible,
  'hwanseung-jiok': hwanseung,
  'dongne-paint': dongnePaint,
  tracedesk,
  'hanbutgil-garden': hanbutgil
};

/** 의미 있는 커버의 사실 기반 대체 텍스트 (컨셉 커버는 은유임을 명시) */
export const coverAlts: Record<string, string> = {
  memecatch: '밈캐치 데스크톱·모바일 화면 소개 커버',
  'love-trip': 'LOVETRIP 여행 설계 화면 소개 커버',
  snapmate: 'SnapMate 플레이스토어 피처 그래픽',
  loca: 'Loca 플레이스토어 피처 그래픽',
  'bubble-bible': 'Bubble Bible 플레이스토어 피처 그래픽',
  'hwanseung-jiok': '환승지옥 플레이스토어 피처 그래픽',
  'dongne-paint': '동네 칠하기 대작전 플레이스토어 피처 그래픽',
  tracedesk: 'TraceDesk 컨셉 커버 — 하루의 활동이 타임라인 블록으로 기록되는 은유',
  'hanbutgil-garden': '한붓길 정원 컨셉 커버 — 정원 타일을 잇는 한 줄의 길 은유'
};

/** 4:3 컨셉 커버의 초점 위치 — 16:9 크롭 시 피사체가 잘리지 않도록 */
export const coverPositions: Record<string, string> = {
  tracedesk: '50% 72%',
  'hanbutgil-garden': '50% 62%'
};
