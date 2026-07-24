/**
 * better-sqlite3를 D1Database와 호환되는 최소 인터페이스로 감싸는 테스트 전용 shim.
 * prepare/bind/first/all/run/batch/exec만 구현한다 (워커가 실제로 쓰는 표면).
 */
import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_PATH = path.join(__dirname, "..", "..", "d1");

class D1StatementShim {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...values: unknown[]): D1StatementShim {
    return new D1StatementShim(this.db, this.sql, values);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.params as never[])) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (colName ? (row[colName] as T) : (row as T)) ?? null;
  }

  runSync(): { success: boolean; meta: { changes: number; last_row_id: number | bigint } } {
    const info = this.db.prepare(this.sql).run(...(this.params as never[]));
    return { success: true, meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
  }

  async run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number | bigint } }> {
    return this.runSync();
  }

  async all<T = unknown>(): Promise<{ success: boolean; results: T[]; meta: Record<string, unknown> }> {
    const rows = this.db.prepare(this.sql).all(...(this.params as never[])) as T[];
    return { success: true, results: rows, meta: {} };
  }
}

class D1DatabaseShim {
  constructor(private readonly db: Database.Database) {}

  prepare(sql: string): D1StatementShim {
    return new D1StatementShim(this.db, sql);
  }

  async batch<T = unknown>(statements: D1StatementShim[]): Promise<unknown[]> {
    const execute = this.db.transaction((batch: D1StatementShim[]) =>
      batch.map((statement) => statement.runSync()),
    );
    return execute(statements) as T[];
  }

  async exec(sql: string): Promise<{ count: number; duration: number }> {
    this.db.exec(sql);
    return { count: 0, duration: 0 };
  }
}

/** 메모리 D1(SQLite) 인스턴스를 생성하고 실제 배포 순서로 모든 마이그레이션을 적용한다. */
export function createTestDb(): D1Database {
  const raw = new Database(":memory:");
  raw.pragma("foreign_keys = ON");
  raw.pragma("journal_mode = WAL");
  const migrations = readdirSync(MIGRATIONS_PATH)
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort();
  for (const migration of migrations) {
    raw.exec(readFileSync(path.join(MIGRATIONS_PATH, migration), "utf-8"));
  }
  return new D1DatabaseShim(raw) as unknown as D1Database;
}
