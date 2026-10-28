import "server-only";

import { parsePublicEnv, parseServerEnv } from "./env/schema";

/**
 * Variáveis do servidor, validadas na primeira importação. Só pode ser
 * importado em código de servidor: o pacote `server-only` quebra o build se
 * um componente de cliente tentar usá-lo.
 */
export const env = {
  ...parsePublicEnv(process.env),
  ...parseServerEnv(process.env),
};
