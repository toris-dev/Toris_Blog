"use client";

import { useEffect, useRef, useState } from "react";

const CONTACT_EMAIL = "korea@toris.kr";

type CopyState = "idle" | "copied" | "failed";

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy_failed");
}

export function ContactEmailFallback({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function handleCopy() {
    try {
      await copyText(CONTACT_EMAIL);
      setState("copied");
    } catch {
      setState("failed");
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 3000);
  }

  const status =
    state === "copied"
      ? "이메일 주소를 복사했습니다."
      : state === "failed"
        ? `복사하지 못했습니다. ${CONTACT_EMAIL}로 문의해 주세요.`
        : "";

  return (
    <div className={`landing-contact-fallback ${compact ? "is-compact" : ""}`}>
      <span>메일 앱이 열리지 않나요?</span>
      <button type="button" onClick={handleCopy}>
        {state === "copied" ? "복사 완료" : "이메일 주소 복사"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
