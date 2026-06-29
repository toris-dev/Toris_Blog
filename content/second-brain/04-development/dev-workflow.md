---
tags:
  - development
---

# Dev Workflow (1인)

## Git

- `main` — 배포 가능
- `feat/*`, `fix/*` — 기능 단위
- 커밋: 동사 현재형, Why 중심 (예: `fix: 업로드 실패 시 재시도`)

## 세션 루틴

1. Daily 열기 → 오늘 목표 1~3개
2. tmux / Cursor Agent — [[mac-setting]]
3. 끝날 때: PR 또는 merge, Daily에 회고 한 줄

## AI Agent

- **설계·리뷰**: Claude / Cursor Plan
- **구현**: Cursor Agent, Codex CLI
- **대규모 리팩터**: Aider + git

## 문서화

- 비자명한 결정 → [[architecture-notes]]
- API·환경 변수 → 프로젝트 `README` + [[Deployment]]

## 관련

- [[code-review-solo]] · [[testing-strategy]]
