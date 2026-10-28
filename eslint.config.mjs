import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    // Variáveis de ambiente só são lidas pelos módulos validados em src/lib/env*.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/env.ts", "src/lib/env/**"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Importe `env` de @/lib/env (servidor) ou `publicEnv` de @/lib/env/public (navegador).",
        },
      ],
    },
  },
]);
