---
tags:
  - reference
  - dev-environment
aliases:
  - mac-setting
  - mac_setting
---

# Mac 개발 환경 셋업 (TypeScript + Rust)

## 목표

* TypeScript 기반 백엔드/프론트엔드 개발
* Rust 학습 및 실무 개발
* AI Agent 기반 개발 환경 구축
* 로컬 LLM 및 컨테이너 개발 환경 구성
* 생산성 높은 CLI 워크플로우 확보

---

# Core Runtime

## Node.js

버전 관리:

* nvm

패키지 매니저:

* pnpm
* yarn

확인

```bash
node -v
npm -v
pnpm -v
yarn -v
```

---

## Rust

설치

```bash
rustup update
```

확인

```bash
rustc --version
cargo --version
```

### Components

```bash
rustup component add clippy
rustup component add rustfmt
```

설치 이유

* clippy → lint
* rustfmt → formatting

---

# Rust Cargo Tools

## cargo-watch

```bash
cargo install cargo-watch
```

파일 변경 시 자동 빌드

```bash
cargo watch -x run
```

---

## bacon

```bash
cargo install bacon
```

실시간 컴파일 상태 확인

```bash
bacon
```

---

## cargo-nextest

```bash
cargo install cargo-nextest
```

고속 테스트

```bash
cargo nextest run
```

---

## cargo-edit

```bash
cargo install cargo-edit
```

패키지 추가

```bash
cargo add serde
cargo add anyhow
```

---

## cargo-audit

```bash
cargo install cargo-audit
```

보안 취약점 검사

```bash
cargo audit
```

---

# AI Development

## Cursor

역할

* 메인 IDE
* Agent 기반 개발

---

## Claude

역할

* 설계
* 코드 리뷰
* 문서 작성

---

## Codex

역할

* CLI 기반 Agent
* 터미널 워크플로우

---

## Ollama

역할

* 로컬 LLM 실행

예시

```bash
ollama run qwen3
```

---

## Aider

설치

```bash
pip install aider-chat
```

실행

```bash
aider
```

특징

* Git 통합
* 터미널 Pair Programming
* 대규모 리팩토링 강력

---

# Container Environment

## OrbStack

역할

* Docker 대체
* Container 관리
* Linux VM 관리

확인

```bash
docker ps
```

---

## Dive

설치

```bash
brew install dive
```

Docker 이미지 분석

```bash
dive image-name
```

---

## K9s

설치

```bash
brew install k9s
```

Kubernetes TUI

```bash
k9s
```

---

# Terminal Environment

## WezTerm

역할

* GPU 가속 Terminal
* SSH 관리
* tmux 친화적

---

## tmux

설치

```bash
brew install tmux
```

세션 생성

```bash
tmux new -s workspace
```

목적

* Agent 병렬 실행
* 세션 유지

---

# CLI Productivity

## eza

설치

```bash
brew install eza
```

사용

```bash
eza -la
```

기존

```bash
ls -la
```

대체

---

## bat

설치

```bash
brew install bat
```

사용

```bash
bat package.json
```

기존

```bash
cat package.json
```

대체

---

## fd

설치

```bash
brew install fd
```

사용

```bash
fd auth
```

기존

```bash
find
```

대체

---

## ripgrep

설치

```bash
brew install ripgrep
```

사용

```bash
rg useEffect
```

기존

```bash
grep
```

대체

---

## fzf

설치

```bash
brew install fzf
```

예시

```bash
git branch | fzf
```

역할

* Interactive Search

---

## zoxide

설치

```bash
brew install zoxide
```

사용

```bash
z my-project
```

역할

* Smart Directory Jump

---

## jq

설치

```bash
brew install jq
```

예시

```bash
cat data.json | jq
```

역할

* JSON 처리

---

## btop

설치

```bash
brew install btop
```

실행

```bash
btop
```

역할

* 시스템 모니터링

---

# Git Workflow

## LazyGit

설치

```bash
brew install lazygit
```

실행

```bash
lazygit
```

주요 기능

* Commit
* Rebase
* Cherry Pick
* Merge
* Diff

---

## Delta

설치

```bash
brew install git-delta
```

설정

```bash
git config --global core.pager delta
```

역할

* Git Diff 가독성 향상

---

# Database

## PostgreSQL

설치

```bash
brew install postgresql@17
```

시작

```bash
brew services start postgresql@17
```

---

## Redis

설치

```bash
brew install redis
```

시작

```bash
brew services start redis
```

---

## TablePlus

역할

* PostgreSQL GUI
* Redis GUI
* MySQL GUI
* SQLite GUI

---

# Modern Runtime Management

## mise

역할

통합 버전 관리자

관리 가능

* Node.js
* Bun
* Python
* Rust
* Go

예시

```bash
mise use node@22
mise use bun@latest
```

---

## Bun

설치

```bash
curl -fsSL https://bun.sh/install | bash
```

사용

```bash
bun run dev
```

장점

* 빠른 TS 실행
* 빠른 패키지 설치

---

# 개인 표준 개발 스택

## Runtime

```text
Node.js
TypeScript
Rust
Bun
```

## Database

```text
PostgreSQL
Redis
```

## Container

```text
OrbStack
Docker
```

## IDE

```text
Cursor
Claude
Codex
```

## Local LLM

```text
Ollama
```

## Terminal

```text
WezTerm
tmux
```

## Productivity

```text
ripgrep
fzf
zoxide
eza
bat
fd
jq
btop
```

## Git

```text
Git
LazyGit
Delta
```

---

# 개발 환경 평가

현재 구성 기준:

```text
★★★★★
```

이미 대부분의 상위권 TypeScript + Rust 개발자들이 사용하는 환경에 매우 근접함.

이제는 "도구를 더 설치하는 단계"보다는

* tmux 워크플로우
* Cursor Rules
* Claude Code Workflow
* Rust 아키텍처
* TS Monorepo
* AI Agent 자동화

은 운영 방식 최적화가 더 큰 생산성 향상을 가져올 가능성이 높음.
