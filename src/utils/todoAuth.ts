import { verifyMessage } from 'ethers';
import type { NextRequest } from 'next/server';

/**
 * Todo 변경(POST/PUT/DELETE) 서버 측 인가.
 *
 * 이전 구현은 클라이언트가 보낸 `walletAddress` 문자열이 공개 허용목록
 * (NEXT_PUBLIC_AUTHORIZED_ADDRESSES, 브라우저 번들에 인라인됨)에 있는지만
 * 확인했다. 주소는 비밀이 아니므로 개인키 없이도 누구나 우회 가능했다.
 *
 * 이 유틸은 지갑 서명을 요구한다. 클라이언트가 타임스탬프가 포함된 메시지를
 * 지갑으로 서명하고, 서버는 서명에서 주소를 복원(recover)해 허용목록과
 * 대조한다. 개인키를 가진 소유자만 유효한 서명을 만들 수 있으므로
 * 주소를 안다고 접근 권한이 생기지 않는다.
 */

const AUTH_MESSAGE_PREFIX = 'Toris_Blog todo mutation';
// 서명 유효 시간(재사용 공격 완화). 이 창 안에서의 재전송만 가능.
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export interface TodoAuthResult {
  ok: boolean;
  address?: string;
  reason?: string;
}

/** 허용된 지갑 주소 목록 (서버 전용 변수를 우선, 없으면 기존 공개 변수로 폴백) */
function getAuthorizedAddresses(): string[] {
  const raw =
    process.env.AUTHORIZED_ADDRESSES ??
    process.env.NEXT_PUBLIC_AUTHORIZED_ADDRESSES ??
    '';

  return raw
    .split(',')
    .map((addr) => addr.trim().toLowerCase())
    .filter((addr) => addr.length > 0);
}

/**
 * 클라이언트가 서명해야 하는 메시지를 생성한다.
 * 타임스탬프를 포함해 서버가 신선도를 검증할 수 있게 한다.
 */
export function buildTodoAuthMessage(timestamp: number): string {
  return `${AUTH_MESSAGE_PREFIX}\nissued: ${timestamp}`;
}

/**
 * 요청 헤더에서 지갑 서명을 검증한다.
 * - x-wallet-address:   연결된 지갑 주소(클레임)
 * - x-wallet-signature: buildTodoAuthMessage(timestamp) 서명값
 * - x-wallet-timestamp: 서명 메시지에 사용한 타임스탬프(ms)
 */
export function verifyTodoAuth(request: NextRequest): TodoAuthResult {
  const claimedAddress = request.headers.get('x-wallet-address');
  const signature = request.headers.get('x-wallet-signature');
  const timestampHeader = request.headers.get('x-wallet-timestamp');

  if (!claimedAddress || !signature || !timestampHeader) {
    return { ok: false, reason: '서명 정보가 필요합니다.' };
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: '유효하지 않은 타임스탬프입니다.' };
  }

  // 신선도 검증: 과거 5분 이내 & 미래 아님(약간의 시계 오차 허용)
  const now = Date.now();
  if (now - timestamp > SIGNATURE_MAX_AGE_MS || timestamp - now > 60 * 1000) {
    return { ok: false, reason: '서명이 만료되었습니다. 다시 시도해주세요.' };
  }

  const allowlist = getAuthorizedAddresses();
  if (allowlist.length === 0) {
    return { ok: false, reason: '인가된 주소가 설정되지 않았습니다.' };
  }

  let recovered: string;
  try {
    recovered = verifyMessage(buildTodoAuthMessage(timestamp), signature);
  } catch {
    return { ok: false, reason: '서명 검증에 실패했습니다.' };
  }

  const recoveredLower = recovered.toLowerCase();

  // 복원된 주소가 클레임과 일치하고, 허용목록에 있어야 통과
  if (recoveredLower !== claimedAddress.toLowerCase()) {
    return { ok: false, reason: '서명자 주소가 일치하지 않습니다.' };
  }

  if (!allowlist.includes(recoveredLower)) {
    return { ok: false, reason: '인가되지 않은 주소입니다.' };
  }

  return { ok: true, address: recoveredLower };
}
