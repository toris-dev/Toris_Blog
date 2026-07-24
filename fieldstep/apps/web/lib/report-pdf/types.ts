import type { ChecklistItem, StructuredDraft } from "@fieldstep/shared";

export const REPORT_PDF_RENDERER_VERSION = "fieldstep-pdf-v1";

export type ReportPdfImageKind = "logo" | "before" | "after" | "other";
export type ReportPdfImageMimeType = "image/jpeg" | "image/png";

export interface ReportPdfBinaryImage {
  id: string;
  kind: ReportPdfImageKind;
  bytes: Uint8Array;
  mimeType: ReportPdfImageMimeType;
  caption: string | null;
  createdAt?: string;
}

export interface ReportPdfOrganization {
  name: string;
  businessNo: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  logo: ReportPdfBinaryImage | null;
}

export interface ReportPdfContext {
  org: ReportPdfOrganization;
  workOrder: {
    id: string;
    scheduledDate: string;
    scheduledTime: string | null;
    workType: string;
    request: string | null;
  };
  customer: {
    id: string;
    name: string;
    businessNo?: string | null;
    address: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
  };
  site: {
    id: string;
    name: string;
    address: string | null;
  };
  asset: {
    id: string;
    name: string;
    model: string | null;
    serialNo: string | null;
  } | null;
  assigneeNames: string[];
}

export interface ImmutableReportPdfSource {
  reportVersionId: string;
  workOrderId: string;
  reportNumber: string;
  version: number;
  templateVersion: number;
  rendererVersion: typeof REPORT_PDF_RENDERER_VERSION;
  sourceSha256: string;
  createdAt: string;
  createdBy: string;
  context: ReportPdfContext;
  structured: Pick<
    StructuredDraft,
    | "workSummary"
    | "actions"
    | "usedParts"
    | "checklist"
    | "fieldNotes"
    | "issues"
    | "recommendations"
    | "nextInspectionDate"
  > & {
    checklist: ChecklistItem[];
  };
  photos: ReportPdfBinaryImage[];
}

export interface ReportPdfFonts {
  regular: Uint8Array;
  semibold?: Uint8Array;
}

export type ReportPdfProgressStage =
  | "font"
  | "content"
  | "photos"
  | "approval-page"
  | "save";

export interface ReportPdfProgress {
  stage: ReportPdfProgressStage;
  completed: number;
  total: number;
}

export interface RenderReportPdfOptions {
  fonts: ReportPdfFonts;
  onProgress?: (progress: ReportPdfProgress) => void;
}

export interface RenderedReportPdf {
  bytes: Uint8Array;
  pageCount: number;
  approvalPageIndex: number;
  sourceSha256: string;
  rendererVersion: typeof REPORT_PDF_RENDERER_VERSION;
}

export interface SignedPdfReceipt {
  reportVersionId: string;
  approvalRequestId: string;
  sourceSha256: string;
  signerName: string;
  signerTitle: string | null;
  approvedAt: string;
  agreementVersion: string;
  signaturePng: Uint8Array;
}

export interface StampedSignedPdf {
  bytes: Uint8Array;
  pageCount: number;
  approvalPageIndex: number;
  sourceSha256: string;
  rendererVersion: typeof REPORT_PDF_RENDERER_VERSION;
}
