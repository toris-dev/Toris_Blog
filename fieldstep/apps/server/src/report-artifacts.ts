const REPORT_SOURCE_SCHEMA = "fieldstep.report-source.v1";
const SIGNED_SOURCE_SCHEMA = "fieldstep.signed-report-source.v1";

export const REPORT_PDF_MIME_TYPE = "application/pdf";
export const REPORT_PDF_RENDERER_VERSION = "fieldstep-pdf-v1";
export const MAX_REPORT_PDF_BYTES = 25 * 1024 * 1024;
export const MIN_REPORT_PDF_BYTES = 128;

export type ReportArtifactKind = "approval" | "signed";
export type ReportArtifactStatus = "pending" | "uploading" | "ready" | "failed";

export type ReportArtifactRow = {
  id: string;
  org_id: string;
  work_order_id: string;
  report_version_id: string;
  approval_request_id: string | null;
  base_artifact_id: string | null;
  kind: ReportArtifactKind;
  status: ReportArtifactStatus;
  renderer_version: string;
  source_sha256: string;
  storage_key: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  etag: string | null;
  checksum_sha256: string | null;
  attempt_count: number;
  last_error_code: string | null;
  last_error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  ready_at: string | null;
};

export type ReportVersionSource = {
  id: string;
  workOrderId: string;
  version: number;
  reportNumber: string;
  structuredJson: string;
  photosJson: string;
  templateVersion: number;
  createdBy: string;
  createdAt: string;
};

export type SignedReportSource = {
  reportVersionId: string;
  approvalRequestId: string;
  basePdfChecksumSha256: string;
  signerName: string;
  signerTitle: string | null;
  signatureSha256: string;
  approvedAt: string;
  agreementVersion: string;
};

export type StoredPdfArtifact = {
  storageKey: string;
  etag: string;
  checksumSha256: string;
  sourceSha256: string;
  sizeBytes: number;
  mimeType: typeof REPORT_PDF_MIME_TYPE;
  reused: boolean;
};

export type PdfArtifactMetadata = {
  artifactId: string;
  reportVersionId: string;
  kind: ReportArtifactKind;
  rendererVersion: string;
  sourceSha256: string;
};

export type PutPdfArtifactArgs = PdfArtifactMetadata & {
  orgId: string;
  workOrderId: string;
  body: ReadableStream<Uint8Array>;
  contentLength: number;
  checksumSha256: string;
  filename: string;
};

export type GetPdfArtifactArgs = {
  storageKey: string;
  checksumSha256: string;
  filename: string;
  disposition?: "inline" | "attachment";
};

export type HeadPdfArtifactArgs = PdfArtifactMetadata & {
  orgId: string;
  workOrderId: string;
  storageKey: string;
  contentLength: number;
  checksumSha256: string;
};

export type ReportArtifactErrorCode =
  | "invalid_identifier"
  | "invalid_source_hash"
  | "invalid_checksum"
  | "invalid_content_length"
  | "invalid_pdf"
  | "immutable_conflict"
  | "missing_object";

