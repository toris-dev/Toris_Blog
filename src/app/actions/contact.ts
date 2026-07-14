'use server';

import {
  formatContactInquiry,
  validateContactInquiry,
  type ContactFormData
} from '@/utils/contact-inquiry';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export type { ContactFormData } from '@/utils/contact-inquiry';

export interface ContactActionResult {
  success: boolean;
  message: string;
  error?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_MAX_CLIENTS = 500;
const inquiryRateLimits = new Map<string, RateLimitEntry>();

function consumeRateLimit(clientId: string, now = Date.now()): boolean {
  for (const [key, entry] of inquiryRateLimits) {
    if (entry.resetAt <= now) inquiryRateLimits.delete(key);
  }

  if (
    inquiryRateLimits.size >= RATE_LIMIT_MAX_CLIENTS &&
    !inquiryRateLimits.has(clientId)
  ) {
    const oldestKey = inquiryRateLimits.keys().next().value as
      | string
      | undefined;
    if (oldestKey) inquiryRateLimits.delete(oldestKey);
  }

  const current = inquiryRateLimits.get(clientId);
  if (!current || current.resetAt <= now) {
    inquiryRateLimits.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

async function getClientId(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip');
  return ip || 'unknown-client';
}

function getGithubInquiryConfig() {
  const token = process.env.GITHUB_INQUIRY_TOKEN?.trim();
  const owner = process.env.GITHUB_INQUIRY_OWNER?.trim();
  const repository = process.env.GITHUB_INQUIRY_REPOSITORY?.trim();
  const issueNumber = Number(process.env.GITHUB_INQUIRY_ISSUE_NUMBER);

  if (
    !token ||
    !owner ||
    !repository ||
    !Number.isSafeInteger(issueNumber) ||
    issueNumber <= 0
  ) {
    return null;
  }

  return { token, owner, repository, issueNumber };
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'TORIS-Private-Inquiry',
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

export async function submitContactForm(
  formData: ContactFormData
): Promise<ContactActionResult> {
  const validation = validateContactInquiry(formData);
  if (!validation.success || !validation.inquiry) {
    return {
      success: false,
      message: validation.message ?? '상담 정보를 확인해 주세요.',
      error: 'Validation error'
    };
  }

  if (!consumeRateLimit(await getClientId())) {
    return {
      success: false,
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
      error: 'Rate limited'
    };
  }

  const config = getGithubInquiryConfig();
  if (!config) {
    console.error('Private inquiry destination is not fully configured');
    return {
      success: false,
      message:
        '현재 상담 양식을 이용할 수 없습니다. 공식 이메일로 문의해 주세요.',
      error: 'Server configuration error'
    };
  }

  const owner = encodeURIComponent(config.owner);
  const repository = encodeURIComponent(config.repository);
  const repositoryUrl = `https://api.github.com/repos/${owner}/${repository}`;
  const requestHeaders = githubHeaders(config.token);

  try {
    const repositoryResponse = await fetch(repositoryUrl, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store'
    });

    if (!repositoryResponse.ok) {
      console.error(
        'Unable to verify private inquiry repository:',
        repositoryResponse.status
      );
      return {
        success: false,
        message: '상담 요청을 안전하게 전달할 수 없습니다.',
        error: 'Repository verification failed'
      };
    }

    const repositoryMetadata = (await repositoryResponse.json()) as {
      private?: unknown;
    };
    if (repositoryMetadata.private !== true) {
      console.error('Refusing to send inquiry to a non-private repository');
      return {
        success: false,
        message: '상담 요청을 안전하게 전달할 수 없습니다.',
        error: 'Destination is not private'
      };
    }

    const commentResponse = await fetch(
      `${repositoryUrl}/issues/${config.issueNumber}/comments`,
      {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          body: formatContactInquiry(validation.inquiry)
        }),
        cache: 'no-store'
      }
    );

    if (!commentResponse.ok) {
      console.error('Private inquiry delivery failed:', commentResponse.status);
      return {
        success: false,
        message: '상담 요청 전송에 실패했습니다.',
        error: 'Failed to send inquiry'
      };
    }

    revalidatePath('/contact');
    return {
      success: true,
      message: '상담 요청을 받았습니다. 영업일 기준 1–2일 내 회신드리겠습니다.'
    };
  } catch (error) {
    console.error(
      'Private inquiry delivery encountered an error:',
      error instanceof Error ? error.name : 'Unknown error'
    );
    return {
      success: false,
      message: '예상치 못한 오류가 발생했습니다.',
      error: 'Unexpected delivery error'
    };
  }
}
