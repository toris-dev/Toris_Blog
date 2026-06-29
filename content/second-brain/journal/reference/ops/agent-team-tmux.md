# Anthropic 에이전트 팀 (tmux)

## 시작

```bash
# macOS/Linux tmux 환경
chmod +x scripts/start-team.sh

# 기능명 없이 (메인 디렉토리)
./scripts/start-team.sh

# 기능명 지정 (worktree 자동 생성)
./scripts/start-team.sh contract-signing
```

tmux가 뜨면 3개 창 + monitor 창이 생성되고 각각 `claude --system-prompt .claude/{role}.md`로 실행됩니다.

## 핵심 설계

### 1. 파일 충돌 방지

| worktree | 소유 디렉토리 |
|----------|---------------|
| backend | `apps/api/`, `packages/database/`, `packages/trpc/` |
| frontend | `apps/admin/`, `apps/user-app/`, `packages/admin-ui/` |

### 2. 의존성 순서

```
packages/database → apps/api → packages/trpc → apps/admin → apps/user-app
```

### 3. 통신 프로토콜

| 메시지 | 의미 |
|--------|------|
| `[TASK:backend]` / `[TASK:frontend]` | 작업 지시 |
| `[DONE:backend]` / `[DONE:frontend]` | 완료 신호 |
| `[BLOCK:role]` | lead 즉시 개입 |
| `[CONFLICT]` | git 충돌 중재 |

### 4. Context Drift 방지

- 각 에이전트 `.md`에 소유 디렉토리 명시
- 30분마다 `git status` · `git log` 자가 체크
- migration은 lead 승인 없이 실행 불가

### 5. 21n 특화 규칙

- **PDF Queue**: frontend는 `getPdfStatus` 폴링만, Puppeteer는 backend 전담
- **OAuth**: `EXPO_PUBLIC_*`만 클라이언트 노출, 키는 `apps/api/.env.production`
- **전자서명**: 상태 전환 로직은 API에만, frontend는 mutation 호출만
- **Migration**: prisma-reviewer 에이전트 → lead 승인 2단계
