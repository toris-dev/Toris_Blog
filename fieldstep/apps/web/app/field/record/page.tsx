"use client";

import {
  createStoredFieldRecordDraft,
  fieldRecordSubmitIssues,
  parseStoredFieldRecordDraft,
  shouldRestoreFieldRecordDraft,
  type ChecklistItem,
  type FieldRecordDraftPayload,
  type FieldUploadState,
  type PhotoKind,
} from "@fieldstep/shared";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ProtectedAudio, ProtectedImage } from "@/components/ProtectedMedia";
import {
  api,
  readFieldRecordDraft,
  removeFieldRecordDraft,
  writeFieldRecordDraft,
} from "@/lib/api";

type Detail = Awaited<ReturnType<typeof api.workOrders.get>>;
type Part = FieldRecordDraftPayload["parts"][number];
type PhotoUpload = {
  id: string;
  idempotencyKey: string;
  name: string;
  kind: PhotoKind;
  blob: Blob;
  progress: number;
  status: "uploading" | "failed" | "saved";
  error?: string;
};
type PendingAudio = {
  blob: Blob;
  durationSeconds: number;
  idempotencyKey: string;
};

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.7;
const MAX_PHOTOS = 20;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 600;

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "safety", label: "안전 조치와 작업 허가 확인", checked: false },
  { id: "operation", label: "작업 후 정상 작동 확인", checked: false },
  { id: "cleanup", label: "주변 정리와 인수인계 확인", checked: false },
];

const AUDIO_FORMATS = [
  { recorderMimeType: "audio/webm;codecs=opus", uploadMimeType: "audio/webm" },
  { recorderMimeType: "audio/webm", uploadMimeType: "audio/webm" },
  { recorderMimeType: "audio/mp4", uploadMimeType: "audio/mp4" },
] as const;

