---
tags:
  - github
  - workspace
path: /Users/toris/projects
---

# Local Workspace

Obsidian vault 루트 = `projects/` (이 Mac).

## Clone · 작업 중

| 경로 | GitHub | 비고 |
|------|--------|------|
| `SnapMate/` | toris-dev/SnapMate | **private**, active |
| `Toris_Blog/` | toris-dev/Toris_Blog | public, active |
| `docs/` | (vault only) | 제2의 뇌 정본 |

## 문서만 vault에 있음 (원격만)

- 나머지 35+ public 레포 — 필요 시 `gh repo clone toris-dev/{name}`
- 21n — 회사 머신/별도 경로 (여기 없음)

## 권장 clone 위치

```bash
cd /Users/toris/projects
gh repo clone toris-dev/love-trip
```

## 동기화 규칙

| 종류 | 정본 |
|------|------|
| SnapMate 코드 문서 | `docs/01-projects/SnapMate/` (+ repo `SnapMate/docs/README`) |
| 블로그 마크다운 발행 | `Toris_Blog/public/markdown/` |
| 지식·나·레포 인벤토리 | `docs/` |

## 관련

- [[repo-map]] · [[repos-private]] · [[Home]]
