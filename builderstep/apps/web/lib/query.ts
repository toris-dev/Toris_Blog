"use client";

import { useSyncExternalStore } from "react";

/* ================================================================
   URL 쿼리스트링 상태 — History API 기반
   next/navigation의 useSearchParams는 정적 export에서 Suspense 경계를
   요구하고 프리렌더를 bail-out시킨다. 여기서는 클라이언트 전용
   History API로 직접 다뤄 그 제약을 피하고, 뒤로/앞으로 가기까지 지원한다.
   ================================================================ */

const QS_EVENT = "bs:qs";

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(QS_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(QS_EVENT, cb);
  };
}

function getSnapshot() {
  return window.location.search;
}

// 프리렌더/하이드레이션 시점에는 쿼리를 알 수 없으므로 빈 문자열로 시작한다.
function getServerSnapshot() {
  return "";
}

/** 현재 URL의 쿼리 파라미터를 구독한다. 값이 바뀌면 리렌더된다. */
export function useQueryParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return new URLSearchParams(search);
}

/**
 * 쿼리 파라미터를 갱신한다. 값이 null/빈문자열이면 해당 키를 제거한다.
 * 여러 키를 한 번에 바꿔 히스토리 항목이 하나만 쌓이게 한다.
 */
export function setQuery(
  updates: Record<string, string | null | undefined>,
  opts: { replace?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const [key, value] of Object.entries(updates)) {
    const current = url.searchParams.get(key);
    if (value == null || value === "") {
      if (current !== null) {
        url.searchParams.delete(key);
        changed = true;
      }
    } else if (current !== value) {
      url.searchParams.set(key, value);
      changed = true;
    }
  }
  if (!changed) return;
  window.history[opts.replace ? "replaceState" : "pushState"]({}, "", url);
  window.dispatchEvent(new Event(QS_EVENT));
}
