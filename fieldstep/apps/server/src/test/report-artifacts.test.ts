import { describe, expect, it } from "vitest";
import {
  REPORT_PDF_RENDERER_VERSION,
  computeReportSourceSha256,
  computeSignedReportSourceSha256,
  createImmutableReportPdfKey,
  getPrivatePdfArtifactResponse,
  putPrivatePdfArtifact,
} from "../report-artifacts.js";
import {
  hasParseableMinimalPdfStructure,
  minimalParseablePdf,
} from "./pdf-fixture.js";

type StoredPdf = {
  bytes: Uint8Array;
  etag: string;
  sha256: ArrayBuffer;
  customMetadata: Record<string, string>;
};

class PdfMemoryR2 {
  readonly objects = new Map<string, StoredPdf>();

  private object(key: string, stored: StoredPdf): R2Object {
    return {
      key,
      size: stored.bytes.byteLength,
      etag: stored.etag,
      httpEtag: `"${stored.etag}"`,
      checksums: { sha256: stored.sha256 },
      customMetadata: stored.customMetadata,
    } as R2Object;
  }

  async put(
    key: string,
    value: ReadableStream<Uint8Array>,
    options?: R2PutOptions,
  ): Promise<R2Object | null> {
    if (this.objects.has(key)) return null;
    const reader = value.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      chunks.push(chunk);
      size += chunk.byteLength;
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const stored: StoredPdf = {
      bytes,
      etag: `etag-${this.objects.size + 1}`,
      sha256: options!.sha256 as ArrayBuffer,
      customMetadata: options!.customMetadata ?? {},
    };
    this.objects.set(key, stored);
    return this.object(key, stored);
  }

  async head(key: string): Promise<R2Object | null> {
    const stored = this.objects.get(key);
    return stored ? this.object(key, stored) : null;
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    const stored = this.objects.get(key);
    if (!stored) return null;
    return {
      ...this.object(key, stored),
      body: new Blob([stored.bytes.slice()]).stream(),
    } as R2ObjectBody;
  }
}

async function checksum(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function stream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new Blob([bytes.slice()]).stream();
}

