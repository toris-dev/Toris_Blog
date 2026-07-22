"use client";

import { useCallback, useEffect, useState } from "react";

type Kind = "success" | "error" | "info";
type ToastItem = { id: number; kind: Kind; msg: string };
type ToastDetail = { kind: Kind; msg: string; duration?: number };

const EVT = "dash:toast";
let seq = 0;

function emit(kind: Kind, msg: string, duration?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(EVT, { detail: { kind, msg, duration } }),
  );
}

/**
 * Module-level toast API — call from any client component:
 *   import { toast } from "@/components/Toast";
 *   toast.success("저장했어요");
 * Works via a window event bus, so no context wiring is needed at call sites.
 */
export const toast = {
  success: (msg: string, duration?: number) => emit("success", msg, duration),
  error: (msg: string, duration?: number) => emit("error", msg, duration),
  info: (msg: string, duration?: number) => emit("info", msg, duration),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback(
    (id: number) => setItems((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      if (!detail || !detail.msg) return;
      const id = ++seq;
      setItems((prev) => [...prev.slice(-3), { id, kind: detail.kind, msg: detail.msg }]);
      const ms = detail.duration ?? (detail.kind === "error" ? 5000 : 3200);
      window.setTimeout(() => remove(id), ms);
    }
    window.addEventListener(EVT, onToast as EventListener);
    return () => window.removeEventListener(EVT, onToast as EventListener);
  }, [remove]);

  return (
    <>
      {children}
      {items.length > 0 && (
        <div
          className="dash-toast-wrap"
          role="region"
          aria-live="polite"
          aria-label="알림"
        >
          {items.map((t) => (
            <div key={t.id} className="dash-toast" data-kind={t.kind} role="status">
              <span>{t.msg}</span>
              <button
                type="button"
                className="dash-toast-x"
                aria-label="알림 닫기"
                onClick={() => remove(t.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
