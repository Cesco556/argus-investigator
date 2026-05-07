/**
 * Smoke test for POST /api/disposition.
 *
 * Imports the route handler and exercises it with mock Request objects. Asserts
 * the contract surface (validation, Mongo gating, success path) without needing
 * a running Next.js server. Run with: `pnpm test:disposition`.
 *
 * Reads .env.local first (Next.js convention), then falls back to .env. Skips the
 * Mongo success-path test when MONGODB_URI is unset — the route correctly returns
 * 503 in that case, which is itself an asserted behaviour.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

let passed = 0;
let failed = 0;

async function expect(name: string, fn: () => Promise<boolean>) {
  try {
    const ok = await fn();
    if (ok) {
      console.log(`  ✓ ${name}`);
      passed += 1;
    } else {
      console.log(`  ✗ ${name}`);
      failed += 1;
    }
  } catch (err) {
    console.log(`  ✗ ${name} — threw: ${err instanceof Error ? err.message : String(err)}`);
    failed += 1;
  }
}

async function main() {
  // Lazy import so dotenv is loaded before module evaluation reads env.
  const { POST } = await import("../src/app/api/disposition/route");

  const mongoConfigured = Boolean(process.env.MONGODB_URI);
  console.log(`\n/api/disposition smoke (MONGODB_URI ${mongoConfigured ? "set" : "unset"})\n`);

  await expect("rejects missing caseId", async () => {
    const res = await POST(
      new Request("http://localhost/api/disposition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "file_sar" }),
      }),
    );
    return res.status === 400 || (!mongoConfigured && res.status === 503);
  });

  await expect("rejects path-traversal-style caseId", async () => {
    const res = await POST(
      new Request("http://localhost/api/disposition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: "../etc/passwd", decision: "file_sar" }),
      }),
    );
    return res.status === 400 || (!mongoConfigured && res.status === 503);
  });

  await expect("rejects unknown decision", async () => {
    const res = await POST(
      new Request("http://localhost/api/disposition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId: "TEST-001", decision: "approve_loan" }),
      }),
    );
    return res.status === 400 || (!mongoConfigured && res.status === 503);
  });

  await expect("rejects oversize note", async () => {
    const res = await POST(
      new Request("http://localhost/api/disposition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId: "TEST-001",
          decision: "defer",
          note: "a".repeat(5000),
        }),
      }),
    );
    return res.status === 400 || (!mongoConfigured && res.status === 503);
  });

  await expect("rejects malformed JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/disposition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{ not: 'json'",
      }),
    );
    return res.status === 400 || (!mongoConfigured && res.status === 503);
  });

  if (mongoConfigured) {
    await expect("accepts valid SAR decision and writes to trail", async () => {
      const res = await POST(
        new Request("http://localhost/api/disposition", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            caseId: "SMOKE-TEST-CASE",
            decision: "file_sar",
            note: "smoke test from scripts/test-disposition-route.ts",
            decidedBy: "smoke-test",
          }),
        }),
      );
      return res.status === 200;
    });
  } else {
    await expect("returns 503 when Mongo is not configured", async () => {
      const res = await POST(
        new Request("http://localhost/api/disposition", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ caseId: "TEST-001", decision: "dismiss" }),
        }),
      );
      return res.status === 503;
    });
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
