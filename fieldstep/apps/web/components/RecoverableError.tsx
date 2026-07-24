"use client";

type RecoverableErrorProps = {
  title: string;
  message: string;
  nextAction?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function RecoverableError({
  title,
  message,
  nextAction = "네트워크 연결을 확인한 뒤 다시 시도해주세요.",
  onRetry,
  retryLabel = "다시 시도",
  className,
}: RecoverableErrorProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 ${className ?? ""}`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 break-words">{message}</p>
      <p className="mt-1 text-xs leading-5 text-red-700">{nextAction}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-ghost tap-target mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-800"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
