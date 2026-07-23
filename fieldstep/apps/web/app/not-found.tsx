import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg text-center text-ink">
      <p className="text-sm text-muted">404</p>
      <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다.</h1>
      <Link href="/" className="btn-primary rounded-lg px-4 py-2 font-medium">
        홈으로
      </Link>
    </main>
  );
}
