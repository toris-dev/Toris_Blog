---
tags:
  - moc
  - phase/development
---

# Development (개발)

기획·디자인 문서를 **구현·테스트·리뷰**로 연결한다.

## 문서 맵

- [[dev-workflow]] — 브랜치·커밋·AI Agent 루틴
- [[architecture-notes]] — 아키텍처 결정 기록 (ADR 스타일)
- [[code-review-solo]] — 1인 코드 리뷰 체크리스트
- [[testing-strategy]] — 테스트 피라미드·도구
- [[mac-setting]] — 로컬 개발 환경

## 표준 스택 (참고)

- Runtime: TypeScript, Rust, Bun — [[tech-stack]]
- DB: PostgreSQL, Redis
- IDE: Cursor, Claude, Codex
- Container: OrbStack

## 기능 구현 시

1. [[feature-spec]] 또는 [[prd-checklist]] 링크
2. [[design-brief]] / Figma 확인
3. 브랜치 → 구현 → [[code-review-solo]]
4. Daily에 진행·블로커 기록

## 관련

- [[Planning]] · [[Design]] · [[Deployment]] · [[Home]]
