import {
  CRM_IMPORT_COLUMNS,
  CRM_IMPORT_MAX_BYTES,
  CRM_IMPORT_MAX_ROWS,
  assetUpsertSchema,
  customerUpsertSchema,
  siteUpsertSchema,
  type AssetUpsertInput,
  type CrmImportColumnKey,
  type CrmImportEntityCounts,
  type CrmImportResult,
  type CrmImportRowError,
  type CustomerUpsertInput,
  type SiteUpsertInput,
} from "@fieldstep/shared";
import { nowIso } from "./db.js";

const CSV_CONTENT_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
]);

export const CRM_IMPORT_IDEMPOTENCY_KEY =
  /^[A-Za-z0-9._:-]{8,128}$/u;

type ImportStatus = 400 | 409 | 413 | 415;

export class CrmCsvImportError extends Error {
  constructor(
    message: string,
    readonly status: ImportStatus,
    readonly code: string,
  ) {
    super(message);
  }
}

export interface Rfc4180Row {
  cells: string[];
  /** 1-based physical line at which the logical CSV record begins. */
  sourceRow: number;
}

type ParsedCustomer = Omit<CustomerUpsertInput, "active">;
type ParsedSite = Omit<SiteUpsertInput, "customerId" | "active">;
type ParsedAsset = Omit<AssetUpsertInput, "siteId" | "active">;

export interface CrmImportCandidate {
  sourceRow: number;
  customer: ParsedCustomer;
  site?: ParsedSite;
  asset?: ParsedAsset;
}

export interface ParsedCrmImport {
  totalRows: number;
  rows: CrmImportCandidate[];
  errors: CrmImportRowError[];
}

const HEADER_KEY_BY_NAME = new Map<string, CrmImportColumnKey>();
for (const column of CRM_IMPORT_COLUMNS) {
  HEADER_KEY_BY_NAME.set(normalizeHeader(column.ko), column.key);
  HEADER_KEY_BY_NAME.set(normalizeHeader(column.en), column.key);
}

const COLUMN_LABEL = new Map<CrmImportColumnKey, string>(
  CRM_IMPORT_COLUMNS.map((column) => [column.key, column.ko] as const),
);

const SCHEMA_FIELD_LABEL: Record<string, string> = {
  name: "이름",
  bizNo: "사업자번호",
  address: "주소",
  contactName: "담당자",
  contactPhone: "연락처",
  memo: "메모",
  accessInfo: "출입정보",
  mapUrl: "지도 URL",
  model: "모델",
  serialNo: "일련번호",
  installedAt: "설치일",
};

function normalizeHeader(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

function normalizedIdentity(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

function isLineBreak(char: string): boolean {
  return char === "\r" || char === "\n";
}

/**
 * RFC 4180 레코드 파서. 쉼표, 이중 따옴표 이스케이프, 인용 필드의 개행,
 * CRLF/LF/CR을 처리하며 각 레코드의 원본 물리 행을 보존한다.
 */
export function parseRfc4180Csv(text: string): Rfc4180Row[] {
  const rows: Rfc4180Row[] = [];
  let cells: string[] = [];
  let value = "";
  let inQuotes = false;
  let afterQuote = false;
  let index = 0;
  let physicalRow = 1;
  let recordStartRow = 1;
  let endedWithRecordSeparator = false;

  const finishRecord = () => {
    cells.push(value);
    rows.push({ cells, sourceRow: recordStartRow });
    cells = [];
    value = "";
    afterQuote = false;
  };

  while (index < text.length) {
    const char = text[index]!;

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          value += '"';
          index += 2;
          endedWithRecordSeparator = false;
          continue;
        }
        inQuotes = false;
        afterQuote = true;
        index += 1;
        endedWithRecordSeparator = false;
        continue;
      }
      if (isLineBreak(char)) {
        if (char === "\r" && text[index + 1] === "\n") index += 2;
        else index += 1;
        value += "\n";
        physicalRow += 1;
        endedWithRecordSeparator = false;
        continue;
      }
      value += char;
      index += 1;
      endedWithRecordSeparator = false;
      continue;
    }

    if (afterQuote) {
      if (char === ",") {
        cells.push(value);
        value = "";
        afterQuote = false;
        index += 1;
        endedWithRecordSeparator = false;
        continue;
      }
      if (isLineBreak(char)) {
        finishRecord();
        if (char === "\r" && text[index + 1] === "\n") index += 2;
        else index += 1;
        physicalRow += 1;
        recordStartRow = physicalRow;
        endedWithRecordSeparator = true;
        continue;
      }
      throw new CrmCsvImportError(
        `CSV ${physicalRow}행: 닫는 따옴표 뒤에는 쉼표나 줄바꿈만 올 수 있습니다`,
        400,
        "invalid_csv_quote",
      );
    }

    if (char === '"') {
      if (value.length > 0) {
        throw new CrmCsvImportError(
          `CSV ${physicalRow}행: 따옴표는 필드의 첫 글자에서만 사용할 수 있습니다`,
          400,
          "invalid_csv_quote",
        );
      }
      inQuotes = true;
      index += 1;
      endedWithRecordSeparator = false;
      continue;
    }
    if (char === ",") {
      cells.push(value);
      value = "";
      index += 1;
      endedWithRecordSeparator = false;
      continue;
    }
    if (isLineBreak(char)) {
      finishRecord();
      if (char === "\r" && text[index + 1] === "\n") index += 2;
      else index += 1;
      physicalRow += 1;
      recordStartRow = physicalRow;
      endedWithRecordSeparator = true;
      continue;
    }
    value += char;
    index += 1;
    endedWithRecordSeparator = false;
  }

  if (inQuotes) {
    throw new CrmCsvImportError(
      `CSV ${recordStartRow}행: 인용 필드의 닫는 따옴표가 없습니다`,
      400,
      "unterminated_csv_quote",
    );
  }
  if (
    !endedWithRecordSeparator &&
    (afterQuote || value.length > 0 || cells.length > 0)
  ) {
    finishRecord();
  }
  return rows;
}

