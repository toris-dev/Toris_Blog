#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEPLOY_HOST = "builder.toris.kr";
const READINESS_URL = "https://api.builder.toris.kr/health";
const D1_READINESS_URL =
  "https://api.builder.toris.kr/entitlements?email=release-readiness%40builderstep.invalid";
const args = new Set(process.argv.slice(2));

function printHelp() {
  console.log(`BuilderStep 릴리스 검증

사용법:
  corepack pnpm run builder:release:check
  BUILDERSTEP_DEPLOY_CONFIRM=${DEPLOY_HOST} corepack pnpm run deploy:builder

옵션:
  --deploy                로컬 검증 후 원격 migration, API, 웹 순서로 배포
  --check-deploy-confirm  deploy:all 실행 전 확인 가드만 검사
  --help                  도움말 표시
`);
}

if (args.has("--help")) {
  printHelp();
  process.exit(0);
}

const allowedArgs = new Set(["--deploy", "--check-deploy-confirm"]);
const unknownArgs = [...args].filter((arg) => !allowedArgs.has(arg));
if (unknownArgs.length > 0) {
  console.error(`알 수 없는 옵션: ${unknownArgs.join(", ")}`);
  printHelp();
  process.exit(2);
}

const shouldDeploy = args.has("--deploy");
const shouldCheckDeployConfirm = args.has("--check-deploy-confirm");
if (shouldDeploy && shouldCheckDeployConfirm) {
  console.error("--deploy와 --check-deploy-confirm은 함께 사용할 수 없습니다.");
  process.exit(2);
}

if (
  (shouldDeploy || shouldCheckDeployConfirm) &&
  process.env.BUILDERSTEP_DEPLOY_CONFIRM !== DEPLOY_HOST
) {
  console.error(
    `원격 배포를 실행하려면 BUILDERSTEP_DEPLOY_CONFIRM=${DEPLOY_HOST}를 명시해야 합니다.`,
  );
  console.error(
    "로컬 검증만 실행하려면 corepack pnpm run builder:release:check를 사용하세요.",
  );
  process.exit(2);
}

if (shouldCheckDeployConfirm) {
  console.log(`[BuilderStep] 원격 배포 대상 확인 완료: ${DEPLOY_HOST}`);
  process.exit(0);
}

function run(label, command, commandArgs) {
  return new Promise((resolve, reject) => {
    console.log(`\n[BuilderStep] ${label}`);
    const child = spawn(command, commandArgs, {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        CI: process.env.CI ?? "true",
      },
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          signal
            ? `${label} 단계가 ${signal} 신호로 종료되었습니다.`
            : `${label} 단계가 종료 코드 ${code ?? "unknown"}로 실패했습니다.`,
        ),
      );
    });
  });
}

function runCapture(label, command, commandArgs) {
  return new Promise((resolve, reject) => {
    console.log(`\n[BuilderStep] ${label}`);
    const child = spawn(command, commandArgs, {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        CI: process.env.CI ?? "true",
      },
      stdio: ["ignore", "pipe", "inherit"],
    });
    let stdout = "";

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(
        new Error(
          signal
            ? `${label} 단계가 ${signal} 신호로 종료되었습니다.`
            : `${label} 단계가 종료 코드 ${code ?? "unknown"}로 실패했습니다.`,
        ),
      );
    });
  });
}

