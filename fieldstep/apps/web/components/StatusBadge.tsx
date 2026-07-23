import {
  APPROVAL_STATUS_LABELS,
  BILLING_STATUS_LABELS,
  WORK_STATUS_LABELS,
  type ApprovalStatus,
  type BillingStatus,
  type WorkStatus,
} from "@fieldstep/shared";

const WORK_COLOR: Record<WorkStatus, string> = {
  draft: "bg-line text-ink-dim",
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-amber-100 text-amber-800",
  submitted: "bg-violet-100 text-violet-800",
  reviewed: "bg-sky-100 text-sky-800",
  completed: "bg-done/15 text-done",
  canceled: "bg-red-100 text-red-700",
};

const APPROVAL_COLOR: Record<ApprovalStatus, string> = {
  not_sent: "bg-line text-ink-dim",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-done/15 text-done",
  revision_requested: "bg-red-100 text-red-700",
  expired: "bg-line text-muted",
};

const BILLING_COLOR: Record<BillingStatus, string> = {
  none: "bg-line text-ink-dim",
  billable: "bg-primary/10 text-primary",
  billed: "bg-sky-100 text-sky-800",
  overdue: "bg-red-100 text-red-700",
  paid: "bg-done/15 text-done",
};

function Badge({ className, label }: { className: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  return <Badge className={WORK_COLOR[status]} label={WORK_STATUS_LABELS[status]} />;
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return <Badge className={APPROVAL_COLOR[status]} label={APPROVAL_STATUS_LABELS[status]} />;
}

export function BillingStatusBadge({ status }: { status: BillingStatus }) {
  return <Badge className={BILLING_COLOR[status]} label={BILLING_STATUS_LABELS[status]} />;
}
