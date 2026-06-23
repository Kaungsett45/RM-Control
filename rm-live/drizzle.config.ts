import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv"

// This tells Drizzle to look at your .env.local file
dotenv.config({
  path: ".env.local",
});


export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Port 5432 (Direct Connection) is required for migrations
    url: process.env.DATABASE_URL || process.env.DATABASE_URL || "",
  },
});
