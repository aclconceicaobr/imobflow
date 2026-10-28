import { expect, it } from "vitest";

// Teste quebrado de propósito para provar que o CI fica vermelho (IF-002).
// O próximo commit reverte este arquivo.
it("prova do CI: este teste falha", () => {
  expect(1 + 1).toBe(3);
});
