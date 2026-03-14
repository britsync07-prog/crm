import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Current codebase uses broad dynamic payloads across server actions/API handlers.
      "@typescript-eslint/no-explicit-any": "off",
      // Marketing/content pages intentionally use plain apostrophes/quotes in copy.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: ["prisma/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored / external code trees
    "socket.io/**",
    "livekit/**",
    // Generated client code
    "src/generated/**",
    // Local utility scripts (CommonJS)
    "server.js",
    "test-*.js",
    "prisma/*.js",
  ]),
]);

export default eslintConfig;