export class ReportArtifactError extends Error {
  constructor(
    public readonly code: ReportArtifactErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReportArtifactError";
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SHA256_HEX_RE = /^[a-f0-9]{64}$/u;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(value: string): ArrayBuffer {
  if (!SHA256_HEX_RE.test(value)) {
    throw new ReportArtifactError("invalid_checksum", "PDF 체크섬 형식이 올바르지 않습니다");
  }
  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes.buffer;
}

async function sha256Text(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function normalizedText(value: string): string {
  return value.normalize("NFC");
}

/**
 * Hashes the exact immutable database payload, not a live work-order DTO.
 * JSON property order is deliberately fixed and versioned by `schema`.
 */
export function computeReportSourceSha256(source: ReportVersionSource): Promise<string> {
  return sha256Text(
    JSON.stringify({
      schema: REPORT_SOURCE_SCHEMA,
      id: source.id,
      workOrderId: source.workOrderId,
      version: source.version,
      reportNumber: source.reportNumber,
      structuredJson: source.structuredJson,
      photosJson: source.photosJson,
      templateVersion: source.templateVersion,
      createdBy: source.createdBy,
      createdAt: source.createdAt,
    }),
  );
}

/**
 * A signed artifact is derived from one immutable approval PDF plus the exact
 * server-side signature receipt. Changing either input produces a new hash.
 */
export function computeSignedReportSourceSha256(source: SignedReportSource): Promise<string> {
  if (!SHA256_HEX_RE.test(source.basePdfChecksumSha256)) {
    throw new ReportArtifactError("invalid_checksum", "기준 PDF 체크섬 형식이 올바르지 않습니다");
  }
  if (!SHA256_HEX_RE.test(source.signatureSha256)) {
    throw new ReportArtifactError("invalid_checksum", "서명 체크섬 형식이 올바르지 않습니다");
  }
  return sha256Text(
    JSON.stringify({
      schema: SIGNED_SOURCE_SCHEMA,
      reportVersionId: source.reportVersionId,
      approvalRequestId: source.approvalRequestId,
      basePdfChecksumSha256: source.basePdfChecksumSha256,
      signerName: normalizedText(source.signerName.trim()),
      signerTitle: source.signerTitle
        ? normalizedText(source.signerTitle.trim())
        : null,
      signatureSha256: source.signatureSha256,
      approvedAt: source.approvedAt,
      agreementVersion: source.agreementVersion,
    }),
  );
}

function safeKeySegment(value: string, label: string): string {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.length > 128 ||
    normalized === "." ||
    normalized === ".." ||
    normalized.includes("/") ||
    normalized.includes("\\")
  ) {
    throw new ReportArtifactError("invalid_identifier", `${label} 식별자가 올바르지 않습니다`);
  }
  return encodeURIComponent(normalized);
}

export function createImmutableReportPdfKey(args: {
  orgId: string;
  workOrderId: string;
  reportVersionId: string;
  kind: ReportArtifactKind;
  sourceSha256: string;
}): string {
  if (!SHA256_HEX_RE.test(args.sourceSha256)) {
    throw new ReportArtifactError("invalid_source_hash", "PDF 원본 해시 형식이 올바르지 않습니다");
  }
  const orgId = safeKeySegment(args.orgId, "조직");
  const workOrderId = safeKeySegment(args.workOrderId, "작업");
  const reportVersionId = safeKeySegment(args.reportVersionId, "보고서 버전");
  return `orgs/${orgId}/work-orders/${workOrderId}/reports/${reportVersionId}/${args.kind}-${args.sourceSha256}.pdf`;
}

function assertPrivateReportPdfKey(storageKey: string): void {
  const parts = storageKey.split("/");
  if (
    storageKey.length > 1_024 ||
    storageKey.startsWith("/") ||
    storageKey.includes("\\") ||
    parts.length !== 7 ||
    parts[0] !== "orgs" ||
    parts[2] !== "work-orders" ||
    parts[4] !== "reports" ||
    parts.some((part) => !part || part === "." || part === "..") ||
    !/^(approval|signed)-[a-f0-9]{64}\.pdf$/u.test(parts[6] ?? "")
  ) {
    throw new ReportArtifactError("invalid_identifier", "R2 PDF 저장 키가 올바르지 않습니다");
  }
}

function validateContentLength(contentLength: number): void {
  if (
    !Number.isSafeInteger(contentLength) ||
    contentLength < MIN_REPORT_PDF_BYTES ||
    contentLength > MAX_REPORT_PDF_BYTES
  ) {
    throw new ReportArtifactError(
      "invalid_content_length",
      `PDF는 ${MIN_REPORT_PDF_BYTES}바이트 이상 ${MAX_REPORT_PDF_BYTES}바이트 이하여야 합니다`,
    );
  }
}

function appendTail(
  current: Uint8Array,
  chunk: Uint8Array,
  limit = 1_024,
): Uint8Array<ArrayBuffer> {
  if (chunk.byteLength >= limit) {
    const sliced = new Uint8Array(limit);
    sliced.set(chunk.subarray(chunk.byteLength - limit));
    return sliced;
  }
  const combinedLength = Math.min(limit, current.byteLength + chunk.byteLength);
  const combined = new Uint8Array(combinedLength);
  const keptFromCurrent = combinedLength - chunk.byteLength;
  if (keptFromCurrent > 0) {
    combined.set(current.slice(current.byteLength - keptFromCurrent), 0);
  }
  combined.set(chunk, keptFromCurrent);
  return combined;
}

/**
 * Enforces size and basic PDF framing while bytes stream directly into R2.
 * Throwing from the transform aborts the R2 put, so a partial object is never
 * committed.
 */
export function validatingPdfStream(
  body: ReadableStream<Uint8Array>,
  expectedLength: number,
): ReadableStream<Uint8Array> {
  validateContentLength(expectedLength);
  let total = 0;
  let prefix = new Uint8Array(0);
  let tail = new Uint8Array(0);

  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (!(chunk instanceof Uint8Array) || chunk.byteLength === 0) return;
        total += chunk.byteLength;
        if (total > expectedLength || total > MAX_REPORT_PDF_BYTES) {
          throw new ReportArtifactError("invalid_content_length", "PDF 요청 본문 크기가 선언값과 다릅니다");
        }
        if (prefix.byteLength < 5) {
          const needed = 5 - prefix.byteLength;
          const next = new Uint8Array(prefix.byteLength + Math.min(needed, chunk.byteLength));
          next.set(prefix, 0);
          next.set(chunk.slice(0, needed), prefix.byteLength);
          prefix = next;
        }
        tail = appendTail(tail, chunk);
        controller.enqueue(chunk);
      },
      flush() {
        if (total !== expectedLength) {
          throw new ReportArtifactError("invalid_content_length", "PDF 요청 본문 크기가 선언값과 다릅니다");
        }
        if (decoder.decode(prefix) !== "%PDF-") {
          throw new ReportArtifactError("invalid_pdf", "PDF 파일 머리글이 올바르지 않습니다");
        }
        if (!decoder.decode(tail).includes("%%EOF")) {
          throw new ReportArtifactError("invalid_pdf", "PDF 파일 끝 표시가 없습니다");
        }
      },
    }),
  );
}

