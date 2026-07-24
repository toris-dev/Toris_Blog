import { describe, expect, it } from "vitest";
import {
  createImmutableMediaKey,
  decodeMediaDataUrl,
  encodeMediaDataUrl,
  MAX_AUDIO_BYTES,
  MAX_PHOTO_BYTES,
  MediaValidationError,
  validateMediaMetadata,
} from "../media.js";

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const jpegDataUrl = "data:image/jpeg;base64,/9j/4AAQ";

describe("media data URL validation", () => {
  it("decodes an allowed image and round-trips it", () => {
    const decoded = decodeMediaDataUrl(jpegDataUrl, "photo");

    expect(decoded.mediaType).toBe("photo");
    expect(decoded.mimeType).toBe("image/jpeg");
    expect(Array.from(decoded.bytes)).toEqual(Array.from(jpegBytes));
    expect(encodeMediaDataUrl("photo", "image/jpeg", decoded.bytes)).toBe(jpegDataUrl);
  });

  it("rejects unsupported MIME types, type mismatches, and spoofed content", () => {
    expect(() => decodeMediaDataUrl("data:image/gif;base64,R0lGODlh", "photo")).toThrowError(
      expect.objectContaining<Partial<MediaValidationError>>({ code: "unsupported_mime" }),
    );
    expect(() => decodeMediaDataUrl(jpegDataUrl, "audio")).toThrowError(
      expect.objectContaining<Partial<MediaValidationError>>({ code: "media_type_mismatch" }),
    );
    expect(() => decodeMediaDataUrl("data:image/png;base64,/9j/4AAQ", "photo")).toThrowError(
      expect.objectContaining<Partial<MediaValidationError>>({ code: "signature_mismatch" }),
    );
  });

  it("rejects malformed and non-base64 data URLs", () => {
    const invalidValues = [
      "data:image/jpeg,/9j/4AAQ",
      "data:image/jpeg;base64,%%%%",
      "data:image/jpeg;base64,/9j",
      "data:image/jpeg;base64,/9j/4AB=",
      "https://example.test/photo.jpg",
    ];

    for (const value of invalidValues) {
      expect(() => decodeMediaDataUrl(value, "photo")).toThrowError(
        expect.objectContaining<Partial<MediaValidationError>>({ code: "invalid_data_url" }),
      );
    }
  });

  it("enforces independent photo and audio size limits before allocation", () => {
    expect(() => validateMediaMetadata("photo", "image/jpeg", MAX_PHOTO_BYTES)).not.toThrow();
    expect(() => validateMediaMetadata("audio", "audio/webm", MAX_AUDIO_BYTES)).not.toThrow();
    expect(() => validateMediaMetadata("photo", "image/jpeg", MAX_PHOTO_BYTES + 1)).toThrowError(
      expect.objectContaining<Partial<MediaValidationError>>({ code: "media_too_large" }),
    );
    expect(() => validateMediaMetadata("audio", "audio/webm", MAX_AUDIO_BYTES + 1)).toThrowError(
      expect.objectContaining<Partial<MediaValidationError>>({ code: "media_too_large" }),
    );
  });
});

describe("immutable R2 media keys", () => {
  it("scopes keys by organization and work order without exposing a public URL", () => {
    const key = createImmutableMediaKey({
      orgId: "org / one",
      workOrderId: "work-1",
      mediaType: "photo",
      mimeType: "image/webp",
      createdAt: new Date("2026-07-23T12:00:00.000Z"),
      assetId: "asset-1",
    });

    expect(key).toBe("orgs/org%20%2F%20one/work-orders/work-1/photo/2026-07-23/asset-1.webp");
    expect(key).not.toMatch(/^https?:/);
  });

  it("rejects empty or traversal-like identifiers", () => {
    expect(() =>
      createImmutableMediaKey({
        orgId: "..",
        workOrderId: "work-1",
        mediaType: "photo",
        mimeType: "image/jpeg",
      }),
    ).toThrowError(expect.objectContaining<Partial<MediaValidationError>>({ code: "invalid_storage_key" }));
  });
});
