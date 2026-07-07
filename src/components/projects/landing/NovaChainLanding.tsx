'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform
} from 'framer-motion';
import { cn } from '@/utils/style';
import type { Project } from '@/data/projects';
import { CountUp, Reveal } from './shared';

/* =========================================================================
   NOVA Chain — 인터랙티브 Web3 프로토콜 랜딩 (컨셉 데모)
   디자인 토큰과 공유 아톰을 여기서 정의하고, 아래 섹션들이 이를 참조한다.
   섹션 컴포넌트(NetworkCanvas ~ FinalCtaSection)는 병렬 에이전트가 생성했다.
   ========================================================================= */

const NOVA = {
  cyan: '#22D3EE',
  blue: '#3B82F6',
  blueDeep: '#2563EB',
  green: '#34D399',
  ink: '#060910'
} as const;

const PANEL =
  'rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl';

const EYEBROW =
  'inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs font-medium tracking-wide text-cyan-300';

/* ---------- 공유 아톰 ---------- */

function SectionHeading({
  eyebrow,
  title,
  sub
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className={EYEBROW}>
        <span className="size-1.5 rounded-full bg-cyan-400" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {sub ? (
        <p className="mt-4 text-base leading-relaxed text-slate-400">{sub}</p>
      ) : null}
    </Reveal>
  );
}

function NovaButton({
  children,
  href,
  variant = 'primary',
  className,
  onClick
}: {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
}) {
  const base =
    'inline-flex h-12 min-w-[44px] items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060910] active:scale-[0.98]';
  const look =
    variant === 'primary'
      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#04121a] shadow-[0_10px_36px_-10px_rgba(34,211,238,0.7)] hover:brightness-110'
      : 'border border-white/15 bg-white/5 text-white hover:border-cyan-400/40 hover:bg-white/10';
  const cls = cn(base, look, className);
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function StatChip({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className={cn(PANEL, 'px-4 py-3')}>
      <div className="text-lg font-semibold text-white sm:text-xl">{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  );
}

/* ---------- 브랜드 마크 ---------- */

function NovaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="nova-mark" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor={NOVA.cyan} />
          <stop offset="1" stopColor={NOVA.blue} />
        </linearGradient>
      </defs>
      <path
        d="M6 24V8l20 16V8"
        stroke="url(#nova-mark)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="8" r="2.4" fill={NOVA.cyan} />
      <circle cx="26" cy="24" r="2.4" fill={NOVA.blue} />
    </svg>
  );
}

/* ---------- 고정 배경: 파인 그리드 + 글로우 오브 ---------- */

function GridGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#060910]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 85% 55% at 50% 0%, black 35%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 85% 55% at 50% 0%, black 35%, transparent 100%)'
        }}
      />
      <div
        className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(34,211,238,0.22), transparent)'
        }}
      />
      <div
        className="absolute left-[-10rem] top-[42%] h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(59,130,246,0.20), transparent)'
        }}
      />
    </div>
  );
}

/* ---------- 상단 내비게이션 ---------- */

const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Developers', href: '#protocol' },
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'Roadmap', href: '#roadmap' }
];

function ConnectWallet({ full = false }: { full?: boolean }) {
  const [connected, setConnected] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setConnected((v) => !v)}
      aria-pressed={connected}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060910]',
        full && 'w-full',
        connected
          ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
          : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#04121a] hover:brightness-110'
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full',
          connected ? 'bg-emerald-400' : 'bg-[#04121a]/70'
        )}
      />
      {connected ? '0xA1c…9F2e' : 'Connect Wallet'}
    </button>
  );
}

function NovaNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-white/10 bg-[#060910]/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          <NovaMark className="size-7" />
          <span className="text-base font-semibold tracking-tight text-white">
            NOVA<span className="text-cyan-300"> Chain</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <ConnectWallet />
        </div>

        <button
          type="button"
          aria-label="메뉴"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-11 items-center justify-center rounded-lg text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mb-3 rounded-2xl border border-white/10 bg-[#0a0f1a]/95 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2">
                <ConnectWallet full />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

/* ---------- 히어로 ---------- */

const HERO_STATS = [
  { value: '18k', label: 'TPS' },
  { value: '0.2s', label: 'Finality' },
  { value: '430k', label: 'Active wallets' },
  { value: '99.99%', label: 'Uptime' }
];

function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="top"
      className="relative mx-auto max-w-6xl px-6 pb-16 pt-28 sm:pt-32 lg:pb-24"
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="relative z-10 text-center lg:text-left">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(EYEBROW, 'mx-auto lg:mx-0')}
          >
            <span className="size-1.5 rounded-full bg-cyan-400" />
            Modular Layer 2 · AI-native
          </motion.span>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mx-auto mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:mx-0 lg:text-6xl"
          >
            The execution layer for{' '}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              autonomous on-chain agents
            </span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg lg:mx-0"
          >
            NOVA Chain lets developers deploy AI agents that transact,
            coordinate, and settle on-chain — with sub-second finality and
            verifiable execution.
          </motion.p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <NovaButton href="#build">Start Building</NovaButton>
            <NovaButton href="#" variant="secondary">
              Read the Whitepaper
            </NovaButton>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HERO_STATS.map((s) => (
              <StatChip key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>

        <div className="relative">
          <div
            className={cn(
              PANEL,
              'relative aspect-square overflow-hidden sm:aspect-[4/3] lg:aspect-square'
            )}
          >
            <NetworkCanvas reduce={!!reduce} />
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-300 backdrop-blur">
              <span className="relative flex size-2">
                {!reduce && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                )}
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Live network
            </div>
            <div className="absolute bottom-4 right-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-right backdrop-blur">
              <div className="text-sm font-semibold text-white">
                <CountUp target={430000} />
              </div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">
                active wallets
              </div>
            </div>
          </div>
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                'radial-gradient(closest-side, rgba(34,211,238,0.18), transparent)'
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ======================================================================
   생성 섹션 (병렬 에이전트 산출물, 디자인 계약에 맞춰 조립)
   ====================================================================== */

/* ---------- NetworkCanvas ---------- */
type NCNodeAttr = {
  fx: number;
  fy: number;
  r: number;
  depth: number;
  phase: number;
  speed: number;
  amp: number;
  color: string;
};

type NCEdge = { a: number; b: number; strength: number };

type NCPacket = { edge: number; t: number; speed: number; dir: 1 | -1; color: string };

function NCrgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function NetworkCanvas({ className, reduce }: { className?: string; reduce: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!ctx || !parent) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let raf = 0;
    let running = false;

    const attrs: NCNodeAttr[] = [];
    let edges: NCEdge[] = [];
    let packets: NCPacket[] = [];

    const tgt = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const maxShift = 14;

    let start = performance.now();
    let last = start;
    let spawnAcc = 0;
    let spawnEvery = 0.6;

    const pickNodeColor = (): string => (Math.random() < 0.42 ? NOVA.blue : NOVA.cyan);

    const ensureAttrs = () => {
      if (attrs.length) return;
      const N = 18;
      let tries = 0;
      while (attrs.length < N && tries < 2000) {
        tries++;
        const fx = 0.06 + Math.random() * 0.88;
        const fy = 0.09 + Math.random() * 0.82;
        let ok = true;
        for (const p of attrs) {
          const dx = p.fx - fx;
          const dy = p.fy - fy;
          if (dx * dx + dy * dy < 0.02) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        attrs.push({
          fx,
          fy,
          r: 2.6 + Math.random() * 3.6,
          depth: 0.35 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
          speed: 0.12 + Math.random() * 0.22,
          amp: 5 + Math.random() * 10,
          color: pickNodeColor(),
        });
      }
    };

    const build = () => {
      ensureAttrs();
      const thr = Math.min(width, height) * 0.42;
      edges = [];
      // 리사이즈로 edges를 재구성하면 in-flight packet의 인덱스가 dangling될 수
      // 있으므로 함께 비운다. (draw()의 방어 가드와 이중 안전장치)
      packets = [];
      for (let i = 0; i < attrs.length; i++) {
        for (let j = i + 1; j < attrs.length; j++) {
          const ax = attrs[i].fx * width;
          const ay = attrs[i].fy * height;
          const bx = attrs[j].fx * width;
          const by = attrs[j].fy * height;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < thr) edges.push({ a: i, b: j, strength: 1 - d / thr });
        }
      }
    };

    const nodePos = (i: number, time: number, sx: number, sy: number): { x: number; y: number } => {
      const a = attrs[i];
      const dx = Math.sin(time * a.speed + a.phase) * a.amp;
      const dy = Math.cos(time * a.speed * 0.9 + a.phase * 1.3) * a.amp;
      return { x: a.fx * width + dx + sx * a.depth, y: a.fy * height + dy + sy * a.depth };
    };

    const spawn = () => {
      if (packets.length >= 5 || edges.length === 0) return;
      const edge = Math.floor(Math.random() * edges.length);
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const color =
        Math.random() < 0.16 ? NOVA.green : Math.random() < 0.5 ? NOVA.cyan : NOVA.blue;
      packets.push({ edge, t: 0, speed: 0.28 + Math.random() * 0.3, dir, color });
    };

    const draw = (time: number, sx: number, sy: number, withPackets: boolean) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const pos: { x: number; y: number }[] = [];
      for (let i = 0; i < attrs.length; i++) pos.push(nodePos(i, time, sx, sy));

      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = 1;
      for (const e of edges) {
        const A = pos[e.a];
        const B = pos[e.b];
        ctx.strokeStyle = NCrgba(NOVA.cyan, 0.05 + e.strength * 0.13);
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < attrs.length; i++) {
        const a = attrs[i];
        const P = pos[i];
        const pulse = withPackets ? 0.75 + 0.25 * Math.sin(time * 1.6 + a.phase) : 1;
        const haloR = a.r * 3.6;
        const g = ctx.createRadialGradient(P.x, P.y, 0, P.x, P.y, haloR);
        g.addColorStop(0, NCrgba(a.color, 0.55 * pulse));
        g.addColorStop(0.35, NCrgba(a.color, 0.22 * pulse));
        g.addColorStop(1, NCrgba(a.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(P.x, P.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = NCrgba("#EAFEFF", 0.9);
        ctx.beginPath();
        ctx.arc(P.x, P.y, a.r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (withPackets) {
        for (const p of packets) {
          const e = edges[p.edge];
          if (!e) continue;
          const ai = p.dir === 1 ? e.a : e.b;
          const bi = p.dir === 1 ? e.b : e.a;
          const A = pos[ai];
          const B = pos[bi];
          const t = p.t;
          const tt = Math.max(0, t - 0.3);
          const hx = A.x + (B.x - A.x) * t;
          const hy = A.y + (B.y - A.y) * t;
          const txp = A.x + (B.x - A.x) * tt;
          const typ = A.y + (B.y - A.y) * tt;
          const fade = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);

          const grad = ctx.createLinearGradient(txp, typ, hx, hy);
          grad.addColorStop(0, NCrgba(p.color, 0));
          grad.addColorStop(1, NCrgba(p.color, 0.8 * fade));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(txp, typ);
          ctx.lineTo(hx, hy);
          ctx.stroke();

          const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 7);
          hg.addColorStop(0, NCrgba(p.color, 0.95 * fade));
          hg.addColorStop(1, NCrgba(p.color, 0));
          ctx.fillStyle = hg;
          ctx.beginPath();
          ctx.arc(hx, hy, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      build();
      if (reduce) draw(0, 0, 0, false);
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = (now - start) / 1000;

      cur.x += (tgt.x - cur.x) * Math.min(1, dt * 5);
      cur.y += (tgt.y - cur.y) * Math.min(1, dt * 5);

      spawnAcc += dt;
      if (spawnAcc >= spawnEvery && edges.length) {
        spawn();
        spawnAcc = 0;
        spawnEvery = 0.7 + Math.random() * 1.1;
      }

      for (const p of packets) p.t += p.speed * dt;
      packets = packets.filter((p) => p.t <= 1);

      draw(time, cur.x, cur.y, true);
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / height - 0.5) * 2;
      tgt.x = Math.max(-1, Math.min(1, nx)) * maxShift;
      tgt.y = Math.max(-1, Math.min(1, ny)) * maxShift;
    };
    const onLeave = () => {
      tgt.x = 0;
      tgt.y = 0;
    };

    const startLoop = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(parent);
    resize();

    if (!reduce) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      start = performance.now();
      last = start;
    }

    // 히어로가 화면 밖으로 스크롤되면 rAF 루프를 멈춰 오프스크린 CPU/배터리
    // 낭비를 없앤다. (탭 백그라운드가 아니어도 동작)
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) startLoop();
        else stopLoop();
      },
      { threshold: 0 }
    );
    io.observe(parent);

    return () => {
      stopLoop();
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  return <canvas ref={canvasRef} aria-hidden className={cn("block h-full w-full", className)} />;
}

/* ---------- FeaturesSection ---------- */
type FeatCardData = {
  title: string;
  desc: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

function FeatExecutionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  );
}

function FeatWalletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a2 2 0 0 1 2 2v1" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-2.5" />
      <path d="M21 10.5v4h-4a2 2 0 0 1 0-4h4Z" />
      <circle cx="17.5" cy="12.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FeatVerifyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3 5 5.7v5.1c0 4.3 2.9 7.6 7 9.2 4.1-1.6 7-4.9 7-9.2V5.7L12 3Z" />
      <path d="m9.2 12 2 2 3.6-3.8" />
    </svg>
  );
}

