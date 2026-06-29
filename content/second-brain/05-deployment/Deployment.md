---
tags:
  - moc
  - phase/deployment
---

# Deployment (배포)

**빌드 → 스테이징 → 프로덕션 → 모니터링 → 회고**를 같은 체크리스트로 반복한다.

## 문서 맵

- [[deploy-checklist]] — 출시 전·후 체크리스트
- [[environments-and-secrets]] — 환경·시크릿 관리
- [[ci-cd-notes]] — CI/CD·파이프라인
- [[monitoring-and-ops]] — 로그·알림·장애 대응
- [[release-retrospective]] — 릴리스 회고

## 환경 (일반)

| 환경 | 용도 |
|------|------|
| local | 개발 ([[mac-setting]]) |
| staging | QA·데모 |
| production | 사용자 |

## 릴리스 흐름

```mermaid
flowchart TD
  A[기능 완료] --> B[[[deploy-checklist]]]
  B --> C[스테이징 검증]
  C --> D[프로덕션 배포]
  D --> E[[[monitoring-and-ops]]]
  E --> F[[[release-retrospective]]]
```

## 관련

- [[Development]] · [[metrics-and-validation]] · [[Home]]
