"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function FieldHeader() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof api.notifications.list>>["notifications"]
  >([]);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const loadNotifications = useCallback(() => {
    api.notifications
      .list(true)
      .then((result) => {
        setNotifications(result.notifications);
        setNotificationError(null);
      })
      .catch(() => setNotificationError("알림을 불러오지 못했습니다"));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markAllRead() {
    const ids = notifications.map((item) => item.id);
    if (ids.length === 0) return;
    try {
      await api.notifications.markRead(ids);
      setNotifications([]);
      setNotificationError(null);
    } catch {
      setNotificationError("알림을 읽음 처리하지 못했습니다");
    }
  }

  async function openWorkNotification(id: string, workOrderId: string) {
    try {
      await api.notifications.markRead([id]);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== id),
      );
      setNotificationError(null);
    } catch {
      setNotificationError("알림을 읽음 처리하지 못했습니다");
    } finally {
      setOpen(false);
      router.push(`/field/record?id=${workOrderId}`);
    }
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-shell-line bg-shell px-4 py-3 text-shell-ink">
      <span className="font-bold">현장완료</span>
      <div className="flex items-center gap-3 text-sm">
        <div className="relative">
          <button
            type="button"
            aria-label={`미확인 알림 ${notifications.length}개`}
            aria-expanded={open}
            onClick={() => {
              setOpen((value) => !value);
              if (!open) loadNotifications();
            }}
            className="btn-ghost-shell tap-target relative rounded-lg px-3 py-1.5"
          >
            알림
            {notifications.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-white p-3 text-ink shadow-xl">
              <div className="flex items-center justify-between">
                <p className="font-semibold">배정 알림</p>
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={notifications.length === 0}
                  className="text-xs text-primary disabled:text-muted"
                >
                  모두 읽음
                </button>
              </div>
              {notificationError && (
                <p className="mt-2 text-xs text-red-600">{notificationError}</p>
              )}
              <div className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted">새 알림이 없습니다.</p>
                )}
                {notifications.map((item) =>
                  item.workOrderId ? (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() =>
                        openWorkNotification(item.id, item.workOrderId!)
                      }
                      className="block w-full rounded-lg bg-bg-2 p-3 text-left hover:bg-line/50"
                    >
                      <p className="text-sm">{item.message}</p>
                      <p className="mt-1 text-[11px] text-muted">{item.createdAt}</p>
                    </button>
                  ) : (
                    <div key={item.id} className="rounded-lg bg-bg-2 p-3">
                      <p className="text-sm">{item.message}</p>
                      <p className="mt-1 text-[11px] text-muted">{item.createdAt}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
        <span className="text-shell-dim">{user?.name}</span>
        <button onClick={logout} className="btn-ghost-shell tap-target rounded-lg px-3 py-1.5">
          로그아웃
        </button>
      </div>
    </header>
  );
}

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-dvh bg-bg-2">
        <FieldHeader />
        <div className="mx-auto max-w-lg px-4 py-4">{children}</div>
      </div>
    </RequireAuth>
  );
}
