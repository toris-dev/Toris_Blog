/**
 * Private media storage primitives.
 *
 * This module deliberately returns R2 objects/bytes, never public URLs.
 * Callers must authorize organization/work-order access before using a stored
 * key and must persist the returned checksum/etag in `media_assets`.
 */

export type MediaType = "photo" | "audio";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const DATA_URL_PREFIX_ALLOWANCE = 64;

type MediaPolicy = {
  mediaType: MediaType;
  extension: string;
  maxBytes: number;
  hasExpectedSignature: (bytes: Uint8Array) => boolean;
};

const hasPrefix = (bytes: Uint8Array, prefix: readonly number[]): boolean =>
  bytes.length >= prefix.length && prefix.every((value, index) => bytes[index] === value);

const isJpeg = (bytes: Uint8Array): boolean => hasPrefix(bytes, [0xff, 0xd8, 0xff]);
const isPng = (bytes: Uint8Array): boolean =>
  hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isWebp = (bytes: Uint8Array): boolean =>
  hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
  bytes.length >= 12 &&
  bytes[8] === 0x57 &&
  bytes[9] === 0x45 &&
  bytes[10] === 0x42 &&
  bytes[11] === 0x50;
const isWebm = (bytes: Uint8Array): boolean => hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
const isMp4 = (bytes: Uint8Array): boolean =>
  bytes.length >= 12 &&
  bytes[4] === 0x66 &&
  bytes[5] === 0x74 &&
  bytes[6] === 0x79 &&
  bytes[7] === 0x70;
const isMpeg = (bytes: Uint8Array): boolean =>
  hasPrefix(bytes, [0x49, 0x44, 0x33]) ||
  (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0);
const isWav = (bytes: Uint8Array): boolean =>
  hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
  bytes.length >= 12 &&
  bytes[8] === 0x57 &&
  bytes[9] === 0x41 &&
  bytes[10] === 0x56 &&
  bytes[11] === 0x45;

const MEDIA_POLICIES: Readonly<Record<string, MediaPolicy>> = {
  "image/jpeg": {
    mediaType: "photo",
    extension: "jpg",
    maxBytes: MAX_PHOTO_BYTES,
    hasExpectedSignature: isJpeg,
  },
  "image/png": {
    mediaType: "photo",
    extension: "png",
    maxBytes: MAX_PHOTO_BYTES,
    hasExpectedSignature: isPng,
  },
  "image/webp": {
    mediaType: "photo",
    extension: "webp",
    maxBytes: MAX_PHOTO_BYTES,
    hasExpectedSignature: isWebp,
  },
  "audio/webm": {
    mediaType: "audio",
    extension: "webm",
    maxBytes: MAX_AUDIO_BYTES,
    hasExpectedSignature: isWebm,
  },
  "audio/mp4": {
    mediaType: "audio",
    extension: "m4a",
    maxBytes: MAX_AUDIO_BYTES,
    hasExpectedSignature: isMp4,
  },
  "audio/mpeg": {
    mediaType: "audio",
    extension: "mp3",
    maxBytes: MAX_AUDIO_BYTES,
    hasExpectedSignature: isMpeg,
  },
  "audio/wav": {
    mediaType: "audio",
    extension: "wav",
    maxBytes: MAX_AUDIO_BYTES,
    hasExpectedSignature: isWav,
  },
};

export type MediaValidationCode =
  | "invalid_data_url"
  | "unsupported_mime"
  | "media_type_mismatch"
  | "empty_media"
  | "media_too_large"
  | "signature_mismatch"
  | "invalid_storage_key";

export class MediaValidationError extends Error {
  constructor(
    public readonly code: MediaValidationCode,
    message: string,
  ) {
    super(message);
    this.name = "MediaValidationError";
  }
}

export function requestMediaMimeType(request: Request): string {
  return (request.headers.get("Content-Type") ?? "")
    .split(";", 1)[0]!
    .trim()
    .toLowerCase();
}

