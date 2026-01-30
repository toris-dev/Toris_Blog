import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const compat = new FlatCompat({ baseDirectory: __dirname });

// Next 16 config는 flat config를 직접 export하므로 require로 불러와 순환 참조 방지
const nextConfig = require("eslint-config-next/core-web-vitals");

const tailwindCallees = { callees: ["cva", "cn"] };

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.ts",
    ],
  },
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  ...compat.extends("prettier"),
  ...compat.extends("plugin:tailwindcss/recommended"),
  ...compat.extends("plugin:cypress/recommended"),
  {
    rules: {
      "tailwindcss/classnames-order": ["error", tailwindCallees],
      "tailwindcss/enforces-negative-arbitrary-values": ["warn", tailwindCallees],
      "tailwindcss/enforces-shorthand": ["warn", tailwindCallees],
      "tailwindcss/no-contradicting-classname": ["warn", tailwindCallees],
      "tailwindcss/no-custom-classname": ["warn", tailwindCallees],
    },
  },
];

export default config;
