---
tags:
  - reference
---

# Conventions

## Obsidian

- MOC 파일: `Planning`, `Design` 등 대문자 시작
- 프로젝트 허브: `docs/01-projects/{Name}.md`
- 링크: `[[wikilink]]`, 태그: `#phase/planning`

## 코드 (공통)

- 파일명: kebab-case (TS), snake_case (Rust)
- 컴포넌트: PascalCase
- env: `UPPER_SNAKE_CASE`

## Git

- Conventional Commits 스타일 권장
- PR 본문: Summary + Test plan ([[dev-workflow]])

## 문서

- 결정은 날짜 + 이유 ([[architecture-notes]])
- 시크릿 값은 문서에 쓰지 않음 ([[environments-and-secrets]])
- **Vault 정본**: `docs/` — SnapMate·블로그는 `SYNC.md` / `SnapMate/docs/README.md` 참고
- 블로그 발행 원본: `Toris_Blog/public/markdown/` (빌드 경로 유지)
