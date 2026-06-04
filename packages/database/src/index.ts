import { PrismaClient } from "@prisma/client";

/**
 * Re-export the generated Prisma client and its types so the backend can depend
 * on a single internal package (`@justdoit/database`) rather than reaching into
 * `@prisma/client` directly. This keeps database wiring in one place.
 */
export { PrismaClient } from "@prisma/client";
export type { Prisma, Category, Todo } from "@prisma/client";

export type DatabaseClient = PrismaClient;

/** Convenience factory used by the NestJS PrismaService. */
export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}