function hasAnyValue(
  values: Partial<Record<CrmImportColumnKey, string>>,
  keys: CrmImportColumnKey[],
): boolean {
  return keys.some((key) => Boolean(values[key]?.trim()));
}

function optionalValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function schemaReason(
  prefix: string,
  issues: { path: (string | number)[]; message: string }[],
): string {
  const issue = issues[0];
  if (!issue) return `${prefix} 입력값이 올바르지 않습니다`;
  const field = String(issue.path[0] ?? "");
  const label = SCHEMA_FIELD_LABEL[field] ?? field;
  return `${prefix} ${label}: ${issue.message}`;
}

function parseHeader(header: Rfc4180Row): CrmImportColumnKey[] {
  const keys: CrmImportColumnKey[] = [];
  const seen = new Set<CrmImportColumnKey>();

  for (const rawHeader of header.cells) {
    const normalized = normalizeHeader(rawHeader);
    if (!normalized) {
      throw new CrmCsvImportError(
        `CSV ${header.sourceRow}행: 비어 있는 헤더 열이 있습니다`,
        400,
        "empty_csv_header",
      );
    }
    const key = HEADER_KEY_BY_NAME.get(normalized);
    if (!key) {
      throw new CrmCsvImportError(
        `CSV ${header.sourceRow}행: 지원하지 않는 헤더 '${rawHeader.trim()}'입니다`,
        400,
        "unknown_csv_header",
      );
    }
    if (seen.has(key)) {
      throw new CrmCsvImportError(
        `CSV ${header.sourceRow}행: '${COLUMN_LABEL.get(key)}' 열이 중복되었습니다`,
        400,
        "duplicate_csv_header",
      );
    }
    seen.add(key);
    keys.push(key);
  }

  if (!seen.has("customerName")) {
    throw new CrmCsvImportError(
      "CSV 헤더에 필수 열 '고객사명' 또는 'customer_name'이 필요합니다",
      400,
      "missing_required_csv_header",
    );
  }
  return keys;
}

function parseCandidate(
  row: Rfc4180Row,
  headerKeys: CrmImportColumnKey[],
): CrmImportCandidate | CrmImportRowError {
  if (row.cells.length > headerKeys.length) {
    return {
      row: row.sourceRow,
      reason: `헤더보다 ${row.cells.length - headerKeys.length}개 많은 값이 있습니다`,
    };
  }

  const values: Partial<Record<CrmImportColumnKey, string>> = {};
  for (let index = 0; index < headerKeys.length; index += 1) {
    values[headerKeys[index]!] = row.cells[index] ?? "";
  }

  const siteKeys: CrmImportColumnKey[] = [
    "siteName",
    "siteAddress",
    "siteAccessInfo",
    "siteMapUrl",
  ];
  const assetKeys: CrmImportColumnKey[] = [
    "assetName",
    "assetModel",
    "assetSerialNo",
    "assetInstalledAt",
  ];

  const customerParsed = customerUpsertSchema.safeParse({
    name: values.customerName,
    bizNo: optionalValue(values.customerBizNo),
    address: optionalValue(values.customerAddress),
    contactName: optionalValue(values.customerContactName),
    contactPhone: optionalValue(values.customerContactPhone),
    memo: optionalValue(values.customerMemo),
  });
  if (!customerParsed.success) {
    return {
      row: row.sourceRow,
      reason: schemaReason("고객사", customerParsed.error.issues),
    };
  }

  const siteName = optionalValue(values.siteName);
  const assetName = optionalValue(values.assetName);
  if (!siteName && (hasAnyValue(values, siteKeys.slice(1)) || hasAnyValue(values, assetKeys))) {
    return {
      row: row.sourceRow,
      reason: "현장 상세정보나 장비를 입력하려면 현장명이 필요합니다",
    };
  }
  if (!assetName && hasAnyValue(values, assetKeys.slice(1))) {
    return {
      row: row.sourceRow,
      reason: "장비 상세정보를 입력하려면 장비명이 필요합니다",
    };
  }

  let site: ParsedSite | undefined;
  if (siteName) {
    const siteParsed = siteUpsertSchema.safeParse({
      customerId: "csv-import-validation",
      name: siteName,
      address: optionalValue(values.siteAddress),
      accessInfo: optionalValue(values.siteAccessInfo),
      mapUrl: optionalValue(values.siteMapUrl),
    });
    if (!siteParsed.success) {
      return {
        row: row.sourceRow,
        reason: schemaReason("현장", siteParsed.error.issues),
      };
    }
    const { customerId: _customerId, active: _active, ...siteData } =
      siteParsed.data;
    site = siteData;
  }

  let asset: ParsedAsset | undefined;
  if (assetName && site) {
    const assetParsed = assetUpsertSchema.safeParse({
      siteId: "csv-import-validation",
      name: assetName,
      model: optionalValue(values.assetModel),
      serialNo: optionalValue(values.assetSerialNo),
      installedAt: optionalValue(values.assetInstalledAt),
    });
    if (!assetParsed.success) {
      return {
        row: row.sourceRow,
        reason: schemaReason("장비", assetParsed.error.issues),
      };
    }
    const { siteId: _siteId, active: _active, ...assetData } =
      assetParsed.data;
    asset = assetData;
  }

  const { active: _active, ...customer } = customerParsed.data;
  return { sourceRow: row.sourceRow, customer, site, asset };
}

