import { parsePublicEnv } from "./schema";

/**
 * Variáveis públicas, seguras para o navegador. O Next.js só copia para o
 * cliente as referências escritas por extenso (`process.env.NEXT_PUBLIC_X`),
 * por isso cada uma aparece aqui pelo nome.
 */
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});
