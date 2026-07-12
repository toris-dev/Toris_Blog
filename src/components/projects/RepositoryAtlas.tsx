'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiArrowUpRight } from '@react-icons/all-files/fi/FiArrowUpRight';
import { FiGithub } from '@react-icons/all-files/fi/FiGithub';
import { FiSearch } from '@react-icons/all-files/fi/FiSearch';
import { FiShuffle } from '@react-icons/all-files/fi/FiShuffle';
import {
  githubRepositories,
  repositoryKinds,
  type GitHubRepository,
  type RepositoryKind
} from '@/data/githubRepositories';
import { cn } from '@/utils/style';

const KIND_STYLE: Record<
  RepositoryKind,
  { dot: string; text: string; wash: string }
> = {
  Product: {
    dot: '#2563EB',
    text: 'text-blue-700 dark:text-blue-300',
    wash: 'from-blue-500/15 to-cyan-400/5'
  },
  'Open source': {
    dot: '#8B5CF6',
    text: 'text-violet-700 dark:text-violet-300',
    wash: 'from-violet-500/15 to-fuchsia-400/5'
  },
  Learning: {
    dot: '#F59E0B',
    text: 'text-amber-700 dark:text-amber-300',
    wash: 'from-amber-500/15 to-orange-400/5'
  },
  Archive: {
    dot: '#64748B',
    text: 'text-slate-600 dark:text-slate-300',
    wash: 'from-slate-500/15 to-slate-400/5'
  }
};

const EASE = [0.16, 1, 0.3, 1] as const;

function RepoLink({ repo }: { repo: GitHubRepository }) {
  const style = KIND_STYLE[repo.kind];
  return (
    <motion.a
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      href={`https://github.com/toris-dev/${repo.repo}`}
      data-repository-card={repo.repo}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border border-slate-900/10 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-900/20 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:border-white/10 dark:bg-[#0b101c] dark:hover:border-white/20"
    >
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          style.wash
        )}
      />
      <div className="relative flex items-center justify-between gap-3">
        <span
          className={cn(
            'text-[10px] font-semibold uppercase tracking-[0.16em]',
            style.text
          )}
        >
          {repo.kind}
        </span>
        <FiArrowUpRight
          className="size-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      <h3 className="relative mt-4 break-words font-mono text-sm font-bold text-slate-900 dark:text-white">
        {repo.repo}
      </h3>
      <p className="relative mt-2 line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-400">
        {repo.description}
      </p>
      <span className="relative mt-auto pt-4 text-[10px] font-medium text-slate-500 dark:text-slate-500">
        {repo.tech}
      </span>
    </motion.a>
  );
}