describe("immutable report PDF artifacts", () => {
  it("keeps the versioned source hash serialization stable", async () => {
    await expect(
      computeReportSourceSha256({
        id: "report-v1",
        workOrderId: "work-1",
        version: 1,
        reportNumber: "FS-20260723-001",
        structuredJson: JSON.stringify({ workSummary: "1차 완료" }),
        photosJson: JSON.stringify([
          { id: "photo-1", checksumSha256: "a".repeat(64) },
        ]),
        templateVersion: 1,
        createdBy: "user-1",
        createdAt: "2026-07-23T00:00:00.000Z",
      }),
    ).resolves.toBe(
      "0a392d0117b6ced8051c5441527232e1ca83338e770080d657e1392bfd7df094",
    );

    await expect(
      computeSignedReportSourceSha256({
        reportVersionId: "report-v1",
        approvalRequestId: "approval-1",
        basePdfChecksumSha256: "b".repeat(64),
        signerName: "김 승인",
        signerTitle: "현장소장",
        signatureSha256: "c".repeat(64),
        approvedAt: "2026-07-23T01:00:00.000Z",
        agreementVersion: "approval-consent-v1",
      }),
    ).resolves.toBe(
      "a8f2a0e1961e176e02f7f3766b05ef9eed90ac409738f5d239a0ff845b06a24b",
    );
  });

  it("changes the version source hash for a v2 immutable snapshot", async () => {
    const base = {
      id: "report-v1",
      workOrderId: "work-1",
      version: 1,
      reportNumber: "FS-20260723-001",
      structuredJson: JSON.stringify({ workSummary: "1차 완료" }),
      photosJson: JSON.stringify([{ id: "photo-1", checksumSha256: "a".repeat(64) }]),
      templateVersion: 1,
      createdBy: "user-1",
      createdAt: "2026-07-23T00:00:00.000Z",
    };
    const v1 = await computeReportSourceSha256(base);
    const v2 = await computeReportSourceSha256({
      ...base,
      id: "report-v2",
      version: 2,
      structuredJson: JSON.stringify({ workSummary: "고객 요청 반영 2차 완료" }),
      createdAt: "2026-07-24T00:00:00.000Z",
    });
    expect(v1).toMatch(/^[a-f0-9]{64}$/u);
    expect(v2).toMatch(/^[a-f0-9]{64}$/u);
    expect(v2).not.toBe(v1);

    const signedV1 = await computeSignedReportSourceSha256({
      reportVersionId: base.id,
      approvalRequestId: "approval-1",
      basePdfChecksumSha256: "b".repeat(64),
      signerName: "김 승인",
      signerTitle: "현장소장",
      signatureSha256: "c".repeat(64),
      approvedAt: "2026-07-23T01:00:00.000Z",
      agreementVersion: "approval-consent-v1",
    });
    const signedV2 = await computeSignedReportSourceSha256({
      reportVersionId: "report-v2",
      approvalRequestId: "approval-2",
      basePdfChecksumSha256: "d".repeat(64),
      signerName: "김 승인",
      signerTitle: "현장소장",
      signatureSha256: "c".repeat(64),
      approvedAt: "2026-07-24T01:00:00.000Z",
      agreementVersion: "approval-consent-v1",
    });
    expect(signedV2).not.toBe(signedV1);
  });

  it("stores once, reconciles an identical retry, and streams privately", async () => {
    const bucket = new PdfMemoryR2();
    const bytes = minimalParseablePdf();
    expect(hasParseableMinimalPdfStructure(bytes)).toBe(true);
    const outputSha256 = await checksum(bytes);
    const sourceSha256 = "a".repeat(64);
    const common = {
      artifactId: "artifact-1",
      orgId: "org-1",
      workOrderId: "work-1",
      reportVersionId: "version-1",
      kind: "approval" as const,
      rendererVersion: REPORT_PDF_RENDERER_VERSION,
      sourceSha256,
      contentLength: bytes.byteLength,
      checksumSha256: outputSha256,
      filename: "작업완료보고서.pdf",
    };
    const first = await putPrivatePdfArtifact(bucket as unknown as R2Bucket, {
      ...common,
      body: stream(bytes),
    });
    expect(first.reused).toBe(false);
    expect(first.storageKey).toBe(
      createImmutableReportPdfKey({
        orgId: common.orgId,
        workOrderId: common.workOrderId,
        reportVersionId: common.reportVersionId,
        kind: common.kind,
        sourceSha256,
      }),
    );
    expect(bucket.objects.size).toBe(1);

    const retry = await putPrivatePdfArtifact(bucket as unknown as R2Bucket, {
      ...common,
      body: stream(bytes),
    });
    expect(retry.reused).toBe(true);
    expect(retry.checksumSha256).toBe(outputSha256);
    expect(bucket.objects.size).toBe(1);

    const response = await getPrivatePdfArtifactResponse(
      bucket as unknown as R2Bucket,
      {
        storageKey: first.storageKey,
        checksumSha256: outputSha256,
        filename: "작업완료보고서.pdf",
      },
    );
    expect(response?.status).toBe(200);
    expect(response?.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response?.headers.get("X-Content-SHA256")).toBe(outputSha256);
    expect(response?.headers.get("Content-Security-Policy")).toContain(
      "sandbox",
    );
    expect(new Uint8Array(await response!.arrayBuffer())).toEqual(bytes);
  });

  it("rejects an overwrite conflict and malformed PDF framing", async () => {
    const bucket = new PdfMemoryR2();
    const bytes = minimalParseablePdf("first");
    const sourceSha256 = "e".repeat(64);
    const firstChecksum = await checksum(bytes);
    const common = {
      artifactId: "artifact-2",
      orgId: "org-2",
      workOrderId: "work-2",
      reportVersionId: "version-2",
      kind: "approval" as const,
      rendererVersion: REPORT_PDF_RENDERER_VERSION,
      sourceSha256,
      filename: "report.pdf",
    };
    await putPrivatePdfArtifact(bucket as unknown as R2Bucket, {
      ...common,
      body: stream(bytes),
      contentLength: bytes.byteLength,
      checksumSha256: firstChecksum,
    });

    const different = minimalParseablePdf("different");
    await expect(
      putPrivatePdfArtifact(bucket as unknown as R2Bucket, {
        ...common,
        body: stream(different),
        contentLength: different.byteLength,
        checksumSha256: await checksum(different),
      }),
    ).rejects.toMatchObject({
      code: "immutable_conflict",
    });

    const invalid = new TextEncoder().encode(
      `not-a-pdf\n${" ".repeat(180)}\nmissing-eof`,
    );
    await expect(
      putPrivatePdfArtifact(
        new PdfMemoryR2() as unknown as R2Bucket,
        {
          ...common,
          artifactId: "artifact-invalid",
          sourceSha256: "f".repeat(64),
          body: stream(invalid),
          contentLength: invalid.byteLength,
          checksumSha256: await checksum(invalid),
        },
      ),
    ).rejects.toMatchObject({
      code: "invalid_pdf",
    });
  });
});
