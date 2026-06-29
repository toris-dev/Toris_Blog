---
tags:
  - deployment
  - security
---

# Environments & Secrets

## 원칙

- `.env`·키 파일은 **git 제외**
- Obsidian에는 **변수 이름만** 기록, 값은 1Password / macOS Keychain
- 프로덕션·스테이징 키 분리

## 프로젝트별 표 (값은 비움)

| 변수 | local | staging | prod | 비고 |
|------|-------|---------|------|------|
| `DATABASE_URL` | | | | |
| `API_KEY` | | | | |

## 저장 위치

- 로컬: `.env.local` (gitignore)
- CI: GitHub Secrets / Firebase / Vercel dashboard
- 문서: 이 노트 + 프로젝트 README 링크

## 로테이션

- [ ] 유출 의심 시 즉시 rotate
- [ ] 분기 1회 키 점검 (솔로)

## 관련

- [[deploy-checklist]] · [[ci-cd-notes]]