export default function RepositoryAtlas() {
  const reduce = useReducedMotion();
  const [kind, setKind] = useState<'All' | RepositoryKind>('All');
  const [query, setQuery] = useState('');
  const [spotlight, setSpotlight] = useState<GitHubRepository>(
    githubRepositories[0]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ko');
    return githubRepositories.filter((repo) => {
      const matchesKind = kind === 'All' || repo.kind === kind;
      const matchesQuery =
        !needle ||
        `${repo.repo} ${repo.description} ${repo.tech}`
          .toLocaleLowerCase('ko')
          .includes(needle);
      return matchesKind && matchesQuery;
    });
  }, [kind, query]);

  const surprise = () => {
    const pool = visible.length > 0 ? visible : githubRepositories;
    const current = pool.indexOf(spotlight);
    const next = pool[(current + 7) % pool.length];
    setSpotlight(next);
  };

  return (
    <section
      id="repository-atlas"
      className="relative overflow-hidden border-y border-slate-900/10 bg-[#eef2f8] px-4 py-24 dark:border-white/10 dark:bg-[#070b13] sm:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(71,85,105,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(71,85,105,0.1)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] dark:opacity-20"
      />
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: EASE }}
          className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.7)]" />
              GitHub signal · live index
            </div>
            <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-6xl">
              {githubRepositories.length}개의 저장소,
              <span className="block text-slate-500 dark:text-slate-400">
                하나의 개발 궤적.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-slate-600 dark:text-slate-400">
              출시한 제품뿐 아니라 오픈소스, 수업에서 부딪힌 문제, 오래된
              실험까지 모두 남겼습니다. 이름이나 기술로 전체 기록을 탐색하세요.
            </p>
          </div>
          <a
            href="https://github.com/toris-dev?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-900/15 bg-white/70 px-5 text-sm font-semibold text-slate-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <FiGithub aria-hidden /> GitHub에서 전체 보기
          </a>
        </motion.div>

        <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-slate-900/10 bg-white/65 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] dark:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <div className="border-b border-slate-900/10 px-5 py-4 dark:border-white/10">
            <div className="flex items-center gap-1" aria-label="저장소 좌표">
              {githubRepositories.map((repo) => (
                <button
                  key={repo.repo}
                  type="button"
                  onClick={() => setSpotlight(repo)}
                  className="group relative h-8 min-w-1 flex-1 focus-visible:z-10 focus-visible:outline-none"
                  aria-label={`${repo.repo} 집중 보기`}
                >
                  <motion.span
                    className="absolute inset-x-0.5 bottom-1 rounded-full"
                    style={{ backgroundColor: KIND_STYLE[repo.kind].dot }}
                    animate={{
                      height: spotlight.repo === repo.repo ? 24 : 5,
                      opacity: spotlight.repo === repo.repo ? 1 : 0.45
                    }}
                    transition={{ duration: reduce ? 0 : 0.28, ease: EASE }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <div className="relative overflow-hidden border-b border-slate-900/10 p-6 dark:border-white/10 sm:p-8 lg:border-b-0 lg:border-r">
              <AnimatePresence mode="wait">
                <motion.div
                  key={spotlight.repo}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={cn(
                        'text-xs font-bold',
                        KIND_STYLE[spotlight.kind].text
                      )}
                    >
                      {spotlight.kind}
                    </span>
                    <button
                      type="button"
                      onClick={surprise}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 px-3 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <FiShuffle aria-hidden /> 다른 좌표
                    </button>
                  </div>
                  <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                    toris-dev /
                  </p>
                  <h3 className="mt-3 break-words font-mono text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    {spotlight.repo}
                  </h3>
                  <p className="mt-5 max-w-md leading-7 text-slate-600 dark:text-slate-400">
                    {spotlight.description}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <a
                      href={`https://github.com/toris-dev/${spotlight.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:scale-[1.02] dark:bg-white dark:text-slate-950"
                    >
                      <FiGithub aria-hidden /> 저장소 열기
                    </a>
                    <span className="rounded-full border border-slate-900/10 px-3 py-2 font-mono text-[10px] text-slate-500 dark:border-white/10">
                      {spotlight.tech}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-5 sm:p-8">
              <label className="relative block" htmlFor="repository-search">
                <FiSearch
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="repository-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="저장소 이름, 기술, 설명 검색"
                  className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white/70 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <div
                role="tablist"
                aria-label="저장소 분류"
                className="mt-4 flex flex-wrap gap-2"
              >
                {repositoryKinds.map((item) => {
                  const selected = kind === item;
                  const count =
                    item === 'All'
                      ? githubRepositories.length
                      : githubRepositories.filter((repo) => repo.kind === item)
                          .length;
                  return (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setKind(item)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
                        selected
                          ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
                          : 'border-slate-900/10 text-slate-500 hover:bg-slate-900/5 dark:border-white/10 dark:hover:bg-white/5'
                      )}
                    >
                      {item} <span className="ml-1 opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                <span>{visible.length} repositories</span>
                {(query || kind !== 'All') && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setKind('All');
                    }}
                    className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900 dark:hover:text-white"
                  >
                    필터 지우기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.div
          layout
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((repo) => (
              <RepoLink key={repo.repo} repo={repo} />
            ))}
          </AnimatePresence>
        </motion.div>
        {visible.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-900/15 p-10 text-center text-sm text-slate-500 dark:border-white/15">
            일치하는 저장소가 없습니다. 이름 대신 기술 키워드로 검색해 보세요.
          </div>
        )}
      </div>
    </section>
  );
}