export function parseCrmImportCsv(text: string): ParsedCrmImport {
  const rows = parseRfc4180Csv(text.replace(/^\uFEFF/u, ""));
  if (rows.length === 0 || rows[0]!.cells.every((cell) => !cell.trim())) {
    throw new CrmCsvImportError(
      "CSV 헤더가 필요합니다",
      400,
      "missing_csv_header",
    );
  }

  const headerKeys = parseHeader(rows[0]!);
  const dataRows = rows
    .slice(1)
    .filter((row) => row.cells.some((cell) => Boolean(cell.trim())));

  if (dataRows.length === 0) {
    throw new CrmCsvImportError(
      "CSV에 가져올 데이터 행이 없습니다",
      400,
      "empty_csv_data",
    );
  }
  if (dataRows.length > CRM_IMPORT_MAX_ROWS) {
    throw new CrmCsvImportError(
      `CSV는 한 번에 최대 ${CRM_IMPORT_MAX_ROWS.toLocaleString("ko-KR")}행까지 가져올 수 있습니다`,
      413,
      "too_many_csv_rows",
    );
  }

  const candidates: CrmImportCandidate[] = [];
  const errors: CrmImportRowError[] = [];
  for (const row of dataRows) {
    const parsed = parseCandidate(row, headerKeys);
    if ("reason" in parsed) errors.push(parsed);
    else candidates.push(parsed);
  }
  return { totalRows: dataRows.length, rows: candidates, errors };
}

export function assertCsvContentType(contentType: string | null): void {
  if (!contentType) {
    throw new CrmCsvImportError(
      "Content-Type은 text/csv여야 합니다",
      415,
      "missing_csv_content_type",
    );
  }
  const [mediaType, ...parameters] = contentType
    .split(";")
    .map((part) => part.trim().toLowerCase());
  if (!mediaType || !CSV_CONTENT_TYPES.has(mediaType)) {
    throw new CrmCsvImportError(
      "Content-Type은 text/csv여야 합니다",
      415,
      "unsupported_csv_content_type",
    );
  }
  const charset = parameters
    .map((parameter) => parameter.split("=", 2))
    .find(([name]) => name === "charset")?.[1]
    ?.replace(/^"|"$/gu, "");
  if (charset && charset !== "utf-8" && charset !== "utf8") {
    throw new CrmCsvImportError(
      "CSV 문자 인코딩은 UTF-8이어야 합니다",
      415,
      "unsupported_csv_charset",
    );
  }
}

export async function readBoundedCsvRequest(
  request: Request,
): Promise<Uint8Array> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (!Number.isSafeInteger(declared) || declared < 0) {
      throw new CrmCsvImportError(
        "Content-Length가 올바르지 않습니다",
        400,
        "invalid_content_length",
      );
    }
    if (declared > CRM_IMPORT_MAX_BYTES) {
      throw new CrmCsvImportError(
        `CSV 파일은 최대 ${Math.floor(CRM_IMPORT_MAX_BYTES / 1024 / 1024)}MB까지 업로드할 수 있습니다`,
        413,
        "csv_too_large",
      );
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new CrmCsvImportError(
      "CSV 파일이 비어 있습니다",
      400,
      "empty_csv_file",
    );
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > CRM_IMPORT_MAX_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new CrmCsvImportError(
        `CSV 파일은 최대 ${Math.floor(CRM_IMPORT_MAX_BYTES / 1024 / 1024)}MB까지 업로드할 수 있습니다`,
        413,
        "csv_too_large",
      );
    }
    chunks.push(value);
  }
  if (total === 0) {
    throw new CrmCsvImportError(
      "CSV 파일이 비어 있습니다",
      400,
      "empty_csv_file",
    );
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export function decodeUtf8Csv(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: false,
    }).decode(bytes);
  } catch {
    throw new CrmCsvImportError(
      "CSV 파일을 UTF-8로 저장한 뒤 다시 시도해주세요",
      415,
      "invalid_utf8_csv",
    );
  }
}

