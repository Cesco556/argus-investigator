import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME ?? "argus";

  if (!uri) {
    console.error("✗ MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri, { appName: "argus-investigator" });

  try {
    await client.connect();
    const db = client.db(dbName);
    await db.command({ ping: 1 });
    const collections = await db.listCollections().toArray();
    console.log("✓ connected to MongoDB Atlas");
    console.log(`  db:          ${dbName}`);
    console.log(`  collections: ${collections.length === 0 ? "(none yet)" : collections.map((c) => c.name).join(", ")}`);
  } catch (err) {
    console.error("✗ connection failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
