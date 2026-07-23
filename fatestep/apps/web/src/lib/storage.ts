// 익명 로컬 저장소. storage_service.dart 를 localStorage 기반으로 이식한다.
// 서버 없음 — 모든 기록·설정은 이 기기(브라우저)에만 남는다.
import type { Reading } from './types';

const K_READINGS = 'fate.readings.v1';
const K_NICKNAME = 'fate.nickname';
const K_REDUCE_MOTION = 'fate.reduceMotion';
const K_SAVE_QUESTION = 'fate.saveQuestionDefault';
const K_ONBOARDED = 'fate.onboarded';

const hasStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

function readRaw(key: string): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 저장 실패는 조용히 무시한다. */
  }
}

function removeRaw(key: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ----------------------------------------------------------------- readings

export function getReadings(): Reading[] {
  const raw = readRaw(K_READINGS);
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const readings = parsed.filter((r): r is Reading => !!r && typeof r === 'object');
  readings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return readings;
}

function persist(readings: Reading[]): void {
  writeRaw(K_READINGS, JSON.stringify(readings));
}

export function readingById(id: string): Reading | undefined {
  return getReadings().find((r) => r.id === id);
}

export function saveReading(reading: Reading): void {
  const readings = getReadings().filter((r) => r.id !== reading.id);
  readings.unshift(reading);
  readings.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  persist(readings);
}

export const updateReading = saveReading;

export function deleteReading(id: string): void {
  persist(getReadings().filter((r) => r.id !== id));
}

export function deleteAllReadings(): void {
  persist([]);
}

export function deleteEverything(): void {
  removeRaw(K_READINGS);
  removeRaw(K_NICKNAME);
  removeRaw(K_REDUCE_MOTION);
  removeRaw(K_SAVE_QUESTION);
  removeRaw(K_ONBOARDED);
}

// -------------------------------------------------------------- daily/stats

export function todaysDaily(readings = getReadings()): Reading | undefined {
  const today = dateKey(new Date());
  return readings.find(
    (r) => r.spread === 'daily' && dateKey(new Date(r.createdAt)) === today,
  );
}

/** 연속 기록 일수. 오늘 또는 어제부터 거슬러 올라가며 센다. */
export function streakDays(readings = getReadings()): number {
  if (readings.length === 0) return 0;
  const days = new Set(readings.map((r) => dateKey(new Date(r.createdAt))));
  const now = new Date();
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dateKey(cursor))) {
    cursor = new Date(cursor.getTime() - 86400000);
    if (!days.has(dateKey(cursor))) return 0;
  }
  let count = 0;
  while (days.has(dateKey(cursor))) {
    count++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return count;
}

export function topKeywords(limit = 6, readings = getReadings()): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const r of readings) {
    for (const s of r.interpretation.cardSections) {
      for (const k of s.keywords) map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function completedActionCount(readings = getReadings()): number {
  return readings.filter((r) => r.actionCompletedAt !== null).length;
}

// ---------------------------------------------------------------- settings

export const getNickname = (): string => readRaw(K_NICKNAME) ?? '';
export const setNickname = (v: string): void => writeRaw(K_NICKNAME, v.trim());

export const getReduceMotion = (): boolean => readRaw(K_REDUCE_MOTION) === '1';
export const setReduceMotion = (v: boolean): void => writeRaw(K_REDUCE_MOTION, v ? '1' : '0');

export const getSaveQuestionDefault = (): boolean => readRaw(K_SAVE_QUESTION) === '1';
export const setSaveQuestionDefault = (v: boolean): void =>
  writeRaw(K_SAVE_QUESTION, v ? '1' : '0');

export const hasOnboarded = (): boolean => readRaw(K_ONBOARDED) === '1';
export const setOnboarded = (): void => writeRaw(K_ONBOARDED, '1');
