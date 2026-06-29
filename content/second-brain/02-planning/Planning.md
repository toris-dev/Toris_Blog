---
tags:
  - moc
  - phase/planning
---

# Planning (기획)

혼자 일할 때 기획 = **스코프를 줄이고 검증 가능한 문장으로 쓰는 것**.

## 문서 맵

- [[product-vision]] — 1페이지 비전·포지셔닝
- [[prd-checklist]] — PRD / 기능 명세 체크리스트
- [[user-story-template]] — 사용자 스토리·수용 기준
- [[mvp-scope]] — MVP 경계·하지 않을 것
- [[metrics-and-validation]] — 성공 지표·가설 검증

## 솔로 기획 루프 (추천)

```mermaid
flowchart LR
  A[아이디어] --> B[문제 1문장]
  B --> C[MVP 범위]
  C --> D[스토리 3~5개]
  D --> E[[[Design]] 스케치]
  E --> F[[[Development]]]
```

1. **문제**: "누가, 어떤 상황에서, 무엇이 불편한가?"
2. **해결**: 한 문장 가치 제안
3. **MVP**: 2주 안에 검증 가능한 최소 기능 ([[mvp-scope]])
4. **우선순위**: Must / Should / Won't (이번 스프린트)
5. **기록**: 결정은 프로젝트 허브에 `## 결정 로그` 섹션

## Notion에서 옮길 때

- 데이터베이스 행 → 프로젝트별 마크다운 한 파일 또는 `기능명.md`
- "상태" 컬럼 → frontmatter `status`
- 관계 → `[[wikilink]]`

## 관련

- [[Projects]] · [[Design]] · [[Home]]