const FEAT_CARDS: FeatCardData[] = [
  {
    title: "Autonomous Execution",
    desc: "Agents run as first-class on-chain citizens — schedule, trigger, and execute multi-step strategies with no human in the loop. Gas is abstracted and execution is guaranteed by the protocol.",
    icon: FeatExecutionIcon,
  },
  {
    title: "Composable Agent Wallets",
    desc: "Programmable smart accounts built for agents. Scoped permissions, spend limits, and session keys let agents transact safely and compose with any NOVA app.",
    icon: FeatWalletIcon,
  },
  {
    title: "Verifiable AI Actions",
    desc: "Every agent decision is attested and provable. On-chain verification of model outputs and intents means you can trust what an agent did — and prove it to anyone.",
    icon: FeatVerifyIcon,
  },
];

function FeatCard({ data, index }: { data: FeatCardData; index: number }) {
  const Icon = data.icon;
  return (
    <Reveal delay={0.06 * index} className="h-full">
      <article
        className={cn(
          PANEL,
          "group relative flex h-full flex-col gap-5 p-6 sm:p-7",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.05]",
          "hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]",
        )}
      >
        <span
          className={cn(
            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
            "transition-colors duration-300 group-hover:border-cyan-400/40 group-hover:text-cyan-200",
          )}
          aria-hidden="true"
        >
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-semibold text-white sm:text-xl">{data.title}</h3>
        <p className="text-sm leading-relaxed text-slate-400 sm:text-[0.95rem]">{data.desc}</p>
      </article>
    </Reveal>
  );
}