export async function readBoundedMediaRequest(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new MediaValidationError("media_too_large", "요청 본문의 용량 제한을 초과했습니다");
  }
  if (!request.body) {
    throw new MediaValidationError("empty_media", "빈 미디어는 저장할 수 없습니다");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new MediaValidationError("media_too_large", "요청 본문의 용량 제한을 초과했습니다");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (total === 0) {
    throw new MediaValidationError("empty_media", "빈 미디어는 저장할 수 없습니다");
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export type DecodedMedia = {
  mediaType: MediaType;
  mimeType: string;
  bytes: Uint8Array;
};

export function decodeMediaBytes(
  mediaType: MediaType,
  mimeType: string,
  bytes: Uint8Array,
): DecodedMedia {
  validateMediaBytes(mediaType, mimeType, bytes);
  return { mediaType, mimeType, bytes };
}

function getPolicy(mimeType: string): MediaPolicy {
  const policy = MEDIA_POLICIES[mimeType];
  if (!policy) {
    throw new MediaValidationError("unsupported_mime", `지원하지 않는 미디어 형식입니다: ${mimeType}`);
  }
  return policy;
}

export function validateMediaMetadata(
  mediaType: MediaType,
  mimeType: string,
  sizeBytes: number,
): MediaPolicy {
  const policy = getPolicy(mimeType);
  if (policy.mediaType !== mediaType) {
    throw new MediaValidationError("media_type_mismatch", "미디어 종류와 MIME 형식이 일치하지 않습니다");
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    throw new MediaValidationError("empty_media", "빈 미디어는 저장할 수 없습니다");
  }
  if (sizeBytes > policy.maxBytes) {
    throw new MediaValidationError(
      "media_too_large",
      `${mediaType === "photo" ? "사진" : "음성"} 용량 제한을 초과했습니다`,
    );
  }
  return policy;
}

function validateMediaBytes(mediaType: MediaType, mimeType: string, bytes: Uint8Array): MediaPolicy {
  const policy = validateMediaMetadata(mediaType, mimeType, bytes.byteLength);
  if (!policy.hasExpectedSignature(bytes)) {
    throw new MediaValidationError("signature_mismatch", "파일 내용이 선언된 MIME 형식과 일치하지 않습니다");
  }
  return policy;
}

function decodedBase64Size(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

export function decodeMediaDataUrl(dataUrl: string, expectedType?: MediaType): DecodedMedia {
  const maximumBytes = expectedType === "photo" ? MAX_PHOTO_BYTES : MAX_AUDIO_BYTES;
  const maximumDataUrlLength = 4 * Math.ceil(maximumBytes / 3) + DATA_URL_PREFIX_ALLOWANCE;
  if (dataUrl.length > maximumDataUrlLength) {
    throw new MediaValidationError("media_too_large", "미디어 데이터 URL 용량 제한을 초과했습니다");
  }

  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(dataUrl);
  const mimeType = match?.[1];
  const base64 = match?.[2];
  if (!mimeType || !base64 || base64.length % 4 !== 0) {
    throw new MediaValidationError("invalid_data_url", "올바른 base64 데이터 URL이 아닙니다");
  }

  const policy = getPolicy(mimeType);
  const mediaType = expectedType ?? policy.mediaType;
  validateMediaMetadata(mediaType, mimeType, decodedBase64Size(base64));

  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new MediaValidationError("invalid_data_url", "base64 미디어 데이터를 해석할 수 없습니다");
  }
  if (btoa(binary) !== base64) {
    throw new MediaValidationError("invalid_data_url", "정규화되지 않은 base64 미디어 데이터입니다");
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  validateMediaBytes(mediaType, mimeType, bytes);
  return { mediaType, mimeType, bytes };
}

export function encodeMediaDataUrl(
  mediaType: MediaType,
  mimeType: string,
  bytes: Uint8Array,
): string {
  validateMediaBytes(mediaType, mimeType, bytes);

  const chunkSize = 32_768;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function safeKeySegment(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 128 || trimmed === "." || trimmed === "..") {
    throw new MediaValidationError("invalid_storage_key", `${fieldName} 식별자가 올바르지 않습니다`);
  }
  return encodeURIComponent(trimmed);
}

export function createImmutableMediaKey(args: {
  orgId: string;
  workOrderId: string;
  mediaType: MediaType;
  mimeType: string;
  createdAt?: Date;
  assetId?: string;
}): string {
  const policy = getPolicy(args.mimeType);
  if (policy.mediaType !== args.mediaType) {
    throw new MediaValidationError("media_type_mismatch", "미디어 종류와 MIME 형식이 일치하지 않습니다");
  }

  const orgId = safeKeySegment(args.orgId, "조직");
  const workOrderId = safeKeySegment(args.workOrderId, "작업");
  const assetId = safeKeySegment(args.assetId ?? crypto.randomUUID(), "미디어");
  const date = (args.createdAt ?? new Date()).toISOString().slice(0, 10);

  return `orgs/${orgId}/work-orders/${workOrderId}/${args.mediaType}/${date}/${assetId}.${policy.extension}`;
}

export function createImmutableAssetPhotoKey(args: {
  orgId: string;
  siteId: string;
  assetId: string;
  photoId: string;
  mimeType: string;
  createdAt?: Date;
}): string {
  const policy = getPolicy(args.mimeType);
  if (policy.mediaType !== "photo") {
    throw new MediaValidationError("media_type_mismatch", "장비 사진은 이미지 형식이어야 합니다");
  }

  const orgId = safeKeySegment(args.orgId, "조직");
  const siteId = safeKeySegment(args.siteId, "현장");
  const assetId = safeKeySegment(args.assetId, "장비");
  const photoId = safeKeySegment(args.photoId, "사진");
  const date = (args.createdAt ?? new Date()).toISOString().slice(0, 10);

  return `orgs/${orgId}/sites/${siteId}/assets/${assetId}/photos/${date}/${photoId}.${policy.extension}`;
}

export function createImmutableOrganizationLogoKey(args: {
  orgId: string;
  logoId: string;
  mimeType: string;
  createdAt?: Date;
}): string {
  const policy = getPolicy(args.mimeType);
  if (policy.mediaType !== "photo") {
    throw new MediaValidationError("media_type_mismatch", "조직 로고는 이미지 형식이어야 합니다");
  }

  const orgId = safeKeySegment(args.orgId, "조직");
  const logoId = safeKeySegment(args.logoId, "로고");
  const date = (args.createdAt ?? new Date()).toISOString().slice(0, 10);
  return `orgs/${orgId}/branding/logos/${date}/${logoId}.${policy.extension}`;
}

function assertPrivateStorageKey(storageKey: string): void {
  const parts = storageKey.split("/");
  const isWorkOrderMediaKey =
    parts.length === 7 &&
    parts[0] === "orgs" &&
    parts[2] === "work-orders" &&
    (parts[4] === "photo" || parts[4] === "audio") &&
    /^\d{4}-\d{2}-\d{2}$/.test(parts[5]!);
  const isAssetPhotoKey =
    parts.length === 9 &&
    parts[0] === "orgs" &&
    parts[2] === "sites" &&
    parts[4] === "assets" &&
    parts[6] === "photos" &&
    /^\d{4}-\d{2}-\d{2}$/.test(parts[7]!);
  const isOrganizationLogoKey =
    parts.length === 6 &&
    parts[0] === "orgs" &&
    parts[2] === "branding" &&
    parts[3] === "logos" &&
    /^\d{4}-\d{2}-\d{2}$/.test(parts[4]!);
  if (
    storageKey.length < 1 ||
    storageKey.length > 1_024 ||
    storageKey.startsWith("/") ||
    storageKey.includes("\\") ||
    parts.some((part) => part === "" || part === "." || part === "..") ||
    (!isWorkOrderMediaKey && !isAssetPhotoKey && !isOrganizationLogoKey)
  ) {
    throw new MediaValidationError("invalid_storage_key", "R2 저장 키가 올바르지 않습니다");
  }
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256MediaBytes(bytes: Uint8Array): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

function canonicalMetadata(
  metadata: Readonly<Record<string, string | number | boolean | null>>,
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(metadata).sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    ),
  );
}

export async function computeMediaRequestFingerprintFromChecksum(args: {
  mediaType: MediaType;
  mimeType: string;
  checksumSha256: string;
  metadata: Readonly<Record<string, string | number | boolean | null>>;
}): Promise<string> {
  const canonicalRequest = JSON.stringify({
    schema: "fieldstep.media-upload.v1",
    mediaType: args.mediaType,
    mimeType: args.mimeType,
    checksumSha256: args.checksumSha256,
    metadata: canonicalMetadata(args.metadata),
  });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalRequest),
  );
  return toHex(digest);
}

