import { describe, expect, it } from "vitest";

import { assertEnv, EnvError, findLeakedSecrets, parsePublicEnv, parseServerEnv } from "./schema";

const valid = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_exemplo",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  SUPABASE_SECRET_KEY: "sb_secret_exemplo",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
};

function problemsOf(fn: () => unknown): string[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof EnvError) return error.problems;
    throw error;
  }
  throw new Error("esperava EnvError");
}

describe("assertEnv", () => {
  it("aceita o ambiente mínimo do beta fechado", () => {
    expect(() => assertEnv(valid)).not.toThrow();
  });

  it("falha quando falta uma variável secreta", () => {
    const { SUPABASE_SECRET_KEY: _omitida, ...rest } = valid;
    expect(problemsOf(() => assertEnv(rest))).toEqual([expect.stringMatching(/^SUPABASE_SECRET_KEY: /)]);
  });

  it("falha quando falta uma variável pública", () => {
    const { NEXT_PUBLIC_SUPABASE_URL: _omitida, ...rest } = valid;
    expect(problemsOf(() => assertEnv(rest))).toEqual([expect.stringMatching(/^NEXT_PUBLIC_SUPABASE_URL: /)]);
  });

  it("trata valor vazio como ausente", () => {
    expect(problemsOf(() => assertEnv({ ...valid, TURNSTILE_SECRET_KEY: "  " }))).toEqual([
      expect.stringMatching(/^TURNSTILE_SECRET_KEY: /),
    ]);
  });

  it("falha quando uma variável secreta também aparece com NEXT_PUBLIC_", () => {
    const problems = problemsOf(() => assertEnv({ ...valid, NEXT_PUBLIC_SUPABASE_SECRET_KEY: "sb_secret_exemplo" }));
    expect(problems).toEqual([expect.stringContaining("NEXT_PUBLIC_SUPABASE_SECRET_KEY: SUPABASE_SECRET_KEY é secreta")]);
  });

  it("falha quando só a versão pública de um segredo existe", () => {
    const problems = problemsOf(() => assertEnv({ ...valid, NEXT_PUBLIC_OPENAI_API_KEY: "sk-exemplo" }));
    expect(problems).toEqual([expect.stringContaining("NEXT_PUBLIC_OPENAI_API_KEY: OPENAI_API_KEY é secreta")]);
  });
});

describe("findLeakedSecrets", () => {
  it("recusa nome público que indica segredo", () => {
    expect(findLeakedSecrets({ NEXT_PUBLIC_STRIPE_SECRET: "x" })).toHaveLength(1);
    expect(findLeakedSecrets({ NEXT_PUBLIC_GITHUB_TOKEN: "x" })).toHaveLength(1);
  });

  it("recusa valor de chave secreta em variável pública", () => {
    expect(findLeakedSecrets({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_trocada" })).toEqual([
      expect.stringContaining("parece uma chave secreta"),
    ]);
  });

  it("recusa variável pública não declarada", () => {
    expect(findLeakedSecrets({ NEXT_PUBLIC_QUALQUER: "x" })).toEqual([expect.stringContaining("não declarada")]);
  });

  it("aceita as variáveis públicas declaradas e as de sistema da Vercel", () => {
    expect(findLeakedSecrets({ ...valid, NEXT_PUBLIC_VERCEL_ENV: "preview" })).toEqual([]);
  });
});

describe("parseServerEnv", () => {
  it("deixa cobrança e IA desligadas por padrão", () => {
    const env = parseServerEnv(valid);
    expect(env.BILLING_ENABLED).toBe(false);
    expect(env.AI_ENABLED).toBe(false);
  });

  it("exige as chaves do Asaas quando a cobrança está ligada", () => {
    expect(problemsOf(() => parseServerEnv({ ...valid, BILLING_ENABLED: "true" }))).toEqual([
      "ASAAS_API_KEY: obrigatória quando BILLING_ENABLED=true",
      "ASAAS_WEBHOOK_TOKEN: obrigatória quando BILLING_ENABLED=true",
    ]);
  });

  it("exige chave e modelo da OpenAI quando a IA está ligada", () => {
    expect(problemsOf(() => parseServerEnv({ ...valid, AI_ENABLED: "true", OPENAI_API_KEY: "sk-x" }))).toEqual([
      "OPENAI_MODEL: obrigatória quando AI_ENABLED=true",
    ]);
  });

  it("recusa valor de chave liga/desliga fora de true ou false", () => {
    expect(problemsOf(() => parseServerEnv({ ...valid, AI_ENABLED: "sim" }))).toEqual([
      expect.stringMatching(/^AI_ENABLED: /),
    ]);
  });
});

describe("parsePublicEnv", () => {
  it("recusa URL inválida", () => {
    expect(problemsOf(() => parsePublicEnv({ ...valid, NEXT_PUBLIC_APP_URL: "localhost" }))).toEqual([
      expect.stringMatching(/^NEXT_PUBLIC_APP_URL: /),
    ]);
  });
});