function FeaturesSection() {
  return (
    <section id="product" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
      />
      <SectionHeading
        eyebrow="Built for Agent Economies"
        title="Infrastructure for autonomous agents"
        sub="Primitives that let AI agents act on-chain with safety, composability, and proof."
      />
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {FEAT_CARDS.map((card, i) => (
          <FeatCard key={card.title} data={card} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ---------- ProtocolLayerSection ---------- */
type PLGlyphName = "runtime" | "router" | "settlement" | "data";

type PLLayerItem = {
  id: string;
  title: string;
  desc: string;
  glyph: PLGlyphName;
};

const PL_LAYERS: PLLayerItem[] = [
  {
    id: "01",
    title: "Agent Runtime",
    desc: "Sandboxed environment where AI agents run, reason, and sign intents.",
    glyph: "runtime",
  },
  {
    id: "02",
    title: "Intent Router",
    desc: "Matches, batches, and routes agent intents to the cheapest valid execution path.",
    glyph: "router",
  },
  {
    id: "03",
    title: "Settlement Layer",
    desc: "Sub-second finality with optimistic plus ZK-backed settlement to Ethereum.",
    glyph: "settlement",
  },
  {
    id: "04",
    title: "Data Availability",
    desc: "Modular DA keeps state cheap, verifiable, and always reconstructible.",
    glyph: "data",
  },
];

function PLGlyph({ name, className }: { name: PLGlyphName; className?: string }) {
  const s = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "runtime":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="3" {...s} />
          <rect x="9" y="9" width="6" height="6" rx="1" {...s} />
          <path
            d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"
            {...s}
          />
        </svg>
      );
    case "router":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M3 12h4" {...s} />
          <path d="M7 12c5 0 3-6 10-6" {...s} />
          <path d="M7 12c5 0 3 6 10 6" {...s} />
          <circle cx="4.5" cy="12" r="1.6" {...s} />
          <circle cx="18.5" cy="6" r="1.6" {...s} />
          <circle cx="18.5" cy="18" r="1.6" {...s} />
        </svg>
      );
    case "settlement":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M12 3l7 3v5c0 4.5-3 7.2-7 8.4C8 18.2 5 15.5 5 11V6z" {...s} />
          <path d="M8.8 12.2l2 2 4.4-4.4" {...s} />
        </svg>
      );
    case "data":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <ellipse cx="12" cy="6" rx="7" ry="3" {...s} />
          <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" {...s} />
          <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" {...s} />
        </svg>
      );
    default:
      return null;
  }
}

function PLPlate({ layer }: { layer: PLLayerItem }) {
  return (
    <div
      className={cn(
        PANEL,
        "group relative flex items-center gap-4 p-4 transition-all duration-300 ease-out sm:p-5",
        "hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.05]",
        "hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]",
      )}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-300 transition-colors duration-300 group-hover:border-cyan-400/40 group-hover:text-cyan-200"
        aria-hidden="true"
      >
        <PLGlyph name={layer.glyph} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white sm:text-base">
          {layer.title}
        </h3>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
          {layer.desc}
        </p>
      </div>
      <span className="font-mono text-2xl font-semibold text-white/10 transition-colors duration-300 group-hover:text-cyan-400/30 sm:text-3xl">
        {layer.id}
      </span>
    </div>
  );
}

