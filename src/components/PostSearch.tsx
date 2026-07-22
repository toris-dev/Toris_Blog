import { useMemo, useState } from 'react';

/**
 * 블로그 검색/필터 — 요구사항에 따라 상호작용이 필요한 이 부분만
 * React 아일랜드(client directive)로 하이드레이트한다.
 */
export interface PostItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  dateLabel: string;
}

export default function PostSearch({ posts }: { posts: PostItem[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | string>('All');

  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return ['All', ...Array.from(set).sort()];
  }, [posts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [posts, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">글 검색</span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·내용 검색"
            className="h-11 w-full rounded-full border border-line bg-card pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </label>
        <p className="text-sm tabular-nums text-muted">
          {visible.length} / {posts.length}개의 글
        </p>
      </div>

      <div
        role="tablist"
        aria-label="카테고리 필터"
        className="mt-5 flex flex-wrap gap-2"
      >
        {categories.map((c) => {
          const selected = category === c;
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setCategory(c)}
              className={
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ' +
                (selected
                  ? 'border-brand bg-brand text-ink'
                  : 'border-line bg-card text-muted hover:border-brand-deep hover:text-brand-bright')
              }
            >
              {c}
            </button>
          );
        })}
      </div>

      <ul className="mt-8 divide-y divide-line">
        {visible.map((p) => (
          <li key={p.slug}>
            <a
              href={`/posts/${encodeURIComponent(p.slug)}`}
              className="group block rounded-xl px-3 py-5 transition-colors hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">
                  {p.category}
                </span>
                {p.dateLabel && <time dateTime={p.date} className="text-muted">{p.dateLabel}</time>}
              </div>
              <h3 className="mt-2 text-lg font-bold text-ink group-hover:text-brand-bright">
                {p.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                {p.description}
              </p>
            </a>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-16 text-center text-sm text-muted">
            조건에 맞는 글이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}
