---
tags:
  - development
---

# Testing Strategy

## 피라미드 (솔로 현실版)

| 층 | 비중 | 도구 예 |
|----|------|---------|
| Unit | 핵심 로직만 | vitest, jest, cargo test / nextest |
| Integration | API·DB | supertest, testcontainers |
| E2E | 크리티컬 1~2 플로우 | Playwright, Detox |

## 언제 테스트를 쓸까

- 결제·인증·데이터 손실 경로 → 필수
- UI 스타일만 → 스냅샷 최소화
- Rust → `cargo nextest`, clippy

## CI (로컬 먼저)

```bash
# 예: TS
pnpm lint && pnpm test
# 예: Rust
cargo clippy && cargo nextest run
```

## 관련

- [[deploy-checklist]] · [[mac-setting]]