function PLConnector({ reduce, delay }: { reduce: boolean; delay: number }) {
  return (
    <div className="flex h-6 justify-center" aria-hidden="true">
      <div className="relative h-full w-px overflow-hidden bg-white/10">
        {!reduce && (
          <motion.span
            className="absolute left-0 top-0 h-3 w-px bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
            initial={{ y: -12 }}
            animate={{ y: 24 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay,
            }}
          />
        )}
      </div>
    </div>
  );
}

function ProtocolLayerSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="protocol"
      className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
      />

      <SectionHeading
        eyebrow="Protocol Layer"
        title="A modular stack, from intent to settlement"
        sub="Four composable layers turn an agent intent into finalized on-chain state."
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-5 lg:items-center lg:gap-12">
        <div className="lg:col-span-2">
          <Reveal>
            <span
              className={cn(EYEBROW, "inline-flex")}
              aria-hidden="true"
            >
              Data flow
            </span>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
              Every request enters at the top as an agent intent and moves
              downward through the stack.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Routed, executed, settled, and made permanently available — the
              full path from reasoning to finalized on-chain state resolves in
              under a second.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verifiable end to end
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Sub-second finality
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-8">
              <NovaButton href="#docs" variant="secondary">
                Explore the architecture
              </NovaButton>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-3">
          {PL_LAYERS.map((layer, i) => (
            <div key={layer.id}>
              <Reveal delay={i * 0.08}>
                <PLPlate layer={layer} />
              </Reveal>
              {i < PL_LAYERS.length - 1 && (
                <PLConnector reduce={!!reduce} delay={i * 0.4} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- NetworkMetricsSection ---------- */
type METTrend = {
  dir: "up" | "down";
  label: string;
  positive: boolean;
};

type METCard = {
  label: string;
  count?: number;
  suffix?: string;
  literal?: string;
  trend: METTrend;
  spark: string;
};

const MET_CARDS: METCard[] = [
  {
    label: "Throughput",
    count: 18000,
    suffix: " TPS",
    trend: { dir: "up", label: "+12%", positive: true },
    spark: "0,20 12,16 24,17 36,11 48,13 60,7 72,9 84,4 96,5 108,2",
  },
  {
    label: "Finality",
    literal: "0.2s",
    trend: { dir: "down", label: "-40% latency", positive: true },
    spark: "0,4 12,6 24,5 36,9 48,8 60,12 72,11 84,15 96,16 108,20",
  },
  {
    label: "Active Wallets",
    count: 430000,
    trend: { dir: "up", label: "+8%", positive: true },
    spark: "0,18 12,17 24,14 36,15 48,11 60,12 72,8 84,9 96,5 108,3",
  },
  {
    label: "Uptime",
    literal: "99.99%",
    trend: { dir: "up", label: "Stable", positive: true },
    spark: "0,8 12,7 24,8 36,7 48,8 60,7 72,8 84,7 96,8 108,7",
  },
  {
    label: "Value Settled",
    literal: "$2.4B",
    trend: { dir: "up", label: "+21%", positive: true },
    spark: "0,19 12,18 24,16 36,14 48,15 60,10 72,11 84,6 96,7 108,2",
  },
  {
    label: "Agents Deployed",
    count: 61000,
    suffix: "+",
    trend: { dir: "up", label: "+15%", positive: true },
    spark: "0,17 12,15 24,16 36,12 48,10 60,11 72,7 84,8 96,4 108,3",
  },
];

function METTrendIcon({ dir }: { dir: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === "up" ? (
        <>
          <path d="M2 8.5 5 5l2 2 3-3.5" />
          <path d="M7.5 3.5H10v2.5" />
        </>
      ) : (
        <>
          <path d="M2 3.5 5 7l2-2 3 3.5" />
          <path d="M7.5 8.5H10V6" />
        </>
      )}
    </svg>
  );
}

function METSparkline({ points }: { points: string }) {
  return (
    <svg
      viewBox="0 0 108 22"
      preserveAspectRatio="none"
      className="h-8 w-full"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="metSparkStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={NOVA.blue} stopOpacity={0.5} />
          <stop offset="100%" stopColor={NOVA.cyan} />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        stroke="url(#metSparkStroke)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function METStatCard({ card, index }: { card: METCard; index: number }) {
  return (
    <Reveal delay={index * 0.06}>
      <div
        className={cn(
          PANEL,
          "group relative flex h-full flex-col gap-4 overflow-hidden p-6",
          "transition-all duration-300 ease-out hover:-translate-y-0.5",
          "hover:border-cyan-400/30 hover:bg-white/[0.05]",
          "hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]"
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-400">{card.label}</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
              card.trend.positive
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-white/10 bg-white/[0.04] text-slate-400"
            )}
          >
            <METTrendIcon dir={card.trend.dir} />
            {card.trend.label}
          </span>
        </div>

        <div className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {typeof card.count === "number" ? (
            <CountUp target={card.count} suffix={card.suffix} />
          ) : (
            card.literal
          )}
        </div>

        <div className="mt-auto pt-2">
          <METSparkline points={card.spark} />
        </div>
      </div>
    </Reveal>
  );
}

function NetworkMetricsSection() {
  return (
    <section id="metrics" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <SectionHeading
        eyebrow="Network Metrics"
        title="Live protocol performance"
        sub="Numbers from a network built for machine-speed coordination."
      />
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MET_CARDS.map((card, i) => (
          <METStatCard key={card.label} card={card} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ---------- EcosystemSection ---------- */
type ECOApp = {
  name: string;
  tag: string;
  desc: string;
  mark: (p: { reduce: boolean }) => React.ReactElement;
};

function ECOSwapMark({ reduce }: { reduce: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M11 15h15l-4-4M29 25H14l4 4"
        stroke={NOVA.cyan}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!reduce && (
        <circle cx="20" cy="20" r="16" stroke={NOVA.blue} strokeOpacity="0.25" strokeWidth="1.4" strokeDasharray="3 5" />
      )}
    </svg>
  );
}

function ECOVaultMark(): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="h-6 w-6">
      <path d="M20 6l12 7v10l-12 7-12-7V13l12-7z" stroke={NOVA.blue} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="4.2" stroke={NOVA.cyan} strokeWidth="2.2" />
      <path d="M20 20v5" stroke={NOVA.cyan} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ECOPayMark(): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="h-6 w-6">
      <circle cx="11" cy="12" r="3.4" stroke={NOVA.cyan} strokeWidth="2.2" />
      <circle cx="11" cy="28" r="3.4" stroke={NOVA.blue} strokeWidth="2.2" />
      <circle cx="29" cy="20" r="3.4" stroke={NOVA.green} strokeWidth="2.2" />
      <path d="M14 13.5l12 5M14 26.5l12-5" stroke={NOVA.blue} strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ECONodeMark(): React.ReactElement {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="h-6 w-6">
      <path d="M20 8v9M20 23v9M12 15l8 5 8-5M12 25l8-5 8 5" stroke={NOVA.blue} strokeOpacity="0.6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="8" r="2.8" fill={NOVA.cyan} />
      <circle cx="10" cy="20" r="2.8" fill={NOVA.green} />
      <circle cx="30" cy="20" r="2.8" fill={NOVA.cyan} />
      <circle cx="20" cy="32" r="2.8" fill={NOVA.blue} />
      <circle cx="20" cy="20" r="3.4" stroke={NOVA.cyan} strokeWidth="2" />
    </svg>
  );
}

const ECO_APPS: ECOApp[] = [
  {
    name: "NovaSwap",
    tag: "DeFi",
    desc: "Agent-native DEX where agents swap and route intents at machine speed.",
    mark: ({ reduce }) => <ECOSwapMark reduce={reduce} />,
  },
  {
    name: "AgentVault",
    tag: "Infra",
    desc: "Non-custodial smart accounts and key management built for autonomous agents.",
    mark: () => <ECOVaultMark />,
  },
  {
    name: "IntentPay",
    tag: "Payments",
    desc: "Declarative payments: state the outcome, let the network settle it.",
    mark: () => <ECOPayMark />,
  },
  {
    name: "SynthNode",
    tag: "Oracle",
    desc: "Signed, verifiable off-chain data feeds for agent decision-making.",
    mark: () => <ECONodeMark />,
  },
];

function ECOCard({ app, reduce }: { app: ECOApp; reduce: boolean }): React.ReactElement {
  return (
    <a
      href="#ecosystem"
      className={cn(
        PANEL,
        "group flex h-full flex-col p-6 transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.05]",
        "hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-emerald-400/10">
          {app.mark({ reduce })}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-300">
          {app.tag}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{app.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{app.desc}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300">
        Explore
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
        >
          <path d="M3 8h9m0 0l-3.5-3.5M12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </a>
  );
}

function EcosystemSection() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section id="ecosystem" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-64 max-w-3xl rounded-full bg-cyan-500/[0.06] blur-3xl"
      />
      <SectionHeading
        eyebrow="Ecosystem"
        title="Apps already building on NOVA"
        sub="A growing network of agent-native protocols and tools."
      />
      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ECO_APPS.map((app, i) => (
          <Reveal key={app.name} delay={i * 0.08}>
            <ECOCard app={app} reduce={reduce} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- RoadmapSection ---------- */
type RMStatus = "done" | "active" | "future";

type RMPhase = {
  quarter: string;
  title: string;
  desc: string;
  status: RMStatus;
  pill: string;
};

const RM_PHASES: RMPhase[] = [
  {
    quarter: "Q4 2025",
    title: "Testnet",
    desc: "Public testnet: agent runtime, faucet, and block explorer.",
    status: "done",
    pill: "Shipped",
  },
  {
    quarter: "Q1 2026",
    title: "Agent SDK",
    desc: "TypeScript SDK, agent templates, and a local simulator.",
    status: "active",
    pill: "In progress",
  },
  {
    quarter: "Q2 2026",
    title: "Mainnet Beta",
    desc: "Guarded mainnet with real settlement and audited contracts.",
    status: "future",
    pill: "Upcoming",
  },
  {
    quarter: "Q3 2026",
    title: "Decentralized Sequencer",
    desc: "Permissionless sequencing and full decentralization.",
    status: "future",
    pill: "Planned",
  },
];

function RMCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function RMPillBadge({ status, label }: { status: RMStatus; label: string }) {
  const tone =
    status === "done"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : status === "active"
        ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
        : "border-white/10 bg-white/[0.04] text-slate-400";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide",
        tone,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "done"
            ? "bg-emerald-400"
            : status === "active"
              ? "bg-cyan-400"
              : "bg-slate-500",
        )}
      />
      {label}
    </span>
  );
}

function RMMarker({ status, reduce }: { status: RMStatus; reduce: boolean }) {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center">
      {status === "active" && !reduce && (
        <motion.span
          className="absolute inset-0 rounded-full border border-cyan-400/60"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.6, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          aria-hidden="true"
        />
      )}
      {status === "done" && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/40 bg-gradient-to-br from-cyan-400 to-emerald-400 text-[#060910] shadow-[0_0_28px_-8px_rgba(52,211,153,0.7)]">
          <RMCheck className="h-5 w-5" />
        </span>
      )}
      {status === "active" && (
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-400/15 shadow-[0_0_28px_-8px_rgba(34,211,238,0.7)]">
          <span className="h-3 w-3 rounded-full bg-cyan-300" />
        </span>
      )}
      {status === "future" && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.03]">
          <span className="h-2.5 w-2.5 rounded-full border border-slate-500" />
        </span>
      )}
    </span>
  );
}

function RoadmapSection() {
  const reduce = useReducedMotion();
  const RMsectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: RMsectionRef,
    offset: ["start 0.8", "end 0.55"],
  });
  const RMrawFill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const RMfill = useSpring(RMrawFill, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });
  const RMprogress = reduce ? 1 : RMfill;

  return (
    <section
      ref={RMsectionRef}
      id="roadmap"
      className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-64 max-w-3xl rounded-full bg-cyan-500/10 blur-3xl"
      />

      <SectionHeading
        eyebrow="Roadmap"
        title="The path to full decentralization"
        sub="Shipping in the open, phase by phase."
      />

      <div className="mt-16">
        {/* Desktop / large: horizontal timeline */}
        <div className="relative hidden lg:block">
          <div className="absolute left-0 right-0 top-[22px] h-px -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400"
              style={{ scaleX: RMprogress }}
            />
          </div>

          <ol className="relative grid grid-cols-4 gap-8">
            {RM_PHASES.map((phase, i) => (
              <li key={phase.title}>
                <Reveal delay={i * 0.08}>
                  <div className="flex flex-col items-start">
                    <RMMarker status={phase.status} reduce={!!reduce} />
                    <div className="mt-6 w-full">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                        {phase.quarter}
                      </div>
                      <div
                        className={cn(
                          PANEL,
                          "group mt-3 h-full p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.05] hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.5)]",
                        )}
                      >
                        <h3 className="text-lg font-semibold text-white">
                          {phase.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                          {phase.desc}
                        </p>
                        <div className="mt-4">
                          <RMPillBadge status={phase.status} label={phase.pill} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        {/* Mobile / small: vertical rail */}
        <div className="relative lg:hidden">
          <div className="absolute bottom-0 left-[21px] top-2 w-px overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full w-full origin-top rounded-full bg-gradient-to-b from-cyan-400 via-cyan-300 to-emerald-400"
              style={{ scaleY: RMprogress }}
            />
          </div>

          <ol className="relative space-y-8">
            {RM_PHASES.map((phase, i) => (
              <li key={phase.title} className="relative flex gap-5">
                <Reveal delay={i * 0.08} className="flex w-full gap-5">
                  <div className="relative z-10 shrink-0">
                    <RMMarker status={phase.status} reduce={!!reduce} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      {phase.quarter}
                    </div>
                    <div
                      className={cn(
                        PANEL,
                        "mt-3 p-5 transition-all duration-300 ease-out hover:border-cyan-400/30 hover:bg-white/[0.05]",
                      )}
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {phase.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {phase.desc}
                      </p>
                      <div className="mt-4">
                        <RMPillBadge status={phase.status} label={phase.pill} />
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------- FinalCtaSection ---------- */
type FctaOrbProps = {
  className?: string;
  color: string;
};

function FctaOrb({ className, color }: FctaOrbProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
    />
  );
}

function FinalCtaSection() {
  const reduce = useReducedMotion();

  return (
    <section id="build" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <Reveal>
        <div
          className={cn(
            PANEL,
            "relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-24"
          )}
        >
          {/* Fine grid texture local to the panel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)",
            }}
          />

          {/* Local glow orbs (low opacity, contained to the panel) */}
          <FctaOrb
            color={NOVA.cyan}
            className="left-[-6rem] top-[-6rem] h-64 w-64 opacity-20"
          />
          <FctaOrb
            color={NOVA.blue}
            className="bottom-[-8rem] right-[-6rem] h-72 w-72 opacity-20"
          />

          {/* Animated glow behind the headline */}
          {!reduce && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-[28rem] max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{
                background: `radial-gradient(ellipse, ${NOVA.cyan} 0%, ${NOVA.blue} 45%, transparent 75%)`,
              }}
              initial={{ opacity: 0.12, scale: 0.95 }}
              animate={{ opacity: [0.12, 0.24, 0.12], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <div className="relative flex flex-col items-center">
            <span className={cn(EYEBROW)}>Start now</span>

            <h2 className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Deploy your first autonomous agent on NOVA.
            </h2>

            <p className="mt-5 max-w-xl text-slate-400">
              Spin up an agent, fund a smart wallet, and settle your first
              on-chain action in minutes.
            </p>

            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <NovaButton href="#" variant="primary">
                Start Building
              </NovaButton>
              <NovaButton href="#" variant="secondary">
                Read the Docs
              </NovaButton>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Free testnet · no credit card · open source.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- 푸터 ---------- */

const FOOT_COLS = [
  { title: 'Protocol', links: ['Overview', 'Architecture', 'Settlement', 'Security'] },
  { title: 'Developers', links: ['Docs', 'Agent SDK', 'Whitepaper', 'Status'] },
  { title: 'Ecosystem', links: ['NovaSwap', 'AgentVault', 'IntentPay', 'SynthNode'] }
];

function NovaFooter({ project }: { project: Project }) {
  return (
    <footer className="relative border-t border-white/10 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <NovaMark className="size-7" />
            <span className="text-base font-semibold text-white">NOVA Chain</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            The modular Layer 2 for AI-native applications. Deploy autonomous
            agents that transact, coordinate, and settle on-chain.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex size-11 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.49-1.11-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="X"
              className="flex size-11 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25h6.83l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
              </svg>
            </a>
          </div>
        </div>
        {FOOT_COLS.map((col) => (
          <div key={col.title}>
            <div className="text-sm font-semibold text-white">{col.title}</div>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="rounded text-sm text-slate-400 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row">
        <p>
          NOVA Chain은 토리스가 만든 컨셉 데모 프로토콜입니다 (실제 자산·네트워크
          아님).
        </p>
        <p>© 2026 NOVA Chain — a Toris concept.</p>
      </div>
    </footer>
  );
}

/* ---------- 페이지 셸 ---------- */

export default function NovaChainLanding({ project }: { project: Project }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#060910] text-white antialiased">
      <style>{'section[id]{scroll-margin-top:5rem}'}</style>
      <GridGlow />
      <NovaNav />
      <main>
        <Hero />
        <FeaturesSection />
        <ProtocolLayerSection />
        <NetworkMetricsSection />
        <EcosystemSection />
        <RoadmapSection />
        <FinalCtaSection />
      </main>
      <NovaFooter project={project} />
    </div>
  );
}
