"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 스크롤 진입 시 .reveal 요소를 노출한다.
 *
 * 루트 레이아웃에 상주하며, 다음 경우를 모두 처리한다.
 *  - 최초 로드(SSR 마크업)
 *  - 클라이언트 사이드 이동(예: /app → /)
 *  - transition / Suspense 로 인해 경로 변경 "이후"에 뒤늦게 DOM 에 커밋되는
 *    .reveal 요소 — 이 경우 pathname 이 이미 바뀐 뒤라 효과가 재실행되지 않으므로
 *    MutationObserver 로 새 노드를 감지해 반드시 노출한다. (홈이 통째로 비어
 *    보이던 버그의 원인)
 */
export default function RevealInit() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) =>
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("on");
                  io?.unobserve(entry.target);
                }
              }),
            { threshold: 0.12 },
          )
        : null;

    /** 아직 노출되지 않은 .reveal 요소를 훑어 즉시 노출하거나 관찰 대상에 등록한다. */
    const process = () => {
      const nodes = document.querySelectorAll<HTMLElement>(".reveal:not(.on)");
      if (nodes.length === 0) return;
      nodes.forEach((el) => {
        // 모션 축소 설정이거나 IntersectionObserver 미지원 → 즉시 노출
        if (reduceMotion || !io) {
          el.classList.add("on");
          return;
        }
        // 이미 화면 안(또는 위)에 있으면 즉시 노출 — 이동 직후 상단 콘텐츠 보장
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
          el.classList.add("on");
        } else {
          io.observe(el);
        }
      });
    };

    // 최초/경로변경 시: 레이아웃이 확정된 다음 프레임에 처리
    let raf = requestAnimationFrame(process);

    // 뒤늦게(비동기 커밋) 추가되는 .reveal 노드까지 포착 — rAF 로 배치 처리
    let pending = false;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        process();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      io?.disconnect();
    };
  }, [pathname]);

  return null;
}
