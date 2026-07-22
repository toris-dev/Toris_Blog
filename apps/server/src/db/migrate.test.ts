import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationSql = readFileSync(
  resolve(__dirname, "../../drizzle/0000_init.sql"),
  "utf-8",
);

describe("0000_init.sql", () => {
  let client: PGlite;

  beforeAll(async () => {
    client = new PGlite();
    await client.exec(migrationSql);
  });

  afterAll(async () => {
    await client.close();
  });

  const expectedTables = [
    "builders",
    "projects",
    "stage_history",
    "diagnosis_surveys",
    "diagnosis_responses",
    "task_templates",
    "tasks",
    "metrics",
    "retro_reports",
    "posts",
    "comments",
    "entitlements",
    "billing_events",
    "pricing_plans",
  ];

  it("creates all 14 domain tables", async () => {
    const result = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    );
    const tableNames = result.rows.map((row) => row.table_name);

    for (const table of expectedTables) {
      expect(tableNames).toContain(table);
    }
    expect(tableNames).toHaveLength(expectedTables.length);
  });

  it("creates the 8-stage enum type with the contract values", async () => {
    const result = await client.query<{ enumlabel: string }>(
      `select e.enumlabel from pg_enum e
       join pg_type t on e.enumtypid = t.oid
       where t.typname = 'stage'
       order by e.enumsortorder`,
    );
    expect(result.rows.map((r) => r.enumlabel)).toEqual([
      "idea",
      "validation",
      "mvp",
      "launch",
      "user_acquisition",
      "first_revenue",
      "recurring_revenue",
      "growth",
    ]);
  });

  it("creates the domain enum types with the contract values", async () => {
    const enums: Record<string, string[]> = {
      plan: ["monthly", "yearly"],
      channel: ["PG", "APPLE", "GOOGLE"],
      subscription_status: ["active", "grace", "canceled", "expired", "refunded"],
      billing_verification: ["verified", "rejected"],
      auth_provider: ["google", "apple", "github"],
      stage_change_source: ["diagnosis", "rediagnosis"],
      task_status: ["todo", "done"],
      metric_kind: ["users", "revenue", "custom"],
    };

    for (const [typeName, values] of Object.entries(enums)) {
      const result = await client.query<{ enumlabel: string }>(
        `select e.enumlabel from pg_enum e
         join pg_type t on e.enumtypid = t.oid
         where t.typname = $1
         order by e.enumsortorder`,
        [typeName],
      );
      expect(result.rows.map((r) => r.enumlabel)).toEqual(values);
    }
  });

  it("enforces the (channel, event_id) idempotency key on billing_events", async () => {
    const builder = await client.query<{ id: string }>(
      `insert into builders (email, provider, nickname) values ('a@example.com', 'google', 'A') returning id`,
    );
    const builderId = builder.rows[0]?.id;
    if (!builderId) throw new Error("builder insert did not return an id");

    await client.query(
      `insert into billing_events (channel, event_id, type, verification, builder_id, payload)
       values ('PG', 'evt_1', 'purchase', 'verified', $1, '{}'::jsonb)`,
      [builderId],
    );

    await expect(
      client.query(
        `insert into billing_events (channel, event_id, type, verification, builder_id, payload)
         values ('PG', 'evt_1', 'purchase', 'verified', $1, '{}'::jsonb)`,
        [builderId],
      ),
    ).rejects.toThrow();

    // Different channel, same event_id must be allowed (composite key).
    await expect(
      client.query(
        `insert into billing_events (channel, event_id, type, verification, builder_id, payload)
         values ('APPLE', 'evt_1', 'purchase', 'verified', $1, '{}'::jsonb)`,
        [builderId],
      ),
    ).resolves.toBeDefined();
  });

  it("enforces builder_id uniqueness on entitlements", async () => {
    const builder = await client.query<{ id: string }>(
      `insert into builders (email, provider, nickname) values ('b@example.com', 'google', 'B') returning id`,
    );
    const builderId = builder.rows[0]?.id;
    if (!builderId) throw new Error("builder insert did not return an id");

    await client.query(
      `insert into entitlements (builder_id, plan, channel, status, current_period_end)
       values ($1, 'monthly', 'APPLE', 'active', now())`,
      [builderId],
    );

    await expect(
      client.query(
        `insert into entitlements (builder_id, plan, channel, status, current_period_end)
         values ($1, 'yearly', 'APPLE', 'active', now())`,
        [builderId],
      ),
    ).rejects.toThrow();
  });
});
