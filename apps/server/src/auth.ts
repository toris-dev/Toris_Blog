/**
 * Firebase ID 토큰(RS256) 검증 — 외부 의존성 없이 WebCrypto로.
 * 공개키는 securetoken JWKS에서 가져와 모듈 스코프에 캐시한다(워커 인스턴스 수명).
 */
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export const FIREBASE_PROJECT_ID = "builderstep-toris";

interface Jwk {
  kid: string;
  n: string;
  e: string;
  kty: string;
  alg: string;
}

let jwksCache: { keys: Jwk[]; expires: number } | null = null;

async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && Date.now() < jwksCache.expires) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("jwks fetch failed");
  const { keys } = (await res.json()) as { keys: Jwk[] };
  // Cache-Control max-age을 존중하되 기본 1시간
  const cc = res.headers.get("cache-control") ?? "";
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600);
  jwksCache = { keys, expires: Date.now() + Math.min(maxAge, 21600) * 1000 };
  return keys;
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

export interface FirebaseTokenPayload {
  email: string;
  emailVerified: boolean;
  uid: string;
  name?: string;
}

/** 검증 실패 시 null — 호출부는 401로 응답한다 */
export async function verifyFirebaseToken(
  idToken: string,
  projectId: string = FIREBASE_PROJECT_ID,
): Promise<FirebaseTokenPayload | null> {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts as [string, string, string];

  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid) return null;

  // 클레임 검증
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  if (typeof payload.iat !== "number" || payload.iat > now + 300) return null;
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (typeof payload.sub !== "string" || !payload.sub) return null;
  if (typeof payload.email !== "string" || !payload.email) return null;

  // 서명 검증
  const jwk = (await getJwks()).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(s),
    new TextEncoder().encode(`${h}.${p}`),
  );
  if (!valid) return null;

  return {
    email: (payload.email as string).toLowerCase(),
    emailVerified: payload.email_verified === true,
    uid: payload.sub as string,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}