export async function computeMediaRequestFingerprint(args: {
  media: DecodedMedia;
  metadata: Readonly<Record<string, string | number | boolean | null>>;
}): Promise<string> {
  return computeMediaRequestFingerprintFromChecksum({
    mediaType: args.media.mediaType,
    mimeType: args.media.mimeType,
    checksumSha256: await sha256MediaBytes(args.media.bytes),
    metadata: args.metadata,
  });
}

export type StoredPrivateMedia = {
  storageKey: string;
  etag: string;
  checksumSha256: string;
  sizeBytes: number;
  mimeType: string;
};

export async function putPrivateMedia(
  bucket: R2Bucket,
  args: {
    storageKey: string;
    media: DecodedMedia;
    assetId: string;
  },
): Promise<StoredPrivateMedia> {
  assertPrivateStorageKey(args.storageKey);
  validateMediaBytes(args.media.mediaType, args.media.mimeType, args.media.bytes);

  const checksum = await crypto.subtle.digest("SHA-256", args.media.bytes);
  const object = await bucket.put(args.storageKey, args.media.bytes, {
    onlyIf: { etagDoesNotMatch: "*" },
    httpMetadata: {
      contentType: args.media.mimeType,
      cacheControl: "private, no-store",
    },
    customMetadata: {
      mediaAssetId: safeKeySegment(args.assetId, "미디어"),
      mediaType: args.media.mediaType,
    },
    sha256: checksum,
  });

  if (!object) {
    throw new MediaValidationError("invalid_storage_key", "이미 사용 중인 불변 미디어 키입니다");
  }

  return {
    storageKey: object.key,
    etag: object.etag,
    checksumSha256: toHex(checksum),
    sizeBytes: object.size,
    mimeType: args.media.mimeType,
  };
}

