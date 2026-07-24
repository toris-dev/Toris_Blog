"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, fetchApiBlob } from "@/lib/api";

function PrintContent() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const requestedVersion = params.get("v");
  const signed = params.get("signed") === "1";
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("fieldstep-report.pdf");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setPdfUrl(null);
    if (!id) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const detail = await api.workOrders.get(id);
        const version = requestedVersion
          ? detail.reportVersions.find(
              (item) => String(item.version) === requestedVersion,
            )
          : detail.reportVersions.at(-1);
        if (!version) throw new Error("확정된 보고서 버전을 찾을 수 없습니다");
        const artifact = signed ? version.signedArtifact : version.artifact;
        if (artifact?.status !== "ready" || !artifact.pdfUrl) {
          throw new Error(
            signed
              ? "서명 PDF가 아직 준비되지 않았습니다"
              : "승인 PDF가 아직 준비되지 않았습니다",
          );
        }
        const blob = await fetchApiBlob(artifact.pdfUrl);
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setFilename(
          `${version.reportNumber}-v${version.version}${
            signed ? "-signed" : ""
          }.pdf`,
        );
        setPdfUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "PDF를 불러오지 못했습니다",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, requestedVersion, signed]);

  if (!id) return <p className="p-8 text-sm text-red-600">작업 id가 없습니다.</p>;
  if (error) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <div className="card p-6">
          <h1 className="font-bold">PDF를 열 수 없습니다</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link
            href={`/app/work/detail?id=${encodeURIComponent(id)}`}
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            작업 상세에서 PDF 상태 확인
          </Link>
        </div>
      </main>
    );
  }
  if (!pdfUrl) {
    return (
      <main role="status" className="p-8 text-center text-muted">
        불변 PDF를 안전하게 불러오는 중…
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
        <div>
          <h1 className="font-semibold">
            {signed ? "고객 서명 완료 PDF" : "고객 승인용 PDF"}
          </h1>
          <p className="text-xs text-muted">{filename}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/work/detail?id=${encodeURIComponent(id)}`}
            className="btn-ghost rounded-lg px-3 py-2 text-sm"
          >
            작업으로
          </Link>
          <a
            href={pdfUrl}
            download={filename}
            className="btn-primary rounded-lg px-3 py-2 text-sm"
          >
            PDF 다운로드
          </a>
        </div>
      </header>
      <iframe
        title={signed ? "고객 서명 완료 보고서 PDF" : "고객 승인용 보고서 PDF"}
        src={pdfUrl}
        className="min-h-[calc(100dvh-73px)] w-full flex-1 border-0 bg-white"
      />
    </main>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <PrintContent />
    </Suspense>
  );
}