function runPnpm(label, pnpmArgs) {
  return run(label, "corepack", ["pnpm", ...pnpmArgs]);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runFreshLocalMigrations() {
  const persistenceDirectory = await mkdtemp(
    join(tmpdir(), "builderstep-release-migrations-"),
  );

  try {
    await runPnpm("빈 로컬 D1에 migration ledger 적용", [
      "--filter",
      "@builderstep/server",
      "exec",
      "wrangler",
      "d1",
      "migrations",
      "apply",
      "builderstep",
      "--local",
      "--persist-to",
      persistenceDirectory,
    ]);
  } finally {
    await rm(persistenceDirectory, { recursive: true, force: true });
  }
}

function parseD1Rows(label, output) {
  let payload;
  try {
    payload = JSON.parse(output);
  } catch {
    throw new Error(`${label} 결과를 JSON으로 해석하지 못했습니다.`);
  }

  const batches = Array.isArray(payload) ? payload : [payload];
  const rows = batches.flatMap((batch) =>
    batch && typeof batch === "object" && Array.isArray(batch.results)
      ? batch.results
      : [],
  );
  if (rows.length === 0 && batches.some((batch) => batch?.success === false)) {
    throw new Error(`${label} 쿼리가 실패했습니다.`);
  }
  return rows;
}

async function queryRemoteD1(label, sql) {
  const output = await runCapture(label, "corepack", [
    "pnpm",
    "--filter",
    "@builderstep/server",
    "exec",
    "wrangler",
    "d1",
    "execute",
    "builderstep",
    "--remote",
    "--command",
    sql,
    "--json",
  ]);
  return parseD1Rows(label, output);
}

async function verifyRemoteMigrationAdoption() {
  const expected = [
    { migration: "0000_init.sql", sentinelTable: "subscribers" },
    { migration: "0001_features.sql", sentinelTable: "app_users" },
    { migration: "0002_command_center.sql", sentinelTable: "receivables" },
  ];
  const tableRows = await queryRemoteD1(
    "원격 D1 migration ledger 사전 확인",
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('d1_migrations', 'subscribers', 'app_users', 'receivables') ORDER BY name",
  );
  const tables = new Set(
    tableRows
      .map((row) => row?.name)
      .filter((name) => typeof name === "string"),
  );
  const applied = tables.has("d1_migrations")
    ? new Set(
        (
          await queryRemoteD1(
            "원격 D1 적용 migration 확인",
            "SELECT name FROM d1_migrations ORDER BY id",
          )
        )
          .map((row) => row?.name)
          .filter((name) => typeof name === "string"),
      )
    : new Set();

  const mismatches = expected.filter(
    ({ migration, sentinelTable }) =>
      tables.has(sentinelTable) !== applied.has(migration),
  );
  if (mismatches.length > 0) {
    throw new Error(
      `기존 D1 스키마와 migration ledger가 일치하지 않습니다 (${mismatches
        .map(({ migration, sentinelTable }) => `${migration}:${sentinelTable}`)
        .join(", ")}). 운영 데이터 중복을 막기 위해 자동 적용을 중단했습니다. ledger를 먼저 수동 조정하세요.`,
    );
  }
}

async function waitForReadiness() {
  const maximumAttempts = 12;
  let lastFailure = "응답 없음";

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const response = await fetch(READINESS_URL, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5_000),
      });
      const body = await response.json().catch(() => null);
      const healthReady =
        response.ok &&
        body &&
        typeof body === "object" &&
        body.ok === true &&
        body.service === "builderstep-api";
      if (!healthReady) {
        lastFailure = `health HTTP ${response.status}`;
      } else {
        const d1Response = await fetch(D1_READINESS_URL, {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(5_000),
        });
        const d1Body = await d1Response.json().catch(() => null);
        if (
          d1Response.ok &&
          d1Body &&
          typeof d1Body === "object" &&
          typeof d1Body.status === "string"
        ) {
          console.log(
            `[BuilderStep] API readiness 확인 완료 (${attempt}/${maximumAttempts})`,
          );
          return;
        }
        lastFailure = `D1 probe HTTP ${d1Response.status}`;
      }
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    if (attempt < maximumAttempts) {
      await wait(Math.min(attempt * 1_000, 5_000));
    }
  }

  throw new Error(
    `API readiness를 확인하지 못했습니다: ${lastFailure}. 웹 배포는 실행하지 않았습니다.`,
  );
}

async function main() {
  await runPnpm("전체 패키지 타입 검사", [
    "--filter",
    "@builderstep/*",
    "run",
    "typecheck",
  ]);
  await runPnpm("전체 패키지 테스트", [
    "--filter",
    "@builderstep/*",
    "run",
    "--if-present",
    "test",
  ]);
  await runFreshLocalMigrations();
  await runPnpm("웹 정적 export 빌드", [
    "--filter",
    "@builderstep/web",
    "run",
    "build",
  ]);

  if (!shouldDeploy) {
    console.log(
      "\n[BuilderStep] 로컬 릴리스 검증이 완료되었습니다. 원격 변경은 실행하지 않았습니다.",
    );
    return;
  }

  await verifyRemoteMigrationAdoption();
  await runPnpm("원격 D1 migration ledger 적용", [
    "--filter",
    "@builderstep/server",
    "run",
    "db:migrate:remote",
  ]);
  await runPnpm("API Worker 배포", [
    "--filter",
    "@builderstep/server",
    "run",
    "deploy",
  ]);

  console.log("\n[BuilderStep] API readiness 확인");
  await waitForReadiness();

  await runPnpm("웹 Worker 배포", [
    "--filter",
    "@builderstep/web",
    "run",
    "deploy",
  ]);

  console.log("\n[BuilderStep] 원격 릴리스가 완료되었습니다.");
}

main().catch((error) => {
  console.error(
    `\n[BuilderStep] 릴리스 중단: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
