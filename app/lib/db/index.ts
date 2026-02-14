import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import pg from "pg";
import * as schema from "./schema";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Determine if we're using Neon (serverless) or local PostgreSQL
const isNeonDatabase = (url: string): boolean => {
  return url.includes("neon.tech") || url.includes("neon-");
};

// Get the database URL from environment variables
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not defined. Please set it in your .env file.\n" +
      "For local Docker: DATABASE_URL=postgresql://kickoff:kickoff_secret@localhost:5432/kickoff_rivals\n" +
      "For Neon: DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require",
    );
  }
  return url;
};

// Create the appropriate Drizzle client based on DATABASE_URL
const createDatabaseClient = () => {
  const databaseUrl = getDatabaseUrl();

  if (isNeonDatabase(databaseUrl)) {
    // Use Neon HTTP driver for serverless environments
    console.log("🌐 Using Neon serverless database driver");
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  } else {
    // Use node-postgres for local/Docker PostgreSQL
    console.log("🐘 Using local PostgreSQL database driver");
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    return drizzleNode(pool, { schema });
  }
};

// Create the Drizzle ORM client with schema
export const db = createDatabaseClient();

// Re-export schema for convenience
export * from "./schema";

// Export the db type for use in other files
export type Database = typeof db;

// Helper to check connection health (useful for debugging)
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple query to test connection using Drizzle's query builder
    const result = await db.query.leagues.findFirst();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};
