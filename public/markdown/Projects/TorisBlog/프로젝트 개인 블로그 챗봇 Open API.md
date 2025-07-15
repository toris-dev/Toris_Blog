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
