#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEPLOY_HOST = "field.toris.kr";
const READINESS_URL = "https://api.field.toris.kr/health/ready";
const args = new Set(process.argv.slice(2));

function printHelp() {
  console.log(`현장완료 릴리스 검증

사용법:
  corepack pnpm run field:release:check
  FIELDSTEP_DEPLOY_CONFIRM=${DEPLOY_HOST} corepack pnpm run deploy:field

옵션:
  --deploy  로컬 검증 후 원격 migration, API, 웹 순서로 배포
  --help    도움말 표시
`);
}

if (args.has("--help")) {
  printHelp();
  process.exit(0);
}

const allowedArgs = new Set(["--deploy"]);
const unknownArgs = [...args].filter((arg) => !allowedArgs.has(arg));
if (unknownArgs.length > 0) {
  console.error(`알 수 없는 옵션: ${unknownArgs.join(", ")}`);
  printHelp();
  process.exit(2);
}

const shouldDeploy = args.has("--deploy");
if (
  shouldDeploy &&
  process.env.FIELDSTEP_DEPLOY_CONFIRM !== DEPLOY_HOST
) {
  console.error(
    `원격 배포를 실행하려면 FIELDSTEP_DEPLOY_CONFIRM=${DEPLOY_HOST}를 명시해야 합니다.`,
  );
  console.error(
    "로컬 검증만 실행하려면 corepack pnpm run field:release:check를 사용하세요.",
  );
  process.exit(2);
}

function run(label, command, commandArgs) {
  return new Promise((resolve, reject) => {
    console.log(`\n[FieldStep] ${label}`);
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

function runPnpm(label, pnpmArgs) {
  return run(label, "corepack", ["pnpm", ...pnpmArgs]);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runFreshLocalMigrations() {
  const persistenceDirectory = await mkdtemp(
    join(tmpdir(), "fieldstep-release-migrations-"),
  );

  try {
    await runPnpm("빈 로컬 D1에 migration ledger 적용", [
      "--filter",
      "@fieldstep/server",
      "exec",
      "wrangler",
      "d1",
      "migrations",
      "apply",
      "fieldstep",
      "--local",
      "--persist-to",
      persistenceDirectory,
    ]);
  } finally {
    await rm(persistenceDirectory, { recursive: true, force: true });
  }
}

async function waitForReadiness() {
  const maximumAttempts = 12;
  let lastFailure = "응답 없음";

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      const response = await fetch(READINESS_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5_000),
      });
      const body = await response.json().catch(() => null);
      if (
        response.ok &&
        body &&
        typeof body === "object" &&
        body.ok === true &&
        body.status === "ready"
      ) {
        console.log(`[FieldStep] API readiness 확인 완료 (${attempt}/${maximumAttempts})`);
        return;
      }
      lastFailure = `HTTP ${response.status}`;
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
    "@fieldstep/*",
    "run",
    "typecheck",
  ]);
  await runPnpm("전체 패키지 테스트", [
    "--filter",
    "@fieldstep/*",
    "run",
    "--if-present",
    "test",
  ]);
  await runFreshLocalMigrations();
  await runPnpm("웹 정적 export 빌드", [
    "--filter",
    "@fieldstep/web",
    "run",
    "build",
  ]);

  if (!shouldDeploy) {
    console.log("\n[FieldStep] 로컬 릴리스 검증이 완료되었습니다. 원격 변경은 실행하지 않았습니다.");
    return;
  }

  await runPnpm("원격 R2 버킷 확인", [
    "--filter",
    "@fieldstep/server",
    "run",
    "r2:check:remote",
  ]);
  await runPnpm("원격 D1 migration ledger 적용", [
    "--filter",
    "@fieldstep/server",
    "run",
    "db:migrate:remote",
  ]);
  await runPnpm("API Worker 배포", [
    "--filter",
    "@fieldstep/server",
    "run",
    "deploy",
  ]);

  console.log("\n[FieldStep] API readiness 확인");
  await waitForReadiness();

  await runPnpm("웹 Worker 배포", [
    "--filter",
    "@fieldstep/web",
    "run",
    "deploy",
  ]);

  console.log("\n[FieldStep] 원격 릴리스가 완료되었습니다.");
}

main().catch((error) => {
  console.error(
    `\n[FieldStep] 릴리스 중단: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
