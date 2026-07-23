"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface SignaturePadHandle {
  toDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

export const SignaturePad = forwardRef<SignaturePadHandle, { className?: string }>(
  function SignaturePad({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawing = useRef(false);
    const hasInk = useRef(false);
    const [, setTick] = useState(0);

    function pos(e: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    function start(e: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawing.current = true;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = pos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      canvas.setPointerCapture(e.pointerId);
    }

    function move(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!drawing.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      const { x, y } = pos(e);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1a1e24";
      ctx.lineTo(x, y);
      ctx.stroke();
      hasInk.current = true;
    }

    function end() {
      drawing.current = false;
      setTick((t) => t + 1);
    }

    useImperativeHandle(ref, () => ({
      toDataUrl: () => (hasInk.current ? (canvasRef.current?.toDataURL("image/png") ?? null) : null),
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasInk.current = false;
        setTick((t) => t + 1);
      },
      isEmpty: () => !hasInk.current,
    }));

    return (
      <canvas
        ref={canvasRef}
        width={600}
        height={220}
        className={className ?? "w-full touch-none rounded-lg border border-line bg-white"}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    );
  },
);
