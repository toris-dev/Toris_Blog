import { auth } from "@/lib/firebase";

export const API =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.builder.toris.kr";

/** 로그인 사용자의 ID 토큰을 붙여 API를 호출한다 */
export async function authFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("login required");
  const token = await user.getIdToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data.error ?? `요청 실패 (${res.status})`) as Error & {
      status?: number;
      upgrade?: boolean;
    };
    err.status = res.status;
    err.upgrade = (data as { upgrade?: boolean }).upgrade;
    throw err;
  }
  return data;
}

/* ================================================================
   읽기 캐시 — stale-while-revalidate
   같은 사용자·같은 경로의 GET을 메모리 + sessionStorage에 담아
   탭 전환·화면 재마운트·라우트 왕복 시 네트워크 없이 즉시 그린다.
   쓰기 후에는 invalidate로 갱신한다. 사용자별로 키를 분리해
   계정 전환 시 이전 사용자의 데이터가 새지 않게 한다.
   ================================================================ */

interface CacheEntry {
  at: number;
  data: unknown;
}

const memory = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 60_000;
const STORE_PREFIX = "bs:cache:";

function keyFor(uid: string, path: string): string {
  return `${STORE_PREFIX}${uid}:${path}`;
}

function readStore(key: string): CacheEntry | undefined {
  if (typeof sessionStorage === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return undefined;
  }
}

function writeStore(key: string, entry: CacheEntry): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    /* 용량 초과 등은 조용히 무시 — 메모리 캐시만으로도 동작한다 */
  }
}

/** 캐시된 값을 동기적으로 꺼낸다(있으면). 초기 렌더를 즉시 채우는 용도. */
export function peek<T>(path: string): T | undefined {
  const uid = auth.currentUser?.uid;
  if (!uid) return undefined;
  const key = keyFor(uid, path);
  let entry = memory.get(key);
  if (!entry) {
    const stored = readStore(key);
    if (stored) {
      memory.set(key, stored);
      entry = stored;
    }
  }
  return entry?.data as T | undefined;
}

/**
 * 캐시 우선 GET. TTL 이내면 캐시를 반환하고, 아니면 네트워크로 새로 받아
 * 캐시를 갱신한다. force=true면 항상 새로 받는다. 동시 요청은 합친다.
 */
export async function cachedFetch<T>(
  path: string,
  opts: { ttl?: number; force?: boolean } = {},
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("login required");
  const { ttl = DEFAULT_TTL, force = false } = opts;
  const key = keyFor(user.uid, path);

  if (!force) {
    let entry = memory.get(key);
    if (!entry) {
      const stored = readStore(key);
      if (stored) {
        memory.set(key, stored);
        entry = stored;
      }
    }
    if (entry && Date.now() - entry.at < ttl) return entry.data as T;

    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;
  }

  const request = authFetch<T>(path)
    .then((data) => {
      const entry: CacheEntry = { at: Date.now(), data };
      memory.set(key, entry);
      writeStore(key, entry);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, request);
  return request;
}

/** 특정 경로의 캐시를 비운다(다음 읽기 때 새로 받도록). */
export function invalidate(path: string): void {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const key = keyFor(uid, path);
  memory.delete(key);
  inflight.delete(key);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* 무시 */
    }
  }
}

/** 로그아웃·계정 전환 시 모든 캐시를 비운다. */
export function invalidateAll(): void {
  memory.clear();
  inflight.clear();
  if (typeof sessionStorage === "undefined") return;
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(STORE_PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {
    /* 무시 */
  }
}
