---
tags:
  - project
  - second-brain
aliases:
  - 제2의 뇌
  - Second Brain
---

# 제2의 뇌 (Second Brain)

toris-dev의 경험·경력·프로젝트 기록. **클라우드 AI**(Cursor · Claude · Codex)가 마크다운을 읽고 답하는 구조.

## 위치

`second-brain/knowledge/`

## 사용법

| 도구 | 방법 |
|------|------|
| **Cursor** | 이 vault 열고 채팅. `@second-brain/knowledge` 멘션 가능 |
| **Claude / Codex** | `prompts/ask-toris.md` + knowledge 파일 첨부 |

자세히: [[second-brain/README]] · [[prompts/ask-toris]]

## 지식 구조

| 폴더 | 내용 |
|------|------|
| `profile/` | [[knowledge/profile/toris-dev]] |
| `career/` | [[knowledge/career/timeline]] |
| `projects/` | [[knowledge/projects/pretty-contract]] |

## Toris_Blog 연동 (추후)

`second-brain/` 폴더를 `Toris_Blog/` 로 복사 후, 블로그 챗봇 API에서 Claude/OpenAI + knowledge 컨텍스트 주입.

로컬 Ollama·ChromaDB·Python RAG 패키지는 **제거됨**.

## 관련

- [[Toris_Blog]] — 개인 블로그 프로젝트
- [[toris-blog-second-brain]] — 블로그 연동 메모
