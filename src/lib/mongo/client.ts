import { MongoClient, type Db } from "mongodb";
import { env } from "@/lib/env";

declare global {
  var __argusMongoClient: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI not set. Add it to .env.local to enable the Suspicion Trail.");
  }
  return new MongoClient(env.MONGODB_URI, {
    appName: "argus-investigator",
    retryWrites: true,
    maxPoolSize: 10,
  }).connect();
}

export function getMongoClient(): Promise<MongoClient> {
  if (env.NODE_ENV === "production") {
    return connect();
  }
  if (!globalThis.__argusMongoClient) {
    globalThis.__argusMongoClient = connect();
  }
  return globalThis.__argusMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(env.MONGODB_DB_NAME);
}

export const mongoConfigured = Boolean(env.MONGODB_URI);