function encodedFilename(filename: string): string {
  const normalized = normalizedText(filename.trim() || "fieldstep-report.pdf");
  const withExtension = normalized.toLowerCase().endsWith(".pdf")
    ? normalized
    : `${normalized}.pdf`;
  return encodeURIComponent(withExtension).replace(
    /['()]/gu,
    (character) =>
      ({
        "'": "%27",
        "(": "%28",
        ")": "%29",
      })[character]!,
  );
}

function checksumFromObject(object: R2Object): string | null {
  return object.checksums?.sha256 ? toHex(object.checksums.sha256) : null;
}

function assertExistingObjectMatches(
  object: R2Object,
  args: PdfArtifactMetadata & {
    contentLength: number;
    checksumSha256: string;
  },
  storageKey: string,
): StoredPdfArtifact {
  const metadata = object.customMetadata ?? {};
  const checksumSha256 = checksumFromObject(object);
  if (
    object.key !== storageKey ||
    object.size !== args.contentLength ||
    checksumSha256 !== args.checksumSha256 ||
    metadata.artifactId !== args.artifactId ||
    metadata.reportVersionId !== args.reportVersionId ||
    metadata.kind !== args.kind ||
    metadata.rendererVersion !== args.rendererVersion ||
    metadata.sourceSha256 !== args.sourceSha256
  ) {
    throw new ReportArtifactError(
      "immutable_conflict",
      "이미 저장된 PDF가 요청한 불변 산출물과 일치하지 않습니다",
    );
  }
  return {
    storageKey: object.key,
    etag: object.etag,
    checksumSha256,
    sourceSha256: args.sourceSha256,
    sizeBytes: object.size,
    mimeType: REPORT_PDF_MIME_TYPE,
    reused: true,
  };
}

/**
 * A ready DB row is only reusable while its immutable R2 object still exists
 * and matches the exact artifact identity, byte length, and checksum.
 */
export async function hasMatchingPrivatePdfArtifact(
  bucket: R2Bucket,
  args: HeadPdfArtifactArgs,
): Promise<boolean> {
  validateContentLength(args.contentLength);
  fromHex(args.checksumSha256);
  const deterministicKey = createImmutableReportPdfKey(args);
  assertPrivateReportPdfKey(args.storageKey);
  if (args.storageKey !== deterministicKey) {
    throw new ReportArtifactError(
      "immutable_conflict",
      "PDF 메타데이터의 저장 키가 불변 산출물 키와 일치하지 않습니다",
    );
  }

  const object = await bucket.head(args.storageKey);
  if (!object) return false;
  assertExistingObjectMatches(object, args, args.storageKey);
  return true;
}

export async function putPrivatePdfArtifact(
  bucket: R2Bucket,
  args: PutPdfArtifactArgs,
): Promise<StoredPdfArtifact> {
  if (!SHA256_HEX_RE.test(args.sourceSha256)) {
    throw new ReportArtifactError("invalid_source_hash", "PDF 원본 해시 형식이 올바르지 않습니다");
  }
  validateContentLength(args.contentLength);
  const checksum = fromHex(args.checksumSha256);
  const storageKey = createImmutableReportPdfKey(args);
  const object = await bucket.put(
    storageKey,
    validatingPdfStream(args.body, args.contentLength),
    {
      onlyIf: { etagDoesNotMatch: "*" },
      httpMetadata: {
        contentType: REPORT_PDF_MIME_TYPE,
        contentDisposition: `inline; filename*=UTF-8''${encodedFilename(args.filename)}`,
        cacheControl: "private, no-store",
      },
      customMetadata: {
        artifactId: safeKeySegment(args.artifactId, "PDF 산출물"),
        reportVersionId: safeKeySegment(args.reportVersionId, "보고서 버전"),
        kind: args.kind,
        rendererVersion: args.rendererVersion,
        sourceSha256: args.sourceSha256,
        outputSha256: args.checksumSha256,
      },
      sha256: checksum,
    },
  );

  if (!object) {
    const existing = await bucket.head(storageKey);
    if (!existing) {
      throw new ReportArtifactError("missing_object", "기존 PDF 산출물 정보를 찾을 수 없습니다");
    }
    return assertExistingObjectMatches(existing, args, storageKey);
  }

  const storedChecksum = checksumFromObject(object);
  if (storedChecksum !== args.checksumSha256) {
    throw new ReportArtifactError("invalid_checksum", "R2 PDF 체크섬이 요청값과 일치하지 않습니다");
  }
  return {
    storageKey: object.key,
    etag: object.etag,
    checksumSha256: storedChecksum,
    sourceSha256: args.sourceSha256,
    sizeBytes: object.size,
    mimeType: REPORT_PDF_MIME_TYPE,
    reused: false,
  };
}

export async function getPrivatePdfArtifactResponse(
  bucket: R2Bucket,
  args: GetPdfArtifactArgs,
): Promise<Response | null> {
  assertPrivateReportPdfKey(args.storageKey);
  if (!SHA256_HEX_RE.test(args.checksumSha256)) {
    throw new ReportArtifactError("invalid_checksum", "저장된 PDF 체크섬 형식이 올바르지 않습니다");
  }
  const object = await bucket.get(args.storageKey);
  if (!object) return null;
  const storedChecksum = checksumFromObject(object);
  if (storedChecksum !== args.checksumSha256) {
    throw new ReportArtifactError("immutable_conflict", "R2 PDF 체크섬이 D1 메타데이터와 일치하지 않습니다");
  }
  const disposition = args.disposition ?? "inline";
  const headers = new Headers({
    "Content-Type": REPORT_PDF_MIME_TYPE,
    "Content-Length": String(object.size),
    "Content-Disposition": `${disposition}; filename*=UTF-8''${encodedFilename(args.filename)}`,
    "Cache-Control": "private, no-store",
    ETag: object.httpEtag || `"${object.etag}"`,
    "X-Content-Type-Options": "nosniff",
    "X-Content-SHA256": args.checksumSha256,
    "Content-Security-Policy":
      "sandbox; default-src 'none'; form-action 'none'; base-uri 'none'",
  });
  return new Response(object.body, { headers });
}
