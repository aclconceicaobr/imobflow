import { z } from "zod";

/**
 * Regras das variáveis de ambiente. Este módulo não lê `process.env` sozinho:
 * recebe o ambiente como argumento para poder ser usado pelo `next.config.ts`
 * (que roda no build e no `next dev`), por `src/lib/env.ts` e pelos testes.
 */

const PUBLIC_PREFIX = "NEXT_PUBLIC_";

/** Variáveis que a Vercel cria sozinha quando a exposição automática está ligada. */
const VERCEL_SYSTEM_PREFIX = "NEXT_PUBLIC_VERCEL_";

/** Trechos de nome que indicam segredo; nenhuma variável pública pode contê-los. */
const SECRET_NAME_HINTS = ["SECRET", "PASSWORD", "TOKEN", "PRIVATE", "SERVICE_ROLE"] as const;

/** Prefixos de valor de chaves secretas conhecidas (Supabase, OpenAI, Asaas). */
const SECRET_VALUE_PREFIXES = ["sb_secret_", "sk-", "$aact_"] as const;

const flag = z
  .enum(["true", "false"], { error: "use true ou false" })
  .default("false")
  .transform((value) => value === "true");

const required = (message: string) => z.string({ error: message }).trim().min(1, { error: message });

export const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url({ error: "informe a URL pública do app, por exemplo http://localhost:3000" }),
  NEXT_PUBLIC_SUPABASE_URL: z.url({ error: "informe a URL do projeto Supabase" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: required("informe a chave publicável do Supabase (sb_publishable_...)"),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: required("informe a chave de site do Cloudflare Turnstile"),
});

export const serverSchema = z
  .object({
    SUPABASE_SECRET_KEY: required("informe a chave secreta do Supabase (sb_secret_...)"),
    TURNSTILE_SECRET_KEY: required("informe a chave secreta do Cloudflare Turnstile"),

    // Onda 2: cobrança pelo Asaas, desligada no beta fechado.
    BILLING_ENABLED: flag,
    ASAAS_API_URL: z.url().default("https://api-sandbox.asaas.com/v3"),
    ASAAS_API_KEY: z.string().trim().optional(),
    ASAAS_WEBHOOK_TOKEN: z.string().trim().optional(),

    // Onda 2: textos com IA, desligados no beta fechado.
    AI_ENABLED: flag,
    OPENAI_API_KEY: z.string().trim().optional(),
    OPENAI_MODEL: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const requireWhen = (enabled: boolean, flagName: string, keys: (keyof typeof value)[]) => {
      if (!enabled) return;
      for (const key of keys) {
        if (!value[key]) {
          ctx.addIssue({ code: "custom", path: [key], message: `obrigatória quando ${flagName}=true` });
        }
      }
    };
    requireWhen(value.BILLING_ENABLED, "BILLING_ENABLED", ["ASAAS_API_KEY", "ASAAS_WEBHOOK_TOKEN"]);
    requireWhen(value.AI_ENABLED, "AI_ENABLED", ["OPENAI_API_KEY", "OPENAI_MODEL"]);
  });

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

type Source = Record<string, string | undefined>;

export class EnvError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Variáveis de ambiente inválidas:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "EnvError";
  }
}

const serverKeys = Object.keys(serverSchema.shape);
const publicKeys = new Set(Object.keys(publicSchema.shape));

/**
 * Procura segredos expostos ao navegador. Toda variável com prefixo
 * `NEXT_PUBLIC_` é copiada para o JavaScript do cliente, então só as
 * declaradas em `publicSchema` (e as de sistema da Vercel) são aceitas.
 */
export function findLeakedSecrets(source: Source): string[] {
  const problems: string[] = [];
  for (const [name, value] of Object.entries(source)) {
    if (!name.startsWith(PUBLIC_PREFIX)) continue;
    const bare = name.slice(PUBLIC_PREFIX.length);

    if (serverKeys.includes(bare)) {
      problems.push(`${name}: ${bare} é secreta e não pode ter o prefixo ${PUBLIC_PREFIX}`);
    } else if (SECRET_NAME_HINTS.some((hint) => bare.includes(hint))) {
      problems.push(`${name}: o nome indica um segredo, que não pode ter o prefixo ${PUBLIC_PREFIX}`);
    } else if (value && SECRET_VALUE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      problems.push(`${name}: o valor parece uma chave secreta e iria para o navegador`);
    } else if (!publicKeys.has(name) && !name.startsWith(VERCEL_SYSTEM_PREFIX)) {
      problems.push(`${name}: variável pública não declarada em src/lib/env/schema.ts`);
    }
  }
  return problems;
}

function issuesOf(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

function check<T>(schema: z.ZodType<T>, source: Source, extra: string[] = []): T {
  const result = schema.safeParse(source);
  const problems = [...extra, ...(result.success ? [] : issuesOf(result.error))];
  if (problems.length > 0 || !result.success) throw new EnvError(problems);
  return result.data;
}

export function parsePublicEnv(source: Source): PublicEnv {
  return check(publicSchema, source);
}

export function parseServerEnv(source: Source): ServerEnv {
  return check(serverSchema, source);
}

/** Valida tudo de uma vez. Usado no `next.config.ts` para o build falhar cedo. */
export function assertEnv(source: Source): void {
  check(publicSchema.and(serverSchema), source, findLeakedSecrets(source));
}
