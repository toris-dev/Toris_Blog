"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // 설치 실패가 현장 기록 화면 자체를 막아서는 안 된다.
    });
  }, []);

  return null;
}
