/**
 * 고객사·현장·장비 CSV 가져오기 계약.
 *
 * 한국어/영문 템플릿은 같은 canonical key로 매핑된다. 고객사명만 필수이며,
 * 현장 또는 장비 열을 채우는 경우에는 상위 단계의 이름도 함께 입력해야 한다.
 */
export const CRM_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const CRM_IMPORT_MAX_ROWS = 2_000;

export const CRM_IMPORT_COLUMNS = [
  {
    key: "customerName",
    ko: "고객사명",
    en: "customer_name",
    required: true,
  },
  {
    key: "customerBizNo",
    ko: "고객사 사업자번호",
    en: "customer_business_no",
    required: false,
  },
  {
    key: "customerAddress",
    ko: "고객사 주소",
    en: "customer_address",
    required: false,
  },
  {
    key: "customerContactName",
    ko: "고객사 담당자",
    en: "customer_contact_name",
    required: false,
  },
  {
    key: "customerContactPhone",
    ko: "고객사 연락처",
    en: "customer_contact_phone",
    required: false,
  },
  {
    key: "customerMemo",
    ko: "고객사 메모",
    en: "customer_memo",
    required: false,
  },
  {
    key: "siteName",
    ko: "현장명",
    en: "site_name",
    required: false,
  },
  {
    key: "siteAddress",
    ko: "현장 주소",
    en: "site_address",
    required: false,
  },
  {
    key: "siteAccessInfo",
    ko: "현장 출입정보",
    en: "site_access_info",
    required: false,
  },
  {
    key: "siteMapUrl",
    ko: "현장 지도 URL",
    en: "site_map_url",
    required: false,
  },
  {
    key: "assetName",
    ko: "장비명",
    en: "asset_name",
    required: false,
  },
  {
    key: "assetModel",
    ko: "장비 모델",
    en: "asset_model",
    required: false,
  },
  {
    key: "assetSerialNo",
    ko: "장비 일련번호",
    en: "asset_serial_no",
    required: false,
  },
  {
    key: "assetInstalledAt",
    ko: "장비 설치일",
    en: "asset_installed_at",
    required: false,
  },
] as const;

export type CrmImportColumnKey = (typeof CRM_IMPORT_COLUMNS)[number]["key"];
export type CrmImportTemplateLanguage = "ko" | "en";

export interface CrmImportEntityCounts {
  customers: number;
  sites: number;
  assets: number;
}

export interface CrmImportRowError {
  /** 헤더와 인용 필드 안의 개행까지 포함한 원본 CSV의 1-based 물리 행 번호. */
  row: number;
  reason: string;
}

export interface CrmImportResult {
  idempotencyKey: string;
  fingerprint: string;
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  created: CrmImportEntityCounts;
  reused: CrmImportEntityCounts;
  errors: CrmImportRowError[];
  idempotentReplay: boolean;
}

export interface CrmImportResponse {
  import: CrmImportResult;
}

/** Excel에서도 UTF-8 한국어를 바로 인식하도록 BOM과 CRLF를 포함한다. */
export function createCrmImportTemplate(
  language: CrmImportTemplateLanguage,
): string {
  const header = CRM_IMPORT_COLUMNS.map((column) => column[language]).join(",");
  return `\uFEFF${header}\r\n`;
}