async function sha256Hex(value: Uint8Array | string): Promise<string> {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function validateImportIdempotencyKey(value: string | undefined): string {
  const key = value?.trim();
  if (!key || !CRM_IMPORT_IDEMPOTENCY_KEY.test(key)) {
    throw new CrmCsvImportError(
      "Idempotency-Key는 8~128자의 영문, 숫자, '.', '_', ':', '-'만 사용할 수 있습니다",
      400,
      "invalid_idempotency_key",
    );
  }
  return key;
}

export async function computeCsvFingerprint(
  bytes: Uint8Array,
): Promise<string> {
  return sha256Hex(bytes);
}

type CustomerRow = { id: string; name: string; active: number };
type SiteRow = {
  id: string;
  customer_id: string;
  name: string;
  active: number;
};
type AssetRow = { id: string; site_id: string; name: string };

interface HierarchyLookup {
  customers: Map<string, CustomerRow>;
  ambiguousCustomers: Set<string>;
  sites: Map<string, SiteRow>;
  ambiguousSites: Set<string>;
  assets: Map<string, AssetRow>;
  ambiguousAssets: Set<string>;
}

function addLookup<T extends { id: string }>(
  map: Map<string, T>,
  ambiguous: Set<string>,
  key: string,
  value: T,
): void {
  const existing = map.get(key);
  if (existing && existing.id !== value.id) ambiguous.add(key);
  else map.set(key, value);
}

function childKey(parentId: string, name: string): string {
  return `${parentId}\u0000${normalizedIdentity(name)}`;
}

async function loadHierarchy(
  db: D1Database,
  orgId: string,
): Promise<HierarchyLookup> {
  const [customerResult, siteResult, assetResult] = await Promise.all([
    db
      .prepare(
        `SELECT c.id, c.name, COALESCE(ms.active, 1) AS active
         FROM customers c
         LEFT JOIN master_entity_states ms
           ON ms.org_id = c.org_id
          AND ms.entity_type = 'customer'
          AND ms.entity_id = c.id
         WHERE c.org_id = ?
         ORDER BY c.id`,
      )
      .bind(orgId)
      .all<CustomerRow>(),
    db
      .prepare(
        `SELECT s.id, s.customer_id, s.name, COALESCE(ms.active, 1) AS active
         FROM sites s
         LEFT JOIN master_entity_states ms
           ON ms.org_id = s.org_id
          AND ms.entity_type = 'site'
          AND ms.entity_id = s.id
         WHERE s.org_id = ?
         ORDER BY s.id`,
      )
      .bind(orgId)
      .all<SiteRow>(),
    db
      .prepare(
        "SELECT id, site_id, name FROM assets WHERE org_id = ? ORDER BY id",
      )
      .bind(orgId)
      .all<AssetRow>(),
  ]);

  const lookup: HierarchyLookup = {
    customers: new Map(),
    ambiguousCustomers: new Set(),
    sites: new Map(),
    ambiguousSites: new Set(),
    assets: new Map(),
    ambiguousAssets: new Set(),
  };
  for (const row of customerResult.results ?? []) {
    addLookup(
      lookup.customers,
      lookup.ambiguousCustomers,
      normalizedIdentity(row.name),
      row,
    );
  }
  for (const row of siteResult.results ?? []) {
    addLookup(
      lookup.sites,
      lookup.ambiguousSites,
      childKey(row.customer_id, row.name),
      row,
    );
  }
  for (const row of assetResult.results ?? []) {
    addLookup(
      lookup.assets,
      lookup.ambiguousAssets,
      childKey(row.site_id, row.name),
      row,
    );
  }
  return lookup;
}

function emptyCounts(): CrmImportEntityCounts {
  return { customers: 0, sites: 0, assets: 0 };
}

function addCounts(
  target: CrmImportEntityCounts,
  addition: CrmImportEntityCounts,
): void {
  target.customers += addition.customers;
  target.sites += addition.sites;
  target.assets += addition.assets;
}

function statementChanges(result: unknown): number {
  if (!result || typeof result !== "object") return 1;
  const meta = (result as { meta?: { changes?: unknown } }).meta;
  return typeof meta?.changes === "number" ? meta.changes : 1;
}

async function deterministicEntityId(
  orgId: string,
  entityType: "customer" | "site" | "asset",
  parentId: string,
  name: string,
): Promise<string> {
  const digest = await sha256Hex(
    `${orgId}\u0000${entityType}\u0000${parentId}\u0000${normalizedIdentity(name)}`,
  );
  return `csv_${entityType}_${digest.slice(0, 40)}`;
}

interface RowImportOutcome {
  created: CrmImportEntityCounts;
  reused: CrmImportEntityCounts;
  error?: string;
}

async function importCandidate(
  db: D1Database,
  args: {
    orgId: string;
    userId: string;
    candidate: CrmImportCandidate;
    lookup: HierarchyLookup;
  },
): Promise<RowImportOutcome> {
  const { orgId, userId, candidate, lookup } = args;
  const created = emptyCounts();
  const reused = emptyCounts();

  const customerIdentity = normalizedIdentity(candidate.customer.name);
  if (lookup.ambiguousCustomers.has(customerIdentity)) {
    return {
      created,
      reused,
      error: "같은 이름의 고객사가 여러 개 있어 대상을 결정할 수 없습니다",
    };
  }

  let customer = lookup.customers.get(customerIdentity);
  const customerWasMissing = !customer;
  if (!customer) {
    customer = {
      id: await deterministicEntityId(
        orgId,
        "customer",
        "",
        candidate.customer.name,
      ),
      name: candidate.customer.name,
      active: 1,
    };
  }
  if (candidate.site && !customer.active) {
    return {
      created,
      reused,
      error: "비활성 고객사에는 현장을 등록할 수 없습니다",
    };
  }

  let site: SiteRow | undefined;
  let siteIdentity: string | undefined;
  let siteWasMissing = false;
  if (candidate.site) {
    siteIdentity = childKey(customer.id, candidate.site.name);
    if (lookup.ambiguousSites.has(siteIdentity)) {
      return {
        created,
        reused,
        error: "해당 고객사에 같은 이름의 현장이 여러 개 있어 대상을 결정할 수 없습니다",
      };
    }
    site = lookup.sites.get(siteIdentity);
    siteWasMissing = !site;
    if (!site) {
      site = {
        id: await deterministicEntityId(
          orgId,
          "site",
          customer.id,
          candidate.site.name,
        ),
        customer_id: customer.id,
        name: candidate.site.name,
        active: 1,
      };
    }
  }
  if (candidate.asset && site && !site.active) {
    return {
      created,
      reused,
      error: "비활성 현장에는 장비를 등록할 수 없습니다",
    };
  }

  let asset: AssetRow | undefined;
  let assetIdentity: string | undefined;
  let assetWasMissing = false;
  if (candidate.asset && site) {
    assetIdentity = childKey(site.id, candidate.asset.name);
    if (lookup.ambiguousAssets.has(assetIdentity)) {
      return {
        created,
        reused,
        error: "해당 현장에 같은 이름의 장비가 여러 개 있어 대상을 결정할 수 없습니다",
      };
    }
    asset = lookup.assets.get(assetIdentity);
    assetWasMissing = !asset;
    if (!asset) {
      asset = {
        id: await deterministicEntityId(
          orgId,
          "asset",
          site.id,
          candidate.asset.name,
        ),
        site_id: site.id,
        name: candidate.asset.name,
      };
    }
  }

  const timestamp = nowIso();
  const statements: D1PreparedStatement[] = [];
  const insertIndex: Partial<
    Record<"customers" | "sites" | "assets", number>
  > = {};

  if (customerWasMissing) {
    insertIndex.customers = statements.length;
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO customers
             (id, org_id, name, biz_no, address, contact_name, contact_phone, memo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          customer.id,
          orgId,
          candidate.customer.name,
          candidate.customer.bizNo ?? null,
          candidate.customer.address ?? null,
          candidate.customer.contactName ?? null,
          candidate.customer.contactPhone ?? null,
          candidate.customer.memo ?? null,
          timestamp,
          timestamp,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO master_entity_states
             (org_id, entity_type, entity_id, active, updated_at, updated_by)
           SELECT ?, 'customer', ?, 1, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM customers WHERE id = ? AND org_id = ?
           )`,
        )
        .bind(
          orgId,
          customer.id,
          timestamp,
          userId,
          customer.id,
          orgId,
        ),
    );
  }

  if (siteWasMissing && site && candidate.site) {
    insertIndex.sites = statements.length;
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO sites
             (id, org_id, customer_id, name, address, access_info, map_url, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM customers WHERE id = ? AND org_id = ?
           )`,
        )
        .bind(
          site.id,
          orgId,
          customer.id,
          candidate.site.name,
          candidate.site.address ?? null,
          candidate.site.accessInfo ?? null,
          candidate.site.mapUrl ?? null,
          timestamp,
          timestamp,
          customer.id,
          orgId,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO master_entity_states
             (org_id, entity_type, entity_id, active, updated_at, updated_by)
           SELECT ?, 'site', ?, 1, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM sites WHERE id = ? AND org_id = ? AND customer_id = ?
           )`,
        )
        .bind(
          orgId,
          site.id,
          timestamp,
          userId,
          site.id,
          orgId,
          customer.id,
        ),
    );
  }

  if (assetWasMissing && asset && site && candidate.asset) {
    insertIndex.assets = statements.length;
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO assets
             (id, org_id, site_id, name, model, serial_no, installed_at, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM sites WHERE id = ? AND org_id = ?
           )`,
        )
        .bind(
          asset.id,
          orgId,
          site.id,
          candidate.asset.name,
          candidate.asset.model ?? null,
          candidate.asset.serialNo ?? null,
          candidate.asset.installedAt ?? null,
          timestamp,
          timestamp,
          site.id,
          orgId,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO master_entity_states
             (org_id, entity_type, entity_id, active, updated_at, updated_by)
           SELECT ?, 'asset', ?, 1, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM assets WHERE id = ? AND org_id = ? AND site_id = ?
           )`,
        )
        .bind(
          orgId,
          asset.id,
          timestamp,
          userId,
          asset.id,
          orgId,
          site.id,
        ),
    );
  }

  let results: unknown[] = [];
  if (statements.length > 0) {
    // D1 batch is transactional, so a storage failure never leaves a partial
    // customer/site/asset hierarchy for this row. Infrastructure failures are
    // surfaced to the caller and remain retryable instead of becoming row errors.
    results = (await db.batch(statements)) as unknown[];
  }

  if (customerWasMissing) {
    const stored = await db
      .prepare(
        `SELECT c.id, c.name, COALESCE(ms.active, 1) AS active
         FROM customers c
         LEFT JOIN master_entity_states ms
           ON ms.org_id = c.org_id
          AND ms.entity_type = 'customer'
          AND ms.entity_id = c.id
         WHERE c.org_id = ? AND c.id = ?`,
      )
      .bind(orgId, customer.id)
      .first<CustomerRow>();
    if (!stored || normalizedIdentity(stored.name) !== customerIdentity) {
      throw new Error("CSV customer insert invariant failed");
    }
    customer = stored;
    lookup.customers.set(customerIdentity, stored);
    if (statementChanges(results[insertIndex.customers!]) > 0) {
      created.customers += 1;
    } else {
      reused.customers += 1;
    }
  } else {
    reused.customers += 1;
  }

  if (site && siteIdentity) {
    if (siteWasMissing) {
      const stored = await db
        .prepare(
          `SELECT s.id, s.customer_id, s.name, COALESCE(ms.active, 1) AS active
           FROM sites s
           LEFT JOIN master_entity_states ms
             ON ms.org_id = s.org_id
            AND ms.entity_type = 'site'
            AND ms.entity_id = s.id
           WHERE s.org_id = ? AND s.id = ? AND s.customer_id = ?`,
        )
        .bind(orgId, site.id, customer.id)
        .first<SiteRow>();
      if (!stored || normalizedIdentity(stored.name) !== normalizedIdentity(site.name)) {
        throw new Error("CSV site insert invariant failed");
      }
      site = stored;
      lookup.sites.set(siteIdentity, stored);
      if (statementChanges(results[insertIndex.sites!]) > 0) {
        created.sites += 1;
      } else {
        reused.sites += 1;
      }
    } else {
      reused.sites += 1;
    }
  }

  if (asset && assetIdentity && site) {
    if (assetWasMissing) {
      const stored = await db
        .prepare(
          "SELECT id, site_id, name FROM assets WHERE org_id = ? AND id = ? AND site_id = ?",
        )
        .bind(orgId, asset.id, site.id)
        .first<AssetRow>();
      if (!stored || normalizedIdentity(stored.name) !== normalizedIdentity(asset.name)) {
        throw new Error("CSV asset insert invariant failed");
      }
      lookup.assets.set(assetIdentity, stored);
      if (statementChanges(results[insertIndex.assets!]) > 0) {
        created.assets += 1;
      } else {
        reused.assets += 1;
      }
    } else {
      reused.assets += 1;
    }
  }

  return { created, reused };
}

interface StoredResultDetail {
  fingerprint: string;
  result: CrmImportResult;
}

function parseStoredFingerprint(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { fingerprint?: unknown };
    return typeof parsed.fingerprint === "string" ? parsed.fingerprint : null;
  } catch {
    return null;
  }
}

function parseStoredDetail(value: string | null): StoredResultDetail | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredResultDetail>;
    if (
      typeof parsed.fingerprint !== "string" ||
      !parsed.result ||
      typeof parsed.result !== "object"
    ) {
      return null;
    }
    return parsed as StoredResultDetail;
  } catch {
    return null;
  }
}

interface ImportClaim {
  claimId: string;
  resultId: string;
  claimToken: string;
  replay: CrmImportResult | null;
}

const IMPORT_CLAIM_LEASE_MS = 10 * 60_000;

async function claimImport(
  db: D1Database,
  args: {
    orgId: string;
    userId: string;
    idempotencyKey: string;
    fingerprint: string;
  },
): Promise<ImportClaim> {
  const keyDigest = await sha256Hex(
    `${args.orgId}\u0000${args.idempotencyKey}`,
  );
  const claimId = `crm_csv_import_${keyDigest}`;
  const resultId = `${claimId}_result`;

  const completed = await db
    .prepare(
      "SELECT detail_json FROM audit_events WHERE id = ? AND org_id = ? AND event = 'crm_csv_import_completed'",
    )
    .bind(resultId, args.orgId)
    .first<{ detail_json: string | null }>();
  if (completed) {
    const detail = parseStoredDetail(completed.detail_json);
    if (!detail) {
      throw new CrmCsvImportError(
        "이 가져오기 키의 저장 결과를 확인할 수 없습니다",
        409,
        "invalid_import_result",
      );
    }
    if (detail.fingerprint !== args.fingerprint) {
      throw new CrmCsvImportError(
        "같은 Idempotency-Key를 다른 CSV 파일에 사용할 수 없습니다",
        409,
        "idempotency_fingerprint_conflict",
      );
    }
    return {
      claimId,
      resultId,
      claimToken: "",
      replay: { ...detail.result, idempotentReplay: true },
    };
  }

  const existingClaim = await db
    .prepare(
      "SELECT event, target, detail_json, created_at FROM audit_events WHERE id = ? AND org_id = ?",
    )
    .bind(claimId, args.orgId)
    .first<{
      event: string;
      target: string;
      detail_json: string | null;
      created_at: string;
    }>();
  if (existingClaim) {
    const fingerprint = parseStoredFingerprint(existingClaim.detail_json);
    if (!fingerprint) {
      throw new CrmCsvImportError(
        "이 가져오기 키의 처리 상태를 확인할 수 없습니다",
        409,
        "invalid_import_claim",
      );
    }
    if (fingerprint !== args.fingerprint) {
      throw new CrmCsvImportError(
        "같은 Idempotency-Key를 다른 CSV 파일에 사용할 수 없습니다",
        409,
        "idempotency_fingerprint_conflict",
      );
    }

    const claimedAt = Date.parse(existingClaim.created_at);
    const claimExpired =
      !Number.isFinite(claimedAt) ||
      Date.now() - claimedAt >= IMPORT_CLAIM_LEASE_MS;
    const retryable =
      existingClaim.event === "crm_csv_import_failed" ||
      (existingClaim.event === "crm_csv_import_claimed" && claimExpired);
    if (!retryable) {
      throw new CrmCsvImportError(
        "같은 키의 CSV 가져오기가 이미 처리 중입니다",
        409,
        "import_already_in_progress",
      );
    }

    const claimToken = crypto.randomUUID();
    const reclaimedAt = nowIso();
    const reclaimed = await db
      .prepare(
        `UPDATE audit_events
         SET actor_user_id = ?,
             event = 'crm_csv_import_claimed',
             target = ?,
             detail_json = ?,
             created_at = ?
         WHERE id = ? AND org_id = ? AND event = ? AND target = ?`,
      )
      .bind(
        args.userId,
        claimToken,
        JSON.stringify({
          fingerprint: args.fingerprint,
          idempotencyKey: args.idempotencyKey,
          result: null,
        }),
        reclaimedAt,
        claimId,
        args.orgId,
        existingClaim.event,
        existingClaim.target,
      )
      .run();
    if ((reclaimed.meta.changes ?? 0) !== 1) {
      throw new CrmCsvImportError(
        "같은 키의 CSV 가져오기가 이미 처리 중입니다",
        409,
        "import_already_in_progress",
      );
    }
    return { claimId, resultId, claimToken, replay: null };
  }

  const claimToken = crypto.randomUUID();
  await db
    .prepare(
      `INSERT OR IGNORE INTO audit_events
         (id, org_id, actor_user_id, event, target, detail_json, created_at)
       VALUES (?, ?, ?, 'crm_csv_import_claimed', ?, ?, ?)`,
    )
    .bind(
      claimId,
      args.orgId,
      args.userId,
      claimToken,
      JSON.stringify({
        fingerprint: args.fingerprint,
        idempotencyKey: args.idempotencyKey,
        result: null,
      }),
      nowIso(),
    )
    .run();

  const wonClaim = await db
    .prepare(
      "SELECT event, target, detail_json FROM audit_events WHERE id = ? AND org_id = ?",
    )
    .bind(claimId, args.orgId)
    .first<{ event: string; target: string; detail_json: string | null }>();
  const wonFingerprint = parseStoredFingerprint(wonClaim?.detail_json ?? null);
  if (!wonClaim || wonFingerprint !== args.fingerprint) {
    throw new CrmCsvImportError(
      "같은 Idempotency-Key를 다른 CSV 파일에 사용할 수 없습니다",
      409,
      "idempotency_fingerprint_conflict",
    );
  }
  if (
    wonClaim.event !== "crm_csv_import_claimed" ||
    wonClaim.target !== claimToken
  ) {
    throw new CrmCsvImportError(
      "같은 키의 CSV 가져오기가 이미 처리 중입니다",
      409,
      "import_already_in_progress",
    );
  }
  return { claimId, resultId, claimToken, replay: null };
}

async function markImportFailed(
  db: D1Database,
  args: {
    orgId: string;
    idempotencyKey: string;
    fingerprint: string;
    claim: ImportClaim;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE audit_events
       SET event = 'crm_csv_import_failed',
           detail_json = ?,
           created_at = ?
       WHERE id = ?
         AND org_id = ?
         AND event = 'crm_csv_import_claimed'
         AND target = ?`,
    )
    .bind(
      JSON.stringify({
        fingerprint: args.fingerprint,
        idempotencyKey: args.idempotencyKey,
        result: null,
      }),
      nowIso(),
      args.claim.claimId,
      args.orgId,
      args.claim.claimToken,
    )
    .run();
}

