# toris-dev 제2의 뇌 (Second Brain)

이 Obsidian vault는 **toris-dev(Toris)** 의 경험·경력·프로젝트·결정 기록을 모아 두는 **제2의 뇌**입니다.

로컬 LLM/RAG는 사용하지 않습니다. **Cursor Agents · Claude · Codex** 등 클라우드 AI가 이 마크다운을 읽고 답합니다.

## 빠른 사용 (Cursor)

1. 이 `docs/` 폴더를 Cursor에서 연다.
2. 채팅에서 바로 질문한다.

```
toris-dev는 누구야?
배구 그만두고 개발자 된 경위 알려줘
21앤에서 뭐 하고 있어?
```

3. 필요하면 `@second-brain/knowledge` 를 멘션해 컨텍스트를 명시한다.

`.cursor/rules/second-brain.mdc` 규칙이 켜져 있으면, 경력·경험 질문 시 agent가 `second-brain/knowledge/` 를 우선 참조합니다.

## Claude / ChatGPT / Codex

`prompts/ask-toris.md` 프롬프트를 복사하고, 아래 파일을 첨부(또는 @ 멘션):

```
second-brain/knowledge/profile/toris-dev.md
second-brain/knowledge/career/timeline.md
second-brain/knowledge/projects/pretty-contract.md
```

## 지식 추가하기

| 경로 | 용도 |
|------|------|
| `knowledge/profile/` | 자기소개, 가치관, FAQ |
| `knowledge/career/` | 경력 타임라인, 회사별 후기 |
| `knowledge/projects/` | 프로젝트별 메모 |
| `knowledge/decisions/` | 중요한 결정과 이유 (신규) |
| `knowledge/learnings/` | 배운 것, 회고 (신규) |

새 `.md` 파일을 추가한 뒤 저장하면 끝입니다. 별도 ingest/인덱싱 없음.

## 보조 컨텍스트 (vault 전체)

| 경로 | 내용 |
|------|------|
| `01-projects/` | SnapMate, Toris_Blog, 21n 등 프로젝트 문서 |
| `06-knowledge/` | 기술 학습 노트 |
| `01-projects/portfolio/` | 프로젝트 회고 |

## Toris_Blog 연동 (추후)

`Toris_Blog/` 에 이식할 때:

1. `second-brain/knowledge/` 폴더를 블로그 repo로 복사
2. 블로그 챗봇 API에서 Claude/OpenAI API + `knowledge/` 를 system prompt 컨텍스트로 주입
3. 또는 Cursor Agent / MCP로 vault를 직접 참조

로컬 Ollama·ChromaDB·Python 패키지는 **제거됨** — 클라우드 AI만 사용.

## toris-dev 한 줄

배구 선수 출신 → 학점은행제·군 복무 → 셈웨어(SI) → 21앤 풀스택. GitHub **toris-dev**. 현재 **예쁜계약** 개발 중.

자세한 내용: [[knowledge/profile/toris-dev]]
