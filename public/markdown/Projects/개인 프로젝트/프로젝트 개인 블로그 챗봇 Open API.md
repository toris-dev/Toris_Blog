---
title: [Projects] 프로젝트 개인 블로그 챗봇 Open API
date: 2025-07-09T16:55:19.923Z
slug: 프로젝트-개인-블로그-챗봇-open-api
category: Projects
tags: Projects
---

### 생성형 AI 란?

- 생성형 인공 지능(생성형 AI)은 대화, 이야기, 이미지, 동영상, 음악 등 새로운 콘텐츠와 아이디어를 만들 수 있는 AI의 일종입니다.

### LLM 이란?

LLM(대규모 언어 모델)은 **텍스트의 이해와 분석을 중심으로 하는 고급 AI 기술**입니다

---

### Open API LLM 의 입력과 출력

1. 입력 자연어
2. Context를 토큰으로 쪼개기
3. _**다음에 올 토큰 고르기**_
4. 3번을 계속 반복
5. 적절한 시점에 끊기
6. 자연어 출력

### 다음에 올 토큰 고르기

1. 토큰 배열
2. 입베딩 벡터 배열
3. 엄청 복잡한 연산
4. Context 벡터
5. 다음 토큰의 확률 분포
6. 다음 토큰

---

### LLM을 학습한다는 건

- 입력 언어를 하나의 Context 벡터로 치환하는 방법을 학습.
  - 토큰 별로 적절한 임베딩 벡터를 매핑한다.
  - 엄청 복잡한 연산 과정에서 무수히 많은 가중치들을 업데이트
- Context 벡터를 가지고 입력 언어(context) 다음에 올 토큰의 확률 분포를 계산하는 방법을 계산한다.
  - Context Vecotr 를 토큰별 확률 분포 벡터로 변경시키는 행렬을 업데이트 한다.

### Chat-GPT

- Pre-Training
  - 자연어를 잘 이해하고, 토큰을 잘 예측하도록 학습
- Fine-Tuning & RLHF
  - LLM 이 사람의 말을 잘 따르도록 학습
- Prompting
  - 누구나 쉽게 사용할 수 있도록 기본 Context 작성

---

**Next.js page rotuer 에서 /api 호출을 이용하여 아래와 같이 작성!!**

```js
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API,
  organization: process.env.NEXT_PUBLIC_ORGANIZATION_API
});

type CompletionsResponse = {
  messages: ChatCompletionMessageParam[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompletionsResponse>
) {
  if (req.method !== 'POST') return res.status(405).end();

  const messages = req.body.messages as ChatCompletionMessageParam[];
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          '이 챗봇은 해당 블로그의 개발 질문에 성실하게 대답하는 전용 챗봇입니다.'
      },
      ...messages
    ],
    model: 'gpt-3.5-turbo'
  });

  messages.push(response.choices[0].message);
 
  res.status(200).json({ messages });
}
```

---

## RAG 도입 시도와 철회

### RAG 도입 배경

초기에는 블로그 콘텐츠를 더 정확하게 참조하기 위해 RAG(Retrieval-Augmented Generation)를 도입하려고 했습니다. 벡터 데이터베이스를 활용하여 블로그 포스트를 임베딩하고, 사용자 질문과 관련된 콘텐츠를 검색하여 컨텍스트로 제공하는 방식이었습니다.

### 도입 과정에서 발견한 문제점

**1. ChatGPT API 비용 문제**

- RAG를 구현하기 위해서는 임베딩 생성과 검색을 위한 추가 ChatGPT API 호출이 필요했습니다.
- 벡터 데이터베이스에 저장할 블로그 콘텐츠를 임베딩하는 과정에서 상당한 API 비용이 발생했습니다.
- 사용자 질문마다 관련 콘텐츠를 검색하고 컨텍스트로 제공하는 과정에서 API 호출이 증가하여 비용이 예상보다 높아졌습니다.
- 개인 프로젝트 수준에서는 이러한 추가 비용이 부담스러웠고, 비용 대비 효과가 크지 않았습니다.

**2. 오버엔지니어링**

- 개인 블로그 챗봇의 사용량과 복잡도를 고려했을 때, RAG는 과도한 솔루션이었습니다.
- 단순한 프롬프트 엔지니어링만으로도 충분히 만족스러운 결과를 얻을 수 있었습니다.
- 시스템 복잡도가 증가하면서 유지보수 부담이 커졌습니다.

### 철회 결정

주로 ChatGPT API 비용 문제와 오버엔지니어링을 고려하여 RAG 도입을 철회하고, 기본적인 프롬프트 엔지니어링 방식으로 단순화했습니다. 이 경험을 통해 **"기술의 복잡도와 비용, 특히 API 비용을 프로젝트의 실제 필요성과 균형 있게 고려해야 한다"**는 중요한 교훈을 얻을 수 있었습니다.

### 배운 점

- 기술을 도입할 때는 비용과 복잡도를 충분히 고려해야 합니다.
- 작은 프로젝트에서는 단순한 솔루션이 더 적합할 수 있습니다.
- 오버엔지니어링을 피하고, 실제 필요에 맞는 최소한의 솔루션을 선택하는 것이 중요합니다.
