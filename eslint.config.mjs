import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import pluginCypress from "eslint-plugin-cypress/flat";

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
      "content/**",
      "scripts/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.ts",
    ],
  },
  ...(Array.isArray(nextConfig) ? nextConfig : [nextConfig]),
  ...compat.extends("prettier"),
  ...compat.extends("plugin:tailwindcss/recommended"),
  {
    ...pluginCypress.configs.recommended,
    files: ["cypress/**/*.{js,ts,mjs,cjs}"],
  },
  {
    rules: {
      "tailwindcss/classnames-order": ["error", tailwindCallees],
      "tailwindcss/enforces-negative-arbitrary-values": ["warn", tailwindCallees],
      "tailwindcss/enforces-shorthand": ["warn", tailwindCallees],
      "tailwindcss/no-contradicting-classname": ["warn", tailwindCallees],
      "tailwindcss/no-custom-classname": ["warn", tailwindCallees],
      // React 19 Compiler 규칙: localStorage·hydration 패턴에서 과도하게 트리거됨
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
  {
    files: ["src/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/no-contradicting-classname": "off",
    },
  },
];

export default config;
