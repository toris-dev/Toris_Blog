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
