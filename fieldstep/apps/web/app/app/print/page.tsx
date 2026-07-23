"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";

type Detail = Awaited<ReturnType<typeof api.workOrders.get>>;
type Snapshot = Awaited<ReturnType<typeof api.workOrders.reportVersion>>["reportVersion"];

function PrintContent() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const v = params.get("v");
  const [data, setData] = useState<Detail | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const detail = await api.workOrders.get(id);
        setData(detail);
        const meta = v
          ? detail.reportVersions.find((r) => String(r.version) === v)
          : detail.reportVersions.at(-1);
        if (meta) {
          const { reportVersion } = await api.workOrders.reportVersion(id, meta.version);
          setSnapshot(reportVersion);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "불러오기에 실패했습니다");
      }
    })();
  }, [id, v]);

  if (!id) return <p className="p-8 text-sm text-red-600">작업 id가 없습니다</p>;
  if (error) return <p className="p-8 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="p-8 text-muted">불러오는 중…</p>;

  const { workOrder, customer, site, asset, assignees, approval } = data;
  // 확정 버전이 있으면 불변 스냅샷을, 없으면(확정 전 미리보기) 라이브 초안을 렌더한다.
  const s = snapshot?.structured ?? data.draft;
  const photos = snapshot?.photos ?? data.photos;
  const signature = snapshot?.signature ?? null;
  const isPreview = !snapshot;
  const before = photos.filter((p) => p.kind === "before");
  const after = photos.filter((p) => p.kind === "after");
  const other = photos.filter((p) => p.kind === "other");

  return (
    <div className="min-h-dvh bg-bg-2 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        {isPreview ? (
          <p className="text-xs text-muted">확정 전 미리보기 — 보고서 확정 후 버전이 고정됩니다</p>
        ) : (
          <p className="text-xs text-muted">
            확정본 v{snapshot.version}{snapshot.lockedAt ? " · 서명 완료(잠금)" : ""}
          </p>
        )}
        <button onClick={() => window.print()} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium">
          인쇄
        </button>
      </div>

      <div className="print-sheet mx-auto max-w-[210mm] bg-white p-[14mm] text-sm text-ink shadow print:shadow-none">
        <header className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <h1 className="text-lg font-bold">작업완료보고서</h1>
            <p className="mt-1 text-muted">
              보고서 번호: {snapshot?.reportNumber ?? "-"} (v{snapshot?.version ?? "미확정"})
            </p>
          </div>
          <div className="text-right text-muted">
            <p>작업일: {workOrder.scheduledDate}</p>
            {snapshot && <p className="mt-1 text-xs">확정일시: {snapshot.createdAt.slice(0, 16).replace("T", " ")}</p>}
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1">
          <p>
            <span className="text-muted">고객</span> {customer.name}
          </p>
          <p>
            <span className="text-muted">현장</span> {site.name}
          </p>
          <p>
            <span className="text-muted">장비</span> {asset?.name ?? "-"}
          </p>
          <p>
            <span className="text-muted">작업자</span> {assignees.map((a) => a.name).join(", ") || "-"}
          </p>
        </section>

        {s && (
          <>
            <section className="mt-6">
              <h2 className="font-semibold">작업 요약</h2>
              <p className="mt-1">{s.workSummary || "-"}</p>
            </section>
            {s.actions.length > 0 && (
              <section className="mt-4">
                <h2 className="font-semibold">조치 사항</h2>
                <ul className="mt-1 list-disc pl-5">
                  {s.actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}
            {s.issues.length > 0 && (
              <section className="mt-4">
                <h2 className="font-semibold">문제 사항</h2>
                <ul className="mt-1 list-disc pl-5">
                  {s.issues.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}
            {s.recommendations.length > 0 && (
              <section className="mt-4">
                <h2 className="font-semibold">권고 사항</h2>
                <ul className="mt-1 list-disc pl-5">
                  {s.recommendations.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}
            {s.usedParts.length > 0 && (
              <section className="mt-4">
                <h2 className="font-semibold">부품표</h2>
                <table className="mt-1 w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="py-1">품명</th>
                      <th className="py-1">모델</th>
                      <th className="py-1">수량</th>
                      <th className="py-1">단위</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.usedParts.map((p, i) => (
                      <tr key={i} className="border-b border-line">
                        <td className="py-1">{p.name}</td>
                        <td className="py-1">{p.model ?? "-"}</td>
                        <td className="py-1">{p.quantity}</td>
                        <td className="py-1">{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}

        {(before.length > 0 || after.length > 0 || other.length > 0) && (
          <section className="mt-4">
            <h2 className="font-semibold">사진</h2>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {[...before, ...after, ...other].map((p) => (
                <figure key={p.id} className="break-inside-avoid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption ?? p.kind} className="aspect-video w-full rounded object-cover" />
                  <figcaption className="mt-1 text-xs text-muted">
                    {p.kind === "before" ? "작업 전" : p.kind === "after" ? "작업 후" : "기타"}
                    {p.caption ? ` — ${p.caption}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 grid grid-cols-2 gap-8 border-t border-line pt-4">
          <div>
            <p className="text-muted">승인자</p>
            <p className="mt-1 font-medium">
              {signature?.name ?? approval?.approverName ?? "-"}{" "}
              {(signature?.title ?? approval?.approverTitle) ? `(${signature?.title ?? approval?.approverTitle})` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">승인 시각: {signature?.approvedAt ?? approval?.approvedAt ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted">서명</p>
            {signature ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signature.signatureDataUrl} alt="고객 서명" className="mt-1 h-16 w-40 rounded border border-line object-contain" />
            ) : (
              <div className="mt-1 h-16 w-40 rounded border border-line" />
            )}
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-muted">1 / 1</footer>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">불러오는 중…</div>}>
      <PrintContent />
    </Suspense>
  );
}
