type StoredR2Object = {
  bytes: Uint8Array;
  etag: string;
  sha256: ArrayBuffer;
  customMetadata: Record<string, string>;
};

async function readPutValue(value: unknown): Promise<Uint8Array> {
  if (typeof value === "string") {
    return new TextEncoder().encode(value);
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value.slice(0));
  }
  if (ArrayBuffer.isView(value)) {
    const view = new Uint8Array(
      value.buffer,
      value.byteOffset,
      value.byteLength,
    );
    return new Uint8Array(view);
  }
  if (value instanceof Blob) {
    return new Uint8Array(await value.arrayBuffer());
  }
  if (
    value &&
    typeof (value as { getReader?: unknown }).getReader === "function"
  ) {
    const reader = (value as ReadableStream<Uint8Array>).getReader();
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
    return bytes;
  }
  throw new TypeError("Unsupported in-memory R2 put value");
}

/**
 * Test-only R2 bucket that accepts the body shapes used by the worker:
 * media uses Uint8Array while PDF artifacts stream their bytes.
 */
export class MemoryR2 {
  readonly objects = new Map<string, StoredR2Object>();
  beforePut: ((key: string) => Promise<void>) | null = null;

  private object(key: string, stored: StoredR2Object): R2Object {
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
    value: unknown,
    options?: R2PutOptions,
  ): Promise<R2Object | null> {
    await this.beforePut?.(key);
    if (this.objects.has(key)) return null;

    const bytes = await readPutValue(value);
    const stored: StoredR2Object = {
      bytes,
      etag: `etag-${this.objects.size + 1}`,
      sha256: await crypto.subtle.digest("SHA-256", bytes),
      customMetadata: options?.customMetadata ?? {},
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

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }
}
