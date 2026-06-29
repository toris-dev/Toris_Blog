---
tags:
  - moc
  - github
aliases:
  - GitHub 레포
---

# GitHub (@toris-dev)

모든 레포지토리 인벤토리. `gh auth login` 후 `sync-github.sh`로 갱신 (2026-06-01 반영).

## 문서

| 노트 | 내용 |
|------|------|
| [[repos-public]] | 공개 — 분류·표·vault 링크 |
| [[repos-private]] | **PRIVATE 6** + org `21n_apps` |
| [[repos-public.generated]] | gh 자동 생성 (gitignore) |
| [[repos-private.generated]] | 전체 43개 raw |
| [[orgs.generated]] | 21n-korea 레포 |
| [[repo-map]] | 레포 → Obsidian |
| [[orgs]] | 조직 MOC |
| [[local-workspace]] | 로컬 clone |

## 빠른 링크 (활성)

| 레포 | 가시성 | Vault |
|------|--------|-------|
| [SnapMate](https://github.com/toris-dev/SnapMate) | private | [[SnapMate]] |
| [21n_apps](https://github.com/21n-korea/21n_apps) | org private | [[21n-econtract-platform]] |
| [Toris_Blog](https://github.com/toris-dev/Toris_Blog) | public | [[Toris_Blog]] |
| [love-trip](https://github.com/toris-dev/love-trip) | public | [[love-trip]] |
| [bubble-bible](https://github.com/toris-dev/bubble-bible) | private | [[bubbleBible-FE-프로젝트-리뷰]] |

## 동기화

```bash
gh auth login
/Users/toris/projects/docs/07-github/sync-github.sh
```

출력: `*.generated.md` (`.gitignore` 처리됨)

## 관련

- [[Me]] · [[Projects]] · [[Portfolio]]
