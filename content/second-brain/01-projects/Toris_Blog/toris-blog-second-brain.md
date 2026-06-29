---
tags:
  - toris-blog
  - second-brain
---

# Toris_Blog — 제2의 뇌 연동

## 현재 방식

**로컬 RAG 없음.** `docs/second-brain/knowledge/` 마크다운 + **클라우드 AI**.

| 도구 | 용도 |
|------|------|
| Cursor Agents | vault 열고 경험/경력 질문 |
| Claude / Codex | `prompts/ask-toris.md` + knowledge 첨부 |
| (추후) Toris_Blog API | Claude/OpenAI API + knowledge system prompt |

## 패키지 위치

개발·기록: `docs/second-brain/`  
Toris_Blog 이식: `second-brain/` 폴더 통째 복사

```
second-brain/
├── knowledge/       # toris-dev 경험·경력
├── prompts/         # Claude/Cursor용 프롬프트
└── README.md
```

## Cursor에서 쓰기

```
@second-brain/knowledge toris-dev는 누구야?
```

또는 `.cursor/rules/second-brain.mdc` 규칙이 자동으로 knowledge를 참조.

## Toris_Blog 챗봇 (추후)

1. `second-brain/knowledge/` 를 블로그 repo에 포함
2. `/api/brain` 에서 Anthropic/OpenAI API 호출
3. system prompt에 `profile/toris-dev.md` 등 핵심 파일 내용 주입 (또는 파일 검색 MCP)

과거 OpenAI RAG는 API 비용으로 철회. **프롬프트 + knowledge 파일 주입** 방식이 단순하고 비용 예측 가능.

## knowledge 확장

블로그 포스트(`public/markdown/`)는 기술 글, `knowledge/`는 **1인칭 경험·경력** — 역할 분리 권장.

새 경험 기록 → `knowledge/career/`, `knowledge/projects/` 등에 `.md` 추가.

## 관련

- [[Second Brain]] — 제2의 뇌 허브
- [[Toris_Blog]]
