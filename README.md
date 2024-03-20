# Toris 블로그 만들기

## Mermaid 블로그 플로우 차트

```mermaid
flowchart LR
  Home[메인화면]
  SideBar(사이드바)
  Header(헤더)
  Footer(푸터)
  List(글 목록)

  Home --- Header
  Home --- Footer
  Home --- SideBar
  Home --- List

  Create[글 작성 화면]
  Admin[어드민 화면]
  Chatbot[챗봇 화면]
  ChatbotResult(챗봇 답변)
  Detail[글 상세 화면]

  Authorize{인증 여부}

  TagList[태그 목록 화면]
  Tag[태그별 글 화면]
  Category(카테고리별 글 목록)

  Header -.-> Chatbot --- ChatbotResult -.-> Detail
  SideBar -.-> TagList -.-> Tag -.-> Detail
  SideBar -.-> Category -.-> Detail
  Footer --> Authorize -.->|YES|Create -.-> Detail
  Authorize -.->|No|Admin
  Footer -.-> Admin -.-> Create

  List -.-> Detail
```

---

### Open AI 챗봇

## Mermaid AI 챗봇 차트

```mermaid
graph LR
  Input["입력 메시지 목록 - START"]
  Output["출력 메시지 목록 - END"]
  LLM((OpenAI API))
  PostDB((Post DB))
  IsFirst{메시지가 하나인가?}
  System(시스템 메시지 추가)
  Response(LLM 응답 메시지 추가)
  IsFunction{LLM 응답이 함수인가?}
  PostResult(참고할 글 메시지 추가)
  PostListMetadata((글 목록 메타 정보))

  Input --> IsFirst
  IsFirst --> |YES|System --> LLM
  IsFirst --> |NO|LLM

  PostListMetadata -.-> System
  LLM --> Response
  Response --> IsFunction

  IsFunction --> |YES| PostDB --> PostResult --> LLM
  IsFunction --> |NO| Output

```

---

**OpenAI API Context**

- 메시지 필드는 새로고침시 저장
- 메시지 목록 렌더링 채팅을 함에 따라 메시지 컴포넌트를 추가해서 렌더링 하는데 활용
  - 저장이 된다면, 유저 단위로 되어야 하지 않을까? O
  - 페이지가 새로고침 되었을 때 저장되어야 할까? O
  - 서버에서 DB로 관리해야 할까? X
  - 클라이언트에서 상태로 관리해야 할까? -> O

---

### 성능 최적화

**질문**

- 웹 애플리케이션을 잘 만들려면 무엇을 신경써야 할까?
  - LCP
  - CLS
  - FID
  - NextJS 에서 SSR SSG ISR 을 효율적으로 사용!!
- 테스트 코드를 잘 작성하려면 무엇을 신경써야 할까?
- NextJS에 최적화 된 인프라는 어떻게 구성되어야 할까?
- NextJS에 맞는 프로젝트 구조는 어떻게 생겼을까?

### 실행방법

- .env 파일 생성 후
  `NEXT_PUBLIC_SUPABASE_URL=`
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
  `NEXT_PUBLIC_OPENAI_API=`
  `NEXT_PUBLIC_ORGANIZATION_API=`

위의 4개의 .env 를 만들어서 키 값을 넣어주시면 됩니다.

```shell
yarn install

yarn dev
```
