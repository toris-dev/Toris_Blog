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
          '너는 toris-dev만을 위한 챗봇이야. 내가 물어보는 개발 질문에 성실하게 대답해줘.'
      },
      ...messages
    ],
    model: 'gpt-3.5-turbo'
  });
  messages.push(response.choices[0].message);

  res.status(200).json({ messages });
}
