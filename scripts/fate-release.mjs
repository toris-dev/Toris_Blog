#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEPLOY_HOST = "fate.toris.kr";
const args = new Set(process.argv.slice(2));

function printHelp() {
  console.log(`운명의 카드(fate.toris.kr) 릴리스 검증

사용법:
  corepack pnpm run fate:release:check
  FATESTEP_DEPLOY_CONFIRM=${DEPLOY_HOST} corepack pnpm run deploy:fate

옵션:
  --deploy  로컬 검증(typecheck·test·build) 후 fate.toris.kr 로 배포
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
if (shouldDeploy && process.env.FATESTEP_DEPLOY_CONFIRM !== DEPLOY_HOST) {
  console.error(
    `원격 배포를 실행하려면 FATESTEP_DEPLOY_CONFIRM=${DEPLOY_HOST}를 명시해야 합니다.`,
  );
  console.error(
    "로컬 검증만 실행하려면 corepack pnpm run fate:release:check를 사용하세요.",
  );
  process.exit(2);
}

function run(label, command, commandArgs) {
  return new Promise((resolve, reject) => {
    console.log(`\n[FateStep] ${label}`);
    const child = spawn(command, commandArgs, {
      cwd: PROJECT_ROOT,
      env: { ...process.env, CI: process.env.CI ?? "true" },
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

const runPnpm = (label, pnpmArgs) => run(label, "corepack", ["pnpm", ...pnpmArgs]);

async function main() {
  await runPnpm("타입 검사", ["--filter", "@fatestep/web", "run", "typecheck"]);
  await runPnpm("테스트", ["--filter", "@fatestep/web", "run", "test"]);
  await runPnpm("정적 빌드", ["--filter", "@fatestep/web", "run", "build"]);

  if (!shouldDeploy) {
    console.log(
      "\n[FateStep] 로컬 릴리스 검증이 완료되었습니다. 원격 변경은 실행하지 않았습니다.",
    );
    return;
  }

  await runPnpm("웹 Worker 배포 (fate.toris.kr)", [
    "--filter",
    "@fatestep/web",
    "exec",
    "wrangler",
    "deploy",
  ]);

  console.log("\n[FateStep] 원격 릴리스가 완료되었습니다: https://fate.toris.kr");
}

main().catch((error) => {
  console.error(
    `\n[FateStep] 릴리스 중단: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
