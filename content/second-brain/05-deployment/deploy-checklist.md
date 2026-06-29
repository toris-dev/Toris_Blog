---
tags:
  - deployment
  - checklist
---

# Deploy Checklist

> 릴리스마다 복제하거나 프로젝트 허브에 체크. 템플릿: `docs/templates/deploy-checklist`

## 출시 전

- [ ] 버전·changelog 갱신
- [ ] [[environments-and-secrets]] 프로덕션 값 확인 (커밋 X)
- [ ] 마이그레이션·롤백 계획
- [ ] [[testing-strategy]] CI green
- [ ] 스토어/도메인·인증서·프라이버시 URL

## 배포

- [ ] 스테이징 스모크 테스트
- [ ] 프로덕션 배포 (명령·대시보드 기록)
- [ ] Feature flag / 점진 배포 (해당 시)

## 출시 후 (24h)

- [ ] 에러율·크래시 ([[monitoring-and-ops]])
- [ ] 핵심 지표 ([[metrics-and-validation]])
- [ ] 사용자 공지·스토어 메타

## 롤백

- [ ] 롤백 명령·담당: 본인
- [ ] 트리거 조건: 

## 관련

- [[Deployment]] · [[release-retrospective]]
