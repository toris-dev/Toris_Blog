"use client";

import {
  type AudioHTMLAttributes,
  type ImgHTMLAttributes,
  useEffect,
  useState,
} from "react";
import { fetchProtectedMedia } from "@/lib/api";

function isLocalSource(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("data:");
}

function useProtectedSource(
  src: string,
  enabled = true,
  reloadKey = 0,
): {
  resolvedSrc: string | undefined;
  loading: boolean;
  error: boolean;
} {
  const direct = isLocalSource(src);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(
    direct ? src : undefined,
  );
  const [loading, setLoading] = useState(!direct && enabled);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isLocalSource(src)) {
      setResolvedSrc(src);
      setLoading(false);
      setError(false);
      return;
    }

    if (!enabled) {
      setResolvedSrc(undefined);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | undefined;
    setResolvedSrc(undefined);
    setLoading(true);
    setError(false);

    fetchProtectedMedia(src, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("보호 미디어를 불러오지 못했습니다", cause);
        setLoading(false);
        setError(true);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, reloadKey, src]);

  return { resolvedSrc, loading, error };
}

type ProtectedImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src: string;
};

export function ProtectedImage({
  src,
  alt,
  ...props
}: ProtectedImageProps) {
  const media = useProtectedSource(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={media.resolvedSrc}
      alt={alt}
      aria-busy={media.loading || undefined}
      data-media-error={media.error || undefined}
    />
  );
}

type ProtectedAudioProps = Omit<
  AudioHTMLAttributes<HTMLAudioElement>,
  "src"
> & {
  src: string;
};

export function ProtectedAudio({ src, ...props }: ProtectedAudioProps) {
  const [request, setRequest] = useState({
    src,
    requested: false,
    reloadKey: 0,
  });
  const direct = isLocalSource(src);
  const sourceMatches = request.src === src;
  const requested = direct || (sourceMatches && request.requested);
  const media = useProtectedSource(
    src,
    requested,
    sourceMatches ? request.reloadKey : 0,
  );
  const accessibleName =
    typeof props["aria-label"] === "string" ? props["aria-label"] : "음성";

  useEffect(() => {
    if (!sourceMatches) {
      setRequest({ src, requested: false, reloadKey: 0 });
    }
  }, [sourceMatches, src]);

  function requestAudio() {
    setRequest((current) => ({
      src,
      requested: true,
      reloadKey: current.src === src ? current.reloadKey + 1 : 1,
    }));
  }

  if (!requested) {
    return (
      <button
        type="button"
        onClick={requestAudio}
        className={`btn-ghost tap-target rounded-lg px-3 py-2 text-sm ${props.className ?? ""}`}
        aria-label={`${accessibleName} 불러오기`}
      >
        음성 불러오기
      </button>
    );
  }

  if (media.loading) {
    return (
      <p
        role="status"
        className={`rounded-lg bg-bg-2 px-3 py-2 text-sm text-muted ${props.className ?? ""}`}
      >
        음성을 불러오는 중…
      </p>
    );
  }

  if (media.error) {
    return (
      <div
        role="alert"
        data-media-error
        className={`flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 ${props.className ?? ""}`}
      >
        <span>음성을 불러오지 못했습니다.</span>
        <button
          type="button"
          onClick={requestAudio}
          className="tap-target shrink-0 font-medium text-primary hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <audio
      {...props}
      src={media.resolvedSrc}
      aria-busy={media.loading || undefined}
      data-media-error={media.error || undefined}
    />
  );
}
