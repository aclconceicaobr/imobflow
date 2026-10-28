import type { NextConfig } from "next";

import { assertEnv, EnvError } from "./src/lib/env/schema";

// Falha o `next build` e o `next dev` se faltar variável ou se um segredo
// estiver com prefixo NEXT_PUBLIC_ (ver docs/operacao.md).
try {
  assertEnv(process.env);
} catch (error) {
  if (!(error instanceof EnvError)) throw error;
  console.error(`\n${error.message}\n\nConfira o .env.example e o docs/operacao.md.\n`);
  process.exit(1);
}

const isDev = process.env.NODE_ENV === "development";
const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const supabaseWs = `${supabase.protocol === "https:" ? "wss:" : "ws:"}//${supabase.host}`;
const turnstile = "https://challenges.cloudflare.com";

// 'unsafe-inline' em script-src é exigido pelo Next.js sem nonce. A troca por
// nonce gerado no proxy.ts fica para a IF-014, junto com a sessão.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstile}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase.origin}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase.origin} ${supabaseWs}`,
  `frame-src ${turnstile}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
