import { defineConfig } from "@prisma/config"
import { PrismaLibSql } from "@prisma/adapter-libsql"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrate: {
    async adapter(env) {
      const url = env["DATABASE_URL"] ?? "file:./prisma/dev.db"
      const authToken = env["TURSO_AUTH_TOKEN"]
      return new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) })
    },
  },
})