export async function getPrivateMedia(bucket: R2Bucket, storageKey: string): Promise<R2ObjectBody | null> {
  assertPrivateStorageKey(storageKey);
  return bucket.get(storageKey);
}

export async function getPrivateMediaResponse(
  bucket: R2Bucket,
  args: {
    storageKey: string;
    mimeType: string;
    checksumSha256?: string;
  },
): Promise<Response | null> {
  const object = await getPrivateMedia(bucket, args.storageKey);
  if (!object) return null;

  const storedChecksum = object.checksums?.sha256;
  if (
    args.checksumSha256 &&
    storedChecksum &&
    toHex(storedChecksum) !== args.checksumSha256
  ) {
    throw new Error("R2 미디어 체크섬이 메타데이터와 일치하지 않습니다");
  }

  const headers = new Headers({
    "Content-Type": args.mimeType,
    "Content-Length": String(object.size),
    "Cache-Control": "private, no-store",
    ETag: object.httpEtag || `"${object.etag}"`,
    "X-Content-Type-Options": "nosniff",
  });
  return new Response(object.body, { headers });
}

export async function deletePrivateMedia(bucket: R2Bucket, storageKey: string): Promise<void> {
  assertPrivateStorageKey(storageKey);
  await bucket.delete(storageKey);
}