function makeIdempotencyKey(prefix: "photo" | "audio"): string {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}:${random}`;
}

function prepareParts(parts: Part[]): Part[] {
  return parts
    .filter((part) => part.name.trim() && part.unit.trim())
    .map((part) => ({
      ...part,
      name: part.name.trim(),
      model: part.model?.trim() || undefined,
      unit: part.unit.trim(),
    }));
}

function toServerPayload(payload: FieldRecordDraftPayload) {
  return {
    ...payload,
    parts: prepareParts(payload.parts),
    checklist: payload.checklist
      .filter((item) => item.label.trim())
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        note: item.note?.trim() || undefined,
      })),
  };
}

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("이미지를 처리하지 못했습니다"));
    };
    img.onload = () => {
      URL.revokeObjectURL(sourceUrl);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("캔버스를 사용할 수 없습니다"));
        return;
      }
      context.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("이미지를 압축하지 못했습니다")),
        "image/jpeg",
        JPEG_QUALITY,
      );
    };
    img.src = sourceUrl;
  });
}

function RecordContentForWorkOrder({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [recovered, setRecovered] = useState(false);

  const [workSummary, setWorkSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [checklist, setChecklist] =
    useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [issues, setIssues] = useState("");
  const [notes, setNotes] = useState("");
  const [nextInspectionDate, setNextInspectionDate] = useState("");
  const [photoTab, setPhotoTab] = useState<PhotoKind>("before");
  const [photoUploads, setPhotoUploads] = useState<PhotoUpload[]>([]);

  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioUploadState, setAudioUploadState] = useState<
    "idle" | "uploading" | "saved" | "error"
  >("idle");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [deletingAudioId, setDeletingAudioId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingPausedAtRef = useRef<number | null>(null);
  const recordingPausedMsRef = useRef(0);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAudioRef = useRef<PendingAudio | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const loaded = useRef(false);
  const revisionRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPayload: FieldRecordDraftPayload = {
    workSummary,
    transcript,
    parts,
    checklist,
    issues,
    notes,
    nextInspectionDate: nextInspectionDate || null,
  };
  const payloadJson = JSON.stringify(currentPayload);

  useEffect(() => {
    if (!id) return;
    api.workOrders
      .get(id)
      .then((next) => {
        setData(next);
        const serverPayload: FieldRecordDraftPayload = {
          workSummary: next.fieldRecord?.workSummary ?? "",
          transcript: next.fieldRecord?.transcript ?? "",
          parts: next.fieldRecord?.parts ?? [],
          checklist:
            next.fieldRecord?.checklist?.length
              ? next.fieldRecord.checklist
              : DEFAULT_CHECKLIST,
          issues: next.fieldRecord?.issues ?? "",
          notes: next.fieldRecord?.notes ?? "",
          nextInspectionDate: next.fieldRecord?.nextInspectionDate ?? null,
        };
        const local = parseStoredFieldRecordDraft(
          readFieldRecordDraft(id),
          id,
        );
        const payload =
          local &&
          shouldRestoreFieldRecordDraft(
            local,
            next.fieldRecord?.updatedAt,
          )
            ? local.payload
            : serverPayload;
        setWorkSummary(payload.workSummary);
        setTranscript(payload.transcript);
        setParts(payload.parts);
        setChecklist(
          payload.checklist.length ? payload.checklist : DEFAULT_CHECKLIST,
        );
        setIssues(payload.issues);
        setNotes(payload.notes);
        setNextInspectionDate(payload.nextInspectionDate ?? "");
        setRecovered(payload === local?.payload);
        loaded.current = true;
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : "불러오기에 실패했습니다",
        ),
      );
  }, [id]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
  }, [playbackUrl]);

  useEffect(() => {
    if (!loaded.current || !id) return;
    revisionRef.current += 1;
    const stored = createStoredFieldRecordDraft(
      id,
      currentPayload,
      new Date().toISOString(),
    );
    writeFieldRecordDraft(id, JSON.stringify(stored));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, payloadJson]);

  // 3초 debounce 서버 저장. 네트워크 실패 시 같은 payload를 5초 간격으로 재시도한다.
  useEffect(() => {
    if (!loaded.current || !id) return;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    const revision = revisionRef.current;
    const payload = toServerPayload(currentPayload);
    setSaveState("saving");
    const attemptSave = () => {
      api.workOrders
        .putFieldRecord(id, payload)
        .then(() => {
          setSaveState("saved");
          if (revision === revisionRef.current) {
            removeFieldRecordDraft(id);
          }
        })
        .catch(() => {
          setSaveState("error");
          retryTimerRef.current = setTimeout(attemptSave, 5000);
        });
    };
    const timer = setTimeout(attemptSave, 3000);
    return () => {
      clearTimeout(timer);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, payloadJson]);

  // 탭 전환·브라우저 종료 직전에는 localStorage를 먼저 남기고 keepalive 저장을 시도한다.
  useEffect(() => {
    if (!loaded.current || !id) return;
    const flush = () => {
      const stored = createStoredFieldRecordDraft(
        id,
        currentPayload,
        new Date().toISOString(),
      );
      writeFieldRecordDraft(id, JSON.stringify(stored));
      void api.workOrders.flushFieldRecord(id, toServerPayload(currentPayload));
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, payloadJson]);

  const refreshMedia = useCallback(() => {
    api.workOrders.get(id).then(setData).catch(() => undefined);
  }, [id]);

  async function performPhotoUpload(upload: PhotoUpload) {
    setPhotoUploads((current) =>
      current.map((item) =>
        item.id === upload.id
          ? { ...item, status: "uploading", error: undefined }
          : item,
      ),
    );
    try {
      const { photo } = await api.workOrders.addPhoto(id, {
        kind: upload.kind,
        blob: upload.blob,
        idempotencyKey: upload.idempotencyKey,
        onProgress: (progress) =>
          setPhotoUploads((current) =>
            current.map((item) =>
              item.id === upload.id ? { ...item, progress } : item,
            ),
          ),
      });
      setData((current) =>
        current
          ? {
              ...current,
              photos: current.photos.some((item) => item.id === photo.id)
                ? current.photos
                : [...current.photos, photo],
            }
          : current,
      );
      setPhotoUploads((current) =>
        current.map((item) =>
          item.id === upload.id
            ? { ...item, progress: 100, status: "saved" }
            : item,
        ),
      );
    } catch (cause) {
      setPhotoUploads((current) =>
        current.map((item) =>
          item.id === upload.id
            ? {
                ...item,
                status: "failed",
                error:
                  cause instanceof Error
                    ? cause.message
                    : "사진 저장에 실패했습니다",
              }
            : item,
        ),
      );
    }
  }

  async function addPhotos(files: File[]) {
    const activeUploads = photoUploads.filter(
      (item) => item.status !== "saved",
    ).length;
    const remaining = Math.max(
      0,
      MAX_PHOTOS - (data?.photos.length ?? 0) - activeUploads,
    );
    if (remaining === 0) {
      setError(`사진은 작업당 최대 ${MAX_PHOTOS}장까지 등록할 수 있습니다`);
      return;
    }
    const accepted = files.slice(0, remaining);
    if (accepted.length < files.length) {
      setError(`최대 ${MAX_PHOTOS}장까지만 선택한 순서대로 업로드합니다`);
    }
    for (const file of accepted) {
      try {
        const blob = await compressImage(file);
        const upload: PhotoUpload = {
          id: makeIdempotencyKey("photo"),
          idempotencyKey: makeIdempotencyKey("photo"),
          name: file.name,
          kind: photoTab,
          blob,
          progress: 0,
          status: "uploading",
        };
        setPhotoUploads((current) => [...current, upload]);
        void performPhotoUpload(upload);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "사진 처리에 실패했습니다",
        );
      }
    }
  }

  async function deletePhoto(photoId: string) {
    try {
      await api.workOrders.deletePhoto(id, photoId);
      setData((current) =>
        current
          ? {
              ...current,
              photos: current.photos.filter((photo) => photo.id !== photoId),
            }
          : current,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "사진 삭제에 실패했습니다");
    }
  }

  async function uploadAudio(pending: PendingAudio) {
    if (pending.blob.size > MAX_AUDIO_BYTES) {
      setAudioUploadState("error");
      setAudioError("녹음 파일이 25MB를 초과했습니다. 더 짧게 나누어 녹음해주세요.");
      return;
    }
    setAudioUploadState("uploading");
    setAudioProgress(0);
    setAudioError(null);
    try {
      const { audio } = await api.workOrders.addAudio(id, {
        blob: pending.blob,
        durationSeconds: pending.durationSeconds,
        idempotencyKey: pending.idempotencyKey,
        onProgress: setAudioProgress,
      });
      setData((current) =>
        current
          ? {
              ...current,
              audio: current.audio.some((item) => item.id === audio.id)
                ? current.audio
                : [...current.audio, audio],
            }
          : current,
      );
      pendingAudioRef.current = null;
      setAudioProgress(100);
      setAudioUploadState("saved");
    } catch (cause) {
      setAudioUploadState("error");
      setAudioError(
        cause instanceof Error ? cause.message : "음성 메모 저장에 실패했습니다",
      );
    }
  }

  async function startRecording() {
    if (mediaRecorderRef.current || pendingAudioRef.current) return;
    setAudioError(null);
    setAudioUploadState("idle");
    let acquiredStream: MediaStream | null = null;
    try {
      if (
        typeof MediaRecorder === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error("이 브라우저에서는 음성 녹음을 사용할 수 없습니다");
      }
      const format = AUDIO_FORMATS.find(({ recorderMimeType }) =>
        MediaRecorder.isTypeSupported(recorderMimeType),
      );
      if (!format) {
        throw new Error("이 브라우저에서 지원되는 녹음 형식을 찾지 못했습니다");
      }
      acquiredStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const stream = acquiredStream;
      const recorder = new MediaRecorder(stream, {
        mimeType: format.recorderMimeType,
      });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      recordingPausedMsRef.current = 0;
      recordingPausedAtRef.current = null;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        const now = Date.now();
        const currentPauseMs = recordingPausedAtRef.current
          ? now - recordingPausedAtRef.current
          : 0;
        const durationSeconds = Math.min(
          MAX_AUDIO_SECONDS,
          Math.max(
            1,
            Math.round(
              (now -
                (recordingStartedAtRef.current ?? now) -
                recordingPausedMsRef.current -
                currentPauseMs) /
                1000,
            ),
          ),
        );
        const blob = new Blob(chunksRef.current, {
          type: format.uploadMimeType,
        });
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingStartedAtRef.current = null;
        recordingPausedAtRef.current = null;
        recordingPausedMsRef.current = 0;
        setRecording(false);
        setRecordingPaused(false);
        if (blob.size === 0) {
          setAudioUploadState("error");
          setAudioError("녹음된 음성이 없습니다. 다시 녹음해주세요.");
          return;
        }
        setPlaybackUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
        const pending: PendingAudio = {
          blob,
          durationSeconds,
          idempotencyKey: makeIdempotencyKey("audio"),
        };
        pendingAudioRef.current = pending;
        void uploadAudio(pending);
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setAudioUploadState("error");
        setAudioError("녹음 중 오류가 발생했습니다. 텍스트로 대체하거나 다시 시도해주세요.");
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordingStartedAtRef.current = null;
        setRecording(false);
        setRecordingPaused(false);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      recordingTimerRef.current = setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, MAX_AUDIO_SECONDS * 1000);
      setRecording(true);
      setRecordingPaused(false);
    } catch (cause) {
      acquiredStream?.getTracks().forEach((track) => track.stop());
      setAudioUploadState("error");
      setAudioError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "마이크 접근 권한을 허용해주세요. 권한 없이도 전사 텍스트를 직접 입력할 수 있습니다."
          : cause instanceof DOMException && cause.name === "NotFoundError"
            ? "사용할 수 있는 마이크를 찾지 못했습니다. 전사 텍스트를 직접 입력해주세요."
            : cause instanceof Error
              ? cause.message
              : "마이크 접근 권한이 필요합니다",
      );
    }
  }

  function pauseRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state !== "recording") return;
    recorder.pause();
    recordingPausedAtRef.current = Date.now();
    setRecordingPaused(true);
  }

  function resumeRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state !== "paused") return;
    recorder.resume();
    if (recordingPausedAtRef.current) {
      recordingPausedMsRef.current += Date.now() - recordingPausedAtRef.current;
    }
    recordingPausedAtRef.current = null;
    setRecordingPaused(false);
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function discardPendingAudio() {
    pendingAudioRef.current = null;
    setAudioUploadState("idle");
    setAudioProgress(0);
    setAudioError(null);
    setPlaybackUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  async function deleteAudio(audioId: string) {
    setDeletingAudioId(audioId);
    setAudioError(null);
    try {
      await api.workOrders.deleteAudio(id, audioId);
      setData((current) =>
        current
          ? {
              ...current,
              audio: current.audio.filter((audio) => audio.id !== audioId),
            }
          : current,
      );
    } catch (cause) {
      setAudioError(
        cause instanceof Error ? cause.message : "음성 메모 삭제에 실패했습니다",
      );
    } finally {
      setDeletingAudioId(null);
    }
  }

  function addPart() {
    setParts((current) => [
      ...current,
      { name: "", quantity: 1, unit: "개" },
    ]);
  }

  function updatePart(index: number, patch: Partial<Part>) {
    setParts((current) =>
      current.map((part, currentIndex) =>
        currentIndex === index ? { ...part, ...patch } : part,
      ),
    );
  }

  function addChecklistItem() {
    setChecklist((current) => [
      ...current,
      {
        id: `custom-${Date.now()}-${current.length}`,
        label: "",
        checked: false,
      },
    ]);
  }

  function updateChecklistItem(
    index: number,
    patch: Partial<ChecklistItem>,
  ) {
    setChecklist((current) =>
      current.map((item, currentIndex) =>
        currentIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  const photos = data?.photos ?? [];
  const audioMemos = data?.audio ?? [];
  const photoUploading = photoUploads.some(
    (item) => item.status === "uploading",
  );
  const photoFailed = photoUploads.some((item) => item.status === "failed");
  const uploadState: FieldUploadState = recording
    ? "recording"
    : photoUploading || audioUploadState === "uploading"
      ? "uploading"
      : photoFailed ||
          (audioUploadState === "error" && !!pendingAudioRef.current)
        ? "failed"
        : "idle";
  const missing = fieldRecordSubmitIssues({
    payload: currentPayload,
    photoCount: photos.length,
    uploadState,
  });

  async function doSubmit() {
    if (missing.length > 0) {
      setError("누락되거나 저장 실패한 항목을 확인해주세요");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.workOrders.putFieldRecord(id, toServerPayload(currentPayload));
      await api.workOrders.submit(id);
      removeFieldRecordDraft(id);
      router.push("/field");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "제출에 실패했습니다");
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold">{data.workOrder.workType}</h1>
        <span
          role="status"
          className={`text-xs ${saveState === "error" ? "text-red-600" : "text-muted"}`}
        >
          {saveState === "saving"
            ? "저장 중…"
            : saveState === "saved"
              ? "자동저장됨"
              : saveState === "error"
                ? "로컬 보관됨 · 서버 재시도 중"
                : ""}
        </span>
      </div>
      <p className="text-sm text-ink-dim">
        {data.customer.name} / {data.site.name}
      </p>

      {recovered && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>브라우저에 남아 있던 최신 미저장 기록을 복구했습니다.</span>
          <button
            type="button"
            onClick={() => setRecovered(false)}
            className="shrink-0 underline"
          >
            확인
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="card mt-4 space-y-2 p-4 text-sm">
        <p className="font-semibold">작업 상세</p>
        {data.workOrder.request && (
          <p>
            <span className="text-muted">요청사항</span>{" "}
            {data.workOrder.request}
          </p>
        )}
        {data.site.address && (
          <p>
            <span className="text-muted">주소</span> {data.site.address}
          </p>
        )}
        {data.site.accessInfo && (
          <p>
            <span className="text-muted">출입정보</span> {data.site.accessInfo}
          </p>
        )}
        {(data.customer.contactName || data.customer.contactPhone) && (
          <p>
            <span className="text-muted">현장 연락</span>{" "}
            {[data.customer.contactName, data.customer.contactPhone]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-dim">사진</p>
          <p className="text-xs text-muted">
            {photos.length + photoUploads.filter((item) => item.status !== "saved").length}
            /{MAX_PHOTOS}
          </p>
        </div>
        <div className="flex gap-2">
          {(["before", "after", "other"] as PhotoKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setPhotoTab(kind)}
              className={`tap-target rounded-lg px-3 py-2 text-sm ${
                photoTab === kind ? "bg-primary text-white" : "btn-ghost"
              }`}
            >
              {kind === "before" ? "작업 전" : kind === "after" ? "작업 후" : "기타"}
            </button>
          ))}
        </div>
        <label
          className={`tap-target flex w-full items-center justify-center rounded-lg border border-dashed border-line py-4 text-sm text-primary ${
            photos.length >= MAX_PHOTOS ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          + 사진 촬영·선택
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            disabled={photos.length >= MAX_PHOTOS}
            className="hidden"
            onChange={(event) => {
              const files = [...(event.target.files ?? [])];
              if (files.length) void addPhotos(files);
              event.target.value = "";
            }}
          />
        </label>
        {photoUploads.length > 0 && (
          <div className="space-y-2" aria-live="polite">
            {photoUploads.map((upload) => (
              <div
                key={upload.id}
                className="rounded-lg border border-line bg-bg-2 p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{upload.name}</span>
                  <span
                    className={
                      upload.status === "failed"
                        ? "text-red-600"
                        : upload.status === "saved"
                          ? "text-done"
                          : "text-primary"
                    }
                  >
                    {upload.status === "failed"
                      ? "실패"
                      : upload.status === "saved"
                        ? "저장됨"
                        : `${upload.progress}%`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full ${
                      upload.status === "failed" ? "bg-red-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.max(4, upload.progress)}%` }}
                  />
                </div>
                {upload.error && (
                  <p className="mt-2 text-red-600">{upload.error}</p>
                )}
                {upload.status === "failed" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void performPhotoUpload(upload)}
                      className="rounded border border-line bg-white px-3 py-2 font-medium"
                    >
                      같은 파일 재시도
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoUploads((current) =>
                          current.filter((item) => item.id !== upload.id),
                        )
                      }
                      className="rounded px-3 py-2 text-muted"
                    >
                      버리기
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <ProtectedImage
                src={photo.url}
                alt={photo.caption ?? photo.kind}
                className="aspect-square w-full rounded object-cover"
              />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {photo.kind === "before" ? "전" : photo.kind === "after" ? "후" : "기타"}
              </span>
              <button
                type="button"
                onClick={() => void deletePhoto(photo.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                aria-label="사진 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <div>
          <p className="text-sm font-medium text-ink-dim">음성 메모 원본</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            원본은 비공개로 보존합니다. 외부 STT는 연결하지 않았으므로 전사
            텍스트를 직접 입력해주세요. 녹음은 최대 10분입니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!recording ? (
            <button
              type="button"
              onClick={() => void startRecording()}
              disabled={
                audioUploadState === "uploading" || !!pendingAudioRef.current
              }
              className="btn-ghost tap-target rounded-lg px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              녹음 시작
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={recordingPaused ? resumeRecording : pauseRecording}
                className="btn-ghost tap-target rounded-lg px-4 py-2 text-sm"
              >
                {recordingPaused ? "녹음 계속" : "일시정지"}
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="btn-danger tap-target rounded-lg px-4 py-2 text-sm"
              >
                정지·저장
              </button>
            </>
          )}
          {playbackUrl && (
            <audio
              controls
              preload="metadata"
              src={playbackUrl}
              className="h-10 min-w-0 flex-1"
              aria-label="방금 녹음한 음성 미리듣기"
            />
          )}
        </div>
        {recording && (
          <p role="status" className="text-xs font-medium text-red-600">
            {recordingPaused
              ? "녹음 일시정지됨"
              : "녹음 중… 정지하면 원본 저장을 시작합니다."}
          </p>
        )}
        {audioUploadState === "uploading" && (
          <div role="status" className="text-xs text-primary">
            <p>음성 원본 저장 중… {audioProgress}%</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(4, audioProgress)}%` }}
              />
            </div>
          </div>
        )}
        {audioUploadState === "saved" && (
          <p role="status" className="text-xs text-done">
            음성 원본이 저장되었습니다.
          </p>
        )}
        {audioError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            <p>{audioError}</p>
            {pendingAudioRef.current && audioUploadState === "error" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const pending = pendingAudioRef.current;
                    if (pending) void uploadAudio(pending);
                  }}
                  className="rounded-md border border-red-300 bg-white px-3 py-2 font-medium"
                >
                  같은 녹음 재시도
                </button>
                <button
                  type="button"
                  onClick={discardPendingAudio}
                  className="rounded-md px-3 py-2 font-medium"
                >
                  원본 버리고 텍스트로 대체
                </button>
              </div>
            )}
          </div>
        )}
        {audioMemos.length > 0 && (
          <div className="space-y-2 border-t border-line pt-3">
            <p className="text-xs font-medium text-ink-dim">
              저장된 음성 {audioMemos.length}개
            </p>
            {audioMemos.map((audio, index) => (
              <div
                key={audio.id}
                className="rounded-lg border border-line bg-bg-2 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {audio.caption || `음성 메모 ${index + 1}`}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {audio.durationSeconds ? `${audio.durationSeconds}초 · ` : ""}
                      수동 전사
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteAudio(audio.id)}
                    disabled={deletingAudioId === audio.id}
                    className="btn-ghost tap-target shrink-0 rounded-lg px-3 py-2 text-xs disabled:opacity-50"
                  >
                    {deletingAudioId === audio.id ? "삭제 중…" : "삭제"}
                  </button>
                </div>
                <ProtectedAudio
                  controls
                  preload="metadata"
                  src={audio.url}
                  className="mt-2 h-10 w-full"
                  aria-label={`저장된 음성 메모 ${index + 1}`}
                />
              </div>
            ))}
          </div>
        )}
        <label className="flex flex-col gap-1 text-sm">
          전사 텍스트 (직접 입력)
          <textarea
            className="input min-h-24"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          작업 요약
          <input
            className="input"
            value={workSummary}
            onChange={(event) => setWorkSummary(event.target.value)}
          />
        </label>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-dim">현장 체크리스트</p>
          <button
            type="button"
            onClick={addChecklistItem}
            className="text-sm text-primary hover:underline"
          >
            + 항목 추가
          </button>
        </div>
        {checklist.map((item, index) => (
          <div key={item.id} className="rounded-lg border border-line p-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(event) =>
                  updateChecklistItem(index, { checked: event.target.checked })
                }
                className="mt-3 h-5 w-5 accent-primary"
                aria-label={`${item.label || `체크리스트 ${index + 1}`} 완료`}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className="input w-full"
                  value={item.label}
                  placeholder="확인 항목"
                  onChange={(event) =>
                    updateChecklistItem(index, { label: event.target.value })
                  }
                />
                <input
                  className="input w-full text-sm"
                  value={item.note ?? ""}
                  placeholder="비고 (선택)"
                  onChange={(event) =>
                    updateChecklistItem(index, {
                      note: event.target.value || undefined,
                    })
                  }
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setChecklist((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
                className="btn-ghost tap-target rounded-lg px-3 text-sm"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="card mt-4 space-y-2 p-4">
        <p className="text-sm font-medium text-ink-dim">사용 부품</p>
        {parts.map((part, index) => (
          <div key={index} className="flex flex-wrap gap-2">
            <input
              className="input min-w-32 flex-1"
              placeholder="이름"
              value={part.name}
              onChange={(event) =>
                updatePart(index, { name: event.target.value })
              }
            />
            <input
              className="input w-24"
              placeholder="모델"
              value={part.model ?? ""}
              onChange={(event) =>
                updatePart(index, {
                  model: event.target.value || undefined,
                })
              }
            />
            <input
              type="number"
              min="0.000001"
              step="any"
              inputMode="decimal"
              className="input w-24"
              aria-label={`부품 ${index + 1} 수량`}
              value={part.quantity}
              onChange={(event) =>
                updatePart(index, { quantity: Number(event.target.value) })
              }
            />
            <input
              className="input w-16"
              aria-label={`부품 ${index + 1} 단위`}
              value={part.unit}
              onChange={(event) =>
                updatePart(index, { unit: event.target.value })
              }
            />
            <button
              type="button"
              onClick={() =>
                setParts((current) =>
                  current.filter((_, currentIndex) => currentIndex !== index),
                )
              }
              className="btn-ghost tap-target rounded-lg px-3 text-sm"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPart}
          className="text-sm text-primary hover:underline"
        >
          + 부품 추가
        </button>
      </section>

      <section className="card mt-4 space-y-3 p-4">
        <label className="flex flex-col gap-1 text-sm">
          특이사항
          <textarea
            className="input min-h-20"
            value={issues}
            onChange={(event) => setIssues(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          현장 메모
          <textarea
            className="input min-h-16"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          다음 점검일
          <input
            type="date"
            className="input"
            value={nextInspectionDate}
            onChange={(event) => setNextInspectionDate(event.target.value)}
          />
        </label>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card p-4">
        <button
          type="button"
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
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-done">
                사진·기록·미디어 저장이 모두 완료되었습니다.
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => void doSubmit()}
                disabled={submitting || missing.length > 0}
                className="btn-primary tap-target flex-1 rounded-lg py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "제출 중…"
                  : missing.length > 0
                    ? "누락 항목 확인"
                    : "확인 후 제출"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="btn-ghost tap-target rounded-lg px-4 py-3"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordContent() {
  const id = useSearchParams().get("id") ?? "";
  return <RecordContentForWorkOrder key={id} id={id} />;
}

export default function FieldRecordPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}
    >
      <RecordContent />
    </Suspense>
  );
}
