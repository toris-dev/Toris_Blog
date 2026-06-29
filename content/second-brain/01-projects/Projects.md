---
tags:
  - moc
  - project
---

# Projects

프로젝트 하나 = **폴더(선택) + 허브 노트** 하나. 템플릿: [[project]].

## GitHub 연동

- 전체 목록: [[repos-public]] · [[repos-private]] · [[repo-map]]
- 동기화: `docs/07-github/sync-github.sh` (`gh auth login` 후)

## 활성

> **선택**: Community plugin [Dataview](https://github.com/blacksmithgu/obsidian-dataview) 설치 시 아래 쿼리로 자동 목록화.
>
> `TABLE status, phase FROM "docs/01-projects" WHERE status = "active"`

**수동 목록** (기본):

| 프로젝트 | 상태 | 단계 | 허브 |
|----------|------|------|------|
| SnapMate | active | development | [[SnapMate]] · [[SnapMate-docs]] |
| Toris Blog 등 | — | — | [[Portfolio]] |

## 보류 / 아이디어

| 프로젝트 | 메모 |
|----------|------|
| | |

## 완료·보관

- `docs/01-projects/archive/` 로 노트 이동 또는 `status: done` 변경

## 새 프로젝트 시작

1. `docs/templates/project` 복제 → `docs/01-projects/{이름}.md`
2. [[Planning]] 체크리스트로 1차 스코프 확정
3. Daily에 "시작: {이름}" 한 줄

## 관련

- [[Planning]] · [[Design]] · [[Development]] · [[Deployment]]
