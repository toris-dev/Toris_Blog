---
tags:
  - deployment
  - ops
---

# Monitoring & Ops

## 관측 (스택 예)

| 영역 | 도구 |
|------|------|
| 에러·크래시 | Sentry, Firebase Crashlytics |
| 로그 | Cloud Logging, Loki |
| 메트릭 | Grafana, Firebase Analytics |
| 업타임 | Better Stack, UptimeRobot |

## 알림

- P0: 서비스 다운 → 즉시 (푸시/슬랙)
- P1: 에러율 급증 → 1시간 내

## 장애 대응 (1인)

1. 증상·범위 파악
2. 최근 배포·설정 변경 확인 ([[deploy-checklist]])
3. 롤백 vs 핫픽스 결정
4. Daily + [[release-retrospective]]에 postmortem

## 관련

- [[metrics-and-validation]] · [[Deployment]]
