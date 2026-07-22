"use client";

import { useEffect } from "react";

/** [data-tilt] 표면을 시선(포인터)에 따라 ±6° 기울이고 글레어 좌표를 넘긴다. */
export default function FxInit() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    const enter = (el: HTMLElement) => (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--tx", String((px - 0.5) * 2));
      el.style.setProperty("--ty", String((py - 0.5) * 2));
      el.style.setProperty("--gx", String(px * 100));
      el.style.setProperty("--gy", String(py * 100));
    };
    const leave = (el: HTMLElement) => () => {
      el.style.setProperty("--tx", "0");
      el.style.setProperty("--ty", "0");
    };

    const handlers = els.map((el) => {
      const move = enter(el);
      const out = leave(el);
      el.addEventListener("pointermove", move, { passive: true });
      el.addEventListener("pointerleave", out);
      return { el, move, out };
    });
    return () =>
      handlers.forEach(({ el, move, out }) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", out);
      });
  }, []);
  return null;
}
