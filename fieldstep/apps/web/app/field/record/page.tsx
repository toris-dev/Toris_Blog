"use client";

import type { PhotoKind } from "@fieldstep/shared";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Detail = Awaited<ReturnType<typeof api.workOrders.get>>;
type Part = { name: string; model?: string; quantity: number; unit: string };

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.7;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 처리하지 못했습니다"));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("캔버스를 사용할 수 없습니다"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function RecordContent() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [workSummary, setWorkSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [issues, setIssues] = useState("");
  const [notes, setNotes] = useState("");
  const [nextInspectionDate, setNextInspectionDate] = useState("");
  const [photoTab, setPhotoTab] = useState<PhotoKind>("before");

  const [recording, setRecording] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loaded = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    api.workOrders
      .get(id)
      .then((d) => {
        setData(d);
        if (d.fieldRecord) {
          setWorkSummary(d.fieldRecord.workSummary ?? "");
          setTranscript(d.fieldRecord.transcript ?? "");
          setParts(d.fieldRecord.parts ?? []);
          setIssues(d.fieldRecord.issues ?? "");
          setNotes(d.fieldRecord.notes ?? "");
          setNextInspectionDate(d.fieldRecord.nextInspectionDate ?? "");
        }
        loaded.current = true;
      })
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기에 실패했습니다"));
  }, [id]);

  const refreshPhotos = useCallback(() => {
    api.workOrders.get(id).then(setData);
  }, [id]);

  // 3초 debounce 자동 임시저장 (실패 시 5초 후 자동 재시도)
  useEffect(() => {
    if (!loaded.current) return;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setSaveState("saving");
    const payload = { workSummary, transcript, parts, issues, notes, nextInspectionDate: nextInspectionDate || null };
    const attemptSave = () => {
      api.workOrders
        .putFieldRecord(id, payload)
        .then(() => setSaveState("saved"))
        .catch(() => {
          setSaveState("error");
          retryTimerRef.current = setTimeout(attemptSave, 5000);
        });
    };
    const t = setTimeout(attemptSave, 3000);
    return () => {
      clearTimeout(t);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workSummary, transcript, JSON.stringify(parts), issues, notes, nextInspectionDate, id]);

  async function addPhoto(file: File) {
    try {
      const dataUrl = await compressImage(file);
      await api.workOrders.addPhoto(id, { kind: photoTab, dataUrl });
      refreshPhotos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 처리에 실패했습니다");
    }
  }

  async function deletePhoto(photoId: string) {
    await api.workOrders.deletePhoto(id, photoId);
    refreshPhotos();
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setPlaybackUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setRecording(true);
    } catch {
      setError("마이크 접근 권한이 필요합니다");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function addPart() {
    setParts((p) => [...p, { name: "", quantity: 1, unit: "개" }]);
  }
  function updatePart(i: number, patch: Partial<Part>) {
    setParts((p) => p.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removePart(i: number) {
    setParts((p) => p.filter((_, idx) => idx !== i));
  }

  const photos = data?.photos ?? [];
  const missing: string[] = [];
  if (!transcript.trim() && !workSummary.trim()) missing.push("전사 텍스트 또는 작업 요약을 입력해주세요 (녹음은 업로드되지 않습니다)");
  if (photos.length === 0) missing.push("사진이 한 장도 없습니다");

  async function doSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.workOrders.putFieldRecord(id, {
        workSummary,
        transcript,
        parts,
        issues,
        notes,
        nextInspectionDate: nextInspectionDate || null,
      });
      await api.workOrders.submit(id);
      router.push("/field");
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했습니다");
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (!id) return <p className="text-sm text-red-600">작업 id가 없습니다</p>;
  if (error && !data) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-muted">불러오는 중…</p>;

  return (
    <div className="pb-28">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">{data.workOrder.workType}</h1>
        <span className={`text-xs ${saveState === "error" ? "text-red-600" : "text-muted"}`}>
          {saveState === "saving"
            ? "저장 중…"
            : saveState === "saved"
              ? "자동저장됨"
              : saveState === "error"
                ? "저장 실패 — 재시도 중"
                : ""}
        </span>
      </div>
      <p className="text-sm text-ink-dim">
        {data.customer.name} / {data.site.name}
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <section className="card mt-4 space-y-3 p-4">
        <p className="text-sm font-medium text-ink-dim">사진</p>
        <div className="flex gap-2">
          {(["before", "after", "other"] as PhotoKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setPhotoTab(k)}
              className={`tap-target rounded-lg px-3 py-2 text-sm ${photoTab === k ? "bg-primary text-white" : "btn-ghost"}`}
            >
              {k === "before" ? "전" : k === "after" ? "후" : "기타"}
            </button>
          ))}
        </div>
        <label className="tap-target flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-line py-4 text-sm text-primary">
          + 사진 추가
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void addPhoto(f);
              e.target.value = "";
            }}
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.kind} className="aspect-square w-full rounded object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {p.kind === "before" ? "전" : p.kind === "after" ? "후" : "기타"}
              </span>
              <button
                onClick={() => deletePhoto(p.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                aria-label="삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <p className="text-sm font-medium text-ink-dim">음성 메모 (녹음 → 재생만, 업로드되지 않음)</p>
        <div className="flex items-center gap-3">
          {!recording ? (
            <button onClick={startRecording} className="btn-ghost tap-target rounded-lg px-4 py-2 text-sm">
              🎙 녹음 시작
            </button>
          ) : (
            <button onClick={stopRecording} className="btn-danger tap-target rounded-lg px-4 py-2 text-sm">
              ■ 녹음 정지
            </button>
          )}
          {playbackUrl && <audio controls src={playbackUrl} className="h-9 flex-1" />}
        </div>
        <label className="flex flex-col gap-1 text-sm">
          전사 텍스트 (음성 대체 — 필수)
          <textarea className="input min-h-24" value={transcript} onChange={(e) => setTranscript(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          작업 요약 (선택)
          <input className="input" value={workSummary} onChange={(e) => setWorkSummary(e.target.value)} />
        </label>
      </section>

      <section className="card mt-4 space-y-2 p-4">
        <p className="text-sm font-medium text-ink-dim">사용 부품</p>
        {parts.map((p, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <input className="input flex-1" placeholder="이름" value={p.name} onChange={(e) => updatePart(i, { name: e.target.value })} />
            <input className="input w-20" placeholder="모델" value={p.model ?? ""} onChange={(e) => updatePart(i, { model: e.target.value })} />
            <input
              type="number"
              className="input w-16"
              value={p.quantity}
              onChange={(e) => updatePart(i, { quantity: Number(e.target.value) })}
            />
            <input className="input w-14" value={p.unit} onChange={(e) => updatePart(i, { unit: e.target.value })} />
            <button onClick={() => removePart(i)} className="btn-ghost tap-target rounded-lg px-3 text-sm">
              삭제
            </button>
          </div>
        ))}
        <button onClick={addPart} className="text-sm text-primary hover:underline">
          + 부품 추가
        </button>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <label className="flex flex-col gap-1 text-sm">
          특이사항
          <textarea className="input min-h-20" value={issues} onChange={(e) => setIssues(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          메모
          <textarea className="input min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          다음 점검일
          <input type="date" className="input" value={nextInspectionDate} onChange={(e) => setNextInspectionDate(e.target.value)} />
        </label>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card p-4">
        <button
          onClick={() => setConfirming(true)}
          className="btn-primary tap-target w-full rounded-lg py-3 text-base font-semibold"
        >
          제출하기
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="card w-full max-w-sm space-y-3 p-6">
            <h2 className="font-semibold">제출 전 확인</h2>
            {missing.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-done">누락된 항목이 없습니다.</p>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={doSubmit} disabled={submitting} className="btn-primary tap-target flex-1 rounded-lg py-3 font-medium">
                {submitting ? "제출 중…" : "확인 후 제출"}
              </button>
              <button onClick={() => setConfirming(false)} className="btn-ghost tap-target rounded-lg px-4 py-3">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FieldRecordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <RecordContent />
    </Suspense>
  );
}
