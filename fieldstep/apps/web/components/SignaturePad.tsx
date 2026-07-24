"use client";

import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";

export interface SignaturePadHandle {
  toDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

export function createTypedSignatureDataUrl(value: string): string | null {
  const signature = value.trim();
  if (!signature || typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 220;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#1a1e24";
  context.textAlign = "center";
  context.textBaseline = "middle";

  let fontSize = 64;
  do {
    context.font = `600 ${fontSize}px "Pretendard", sans-serif`;
    fontSize -= 4;
  } while (context.measureText(signature).width > canvas.width - 80 && fontSize >= 28);

  context.fillText(signature, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL("image/png");
}

export const SignaturePad = forwardRef<SignaturePadHandle, { className?: string }>(
  function SignaturePad({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawing = useRef(false);
    const hasInk = useRef(false);
    const [, setTick] = useState(0);
    const instructionsId = useId();

    function clear() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasInk.current = false;
      setTick((tick) => tick + 1);
    }

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
      clear,
      isEmpty: () => !hasInk.current,
    }));

    return (
      <>
        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          role="img"
          tabIndex={0}
          aria-label="손글씨 서명 입력 영역"
          aria-describedby={instructionsId}
          aria-keyshortcuts="Delete Backspace"
          className={
            className ??
            "w-full touch-none rounded-lg border border-line bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          }
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onKeyDown={(event) => {
            if (event.key === "Delete" || event.key === "Backspace") {
              event.preventDefault();
              clear();
            }
          }}
        />
        <p id={instructionsId} className="sr-only">
          마우스나 터치로 서명하세요. Delete 또는 Backspace 키로 지울 수 있습니다. 키보드만
          사용하는 경우 이름으로 서명 방법을 선택하세요.
        </p>
      </>
    );
  },
);
