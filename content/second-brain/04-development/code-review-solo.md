---
tags:
  - development
  - checklist
---

# Code Review (Solo)

머지 전 10분 셀프 리뷰.

## 정확성

- [ ] 요구사항·수용 기준 충족 ([[prd-checklist]])
- [ ] 엣지 케이스·null·권한

## 품질

- [ ] 네이밍·중복 제거
- [ ] 에러 처리·로깅 (민감 정보 없음)
- [ ] 타입 / lint 통과

## 보안

- [ ] 시크릿·API 키 커밋 없음
- [ ] 입력 검증·SQL/NoSQL injection

## UX

- [ ] [[ux-flow-checklist]] loading/empty/error

## 테스트

- [ ] [[testing-strategy]]에 맞는 최소 테스트 추가

## AI 생성 코드

- [ ] 이해하지 못한 코드는 설명 요청 후 수정
- [ ] 불필요한 abstraction 제거
