---
tags:
  - deployment
---

# CI/CD Notes

## 파이프라인 (프로젝트별 기록)

| 프로젝트 | CI | CD | 트리거 |
|----------|----|----|--------|
| | GitHub Actions | | push main |

## 일반 단계

1. install
2. lint / typecheck
3. test
4. build
5. deploy (staging → manual approve → prod)

## 스니펫 보관

```yaml
# workflow 이름 — 링크 또는 요약
```

## 관련

- [[deploy-checklist]] · [[Development]]