async function renewImportClaim(
  db: D1Database,
  args: { orgId: string; claim: ImportClaim },
): Promise<void> {
  const renewed = await db
    .prepare(
      `UPDATE audit_events
       SET created_at = ?
       WHERE id = ?
         AND org_id = ?
         AND event = 'crm_csv_import_claimed'
         AND target = ?`,
    )
    .bind(
      nowIso(),
      args.claim.claimId,
      args.orgId,
      args.claim.claimToken,
    )
    .run();
  if (renewed.meta.changes !== 1) {
    throw new CrmCsvImportError(
      "CSV 가져오기 처리 권한이 만료되었습니다. 같은 키로 결과를 다시 확인해주세요",
      409,
      "import_claim_lost",
    );
  }
}

export async function executeCrmImport(
  db: D1Database,
  args: {
    orgId: string;
    userId: string;
    idempotencyKey: string;
    fingerprint: string;
    parsed: ParsedCrmImport;
  },
): Promise<CrmImportResult> {
  const claim = await claimImport(db, args);
  if (claim.replay) return claim.replay;

  try {
    const lookup = await loadHierarchy(db, args.orgId);
    const created = emptyCounts();
    const reused = emptyCounts();
    const errors = [...args.parsed.errors];
    let succeededRows = 0;

    for (const candidate of args.parsed.rows) {
      const outcome = await importCandidate(db, {
        orgId: args.orgId,
        userId: args.userId,
        candidate,
        lookup,
      });
      if (outcome.error) {
        errors.push({ row: candidate.sourceRow, reason: outcome.error });
      } else {
        succeededRows += 1;
        addCounts(created, outcome.created);
        addCounts(reused, outcome.reused);
      }
      await renewImportClaim(db, { orgId: args.orgId, claim });
    }
    errors.sort((left, right) => left.row - right.row);

    const result: CrmImportResult = {
      idempotencyKey: args.idempotencyKey,
      fingerprint: args.fingerprint,
      totalRows: args.parsed.totalRows,
      succeededRows,
      failedRows: errors.length,
      created,
      reused,
      errors,
      idempotentReplay: false,
    };

    const completedAt = nowIso();
    const completion = await db.batch([
      db
        .prepare(
          `UPDATE audit_events
           SET event = 'crm_csv_import_finalized', created_at = ?
           WHERE id = ?
             AND org_id = ?
             AND event = 'crm_csv_import_claimed'
             AND target = ?`,
        )
        .bind(
          completedAt,
          claim.claimId,
          args.orgId,
          claim.claimToken,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO audit_events
             (id, org_id, actor_user_id, event, target, detail_json, created_at)
           SELECT ?, ?, ?, 'crm_csv_import_completed', ?, ?, ?
           WHERE EXISTS (
             SELECT 1
             FROM audit_events
             WHERE id = ?
               AND org_id = ?
               AND event = 'crm_csv_import_finalized'
               AND target = ?
           )`,
        )
        .bind(
          claim.resultId,
          args.orgId,
          args.userId,
          claim.claimId,
          JSON.stringify({ fingerprint: args.fingerprint, result }),
          completedAt,
          claim.claimId,
          args.orgId,
          claim.claimToken,
        ),
    ]);
    if (
      completion[0]?.meta.changes !== 1 ||
      completion[1]?.meta.changes !== 1
    ) {
      throw new CrmCsvImportError(
        "CSV 가져오기 처리 권한이 만료되었습니다. 같은 키로 결과를 다시 확인해주세요",
        409,
        "import_claim_lost",
      );
    }

    const storedCompletion = await db
      .prepare(
        "SELECT detail_json FROM audit_events WHERE id = ? AND org_id = ? AND event = 'crm_csv_import_completed'",
      )
      .bind(claim.resultId, args.orgId)
      .first<{ detail_json: string | null }>();
    const storedDetail = parseStoredDetail(
      storedCompletion?.detail_json ?? null,
    );
    if (
      !storedDetail ||
      storedDetail.fingerprint !== args.fingerprint
    ) {
      throw new Error("CSV import completion invariant failed");
    }

    return result;
  } catch (error) {
    await markImportFailed(db, {
      orgId: args.orgId,
      idempotencyKey: args.idempotencyKey,
      fingerprint: args.fingerprint,
      claim,
    }).catch(() => undefined);
    throw error;
  }
}
