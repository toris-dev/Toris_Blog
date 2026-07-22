"use client";

import { useEffect, useRef } from "react";

/**
 * Ember Orbit 히어로 캔버스 — 8단계가 어둠 속에서 나선으로 상승하는 성좌.
 * 외부 의존성 없는 2D 캔버스 + 원근 투영. 마우스 패럴럭스, 탭 비활성 시 정지,
 * prefers-reduced-motion이면 정지된 한 프레임만 그린다.
 */
const STEPS = 8;
const FOCAL = 560;

interface P3 {
  x: number;
  y: number;
  z: number;
}

export default function Hero3D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let t = reduced ? 18 : 0; // 정지 프레임도 좋은 각도에서
    let mx = 0;
    let my = 0;
    let running = true;

    // 상승 나선 위의 8개 불씨 (아래 → 위)
    const nodes = Array.from({ length: STEPS }, (_, i) => ({
      angle: (i / STEPS) * Math.PI * 1.85 - Math.PI * 0.4,
      radius: 168,
      y: 118 - (i / (STEPS - 1)) * 236,
    }));

    // 부유 입자 — 아직 형태가 되지 못한 가능성
    const parts = Array.from({ length: 84 }, (_, i) => ({
      x: (((i * 197) % 640) - 320) + ((i * 53) % 37),
      y: (((i * 131) % 460) - 230),
      z: (((i * 271) % 640) - 320),
      s: 0.5 + ((i * 89) % 100) / 70,
      tw: ((i * 61) % 628) / 100,
      warm: i % 3 === 0,
    }));

    const rot = (p: P3, a: number): P3 => ({
      x: p.x * Math.cos(a) - p.z * Math.sin(a),
      y: p.y,
      z: p.x * Math.sin(a) + p.z * Math.cos(a),
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw();
    };

    const project = (p: P3) => {
      const k = FOCAL / (FOCAL + p.z);
      return {
        x: w * 0.5 + p.x * k,
        y: h * 0.52 + (p.y + my * 16) * k,
        k,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const a = t * 0.0035 + mx * 0.45;

      // 입자 (먼 것부터)
      const pp = parts
        .map((p) => ({ p, r: rot(p, a * 0.6) }))
        .sort((q, r2) => r2.r.z - q.r.z);
      for (const { p, r } of pp) {
        const s = project(r);
        if (s.k <= 0.2) continue;
        const twinkle = reduced ? 0.75 : 0.55 + 0.45 * Math.sin(t * 0.02 + p.tw * 6.283);
        const alpha = Math.max(0, (s.k - 0.35) * 0.6) * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, p.s * s.k, 0, 6.283);
        ctx.fillStyle = p.warm
          ? `rgba(255, 160, 87, ${alpha * 0.8})`
          : `rgba(139, 123, 255, ${alpha * 0.65})`;
        ctx.fill();
      }

      // 궤도 연결선
      const pts = nodes.map((n) =>
        project(rot({ x: Math.cos(n.angle) * n.radius, y: n.y, z: Math.sin(n.angle) * n.radius }, a)),
      );
      ctx.beginPath();
      pts.forEach((s, i) => (i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y)));
      ctx.strokeStyle = "rgba(255, 109, 31, 0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 불씨 노드 (먼 것부터 그려 겹침 보정)
      const order = pts
        .map((s, i) => ({ s, i }))
        .sort((q, r2) => q.s.k - r2.s.k);
      for (const { s, i } of order) {
        const glowR = (10 + i * 1.1) * s.k;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
        const near = Math.min(1, Math.max(0.25, (s.k - 0.55) * 2.2));
        g.addColorStop(0, `rgba(255, 160, 87, ${0.85 * near})`);
        g.addColorStop(0.35, `rgba(255, 109, 31, ${0.4 * near})`);
        g.addColorStop(1, "rgba(255, 109, 31, 0)");
        ctx.beginPath();
        ctx.arc(s.x, s.y, glowR, 0, 6.283);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, Math.max(1.4, 2.3 * s.k), 0, 6.283);
        ctx.fillStyle = `rgba(255, 236, 220, ${near})`;
        ctx.fill();
      }
    };

    const loop = () => {
      if (!running) return;
      t += 1;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onPointer = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onVis = () => {
      running = !document.hidden;
      if (running && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      raf = requestAnimationFrame(loop);
    } else {
      draw();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
