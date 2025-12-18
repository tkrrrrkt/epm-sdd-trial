#!/usr/bin/env node
/**
 * structure-guards.ts
 *
 * Run (recommended):
 *   npx tsx scripts/structure-guards.ts
 *
 * Enforces (fail-fast):
 *  - UI must NOT reference packages/contracts/src/api
 *  - UI must NOT call Domain API directly (must call BFF only)
 *  - UI must NOT use fetch() directly except inside feature api/HttpBffClient.ts
 *  - v0 drop must NOT contain forbidden references (contracts/api, /api/)
 *  - BFF must NOT access DB directly (Prisma hints)
 *
 * Also checks (soft):
 *  - UI SHOULD reference packages/contracts/src/bff somewhere (to avoid “no-contract UI” drift)
 *    -> Currently treated as FAIL to make the rule explicit. If you want it as WARNING, see NOTE below.
 *
 * NOTE (to make it WARNING instead of FAIL):
 *  - Change push("UI_SHOULD_USE_CONTRACTS_BFF", ...) to console.warn-only and do not exit(1).
 */

import fs from "node:fs";
import path from "node:path";

type Violation = {
  ruleId: string;
  file: string;
  line: number;
  message: string;
  snippet?: string;
};

const repoRoot = process.cwd();

const TARGET_DIRS = ["apps/web/src", "apps/web/_v0_drop", "apps/bff/src", "apps/api/src"];
const IGNORE_DIR_PARTS = ["node_modules", ".next", "dist", "build", ".turbo", ".git", "coverage"];
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

function isIgnored(p: string) {
  return IGNORE_DIR_PARTS.some((x) => p.split(path.sep).includes(x));
}

function walk(dirAbs: string, out: string[] = []) {
  for (const ent of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const p = path.join(dirAbs, ent.name);
    if (isIgnored(p)) continue;
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function rel(pAbs: string) {
  return path.relative(repoRoot, pAbs).replaceAll("\\", "/");
}

function readLines(pAbs: string) {
  return fs.readFileSync(pAbs, "utf8").split(/\r?\n/);
}

function scanFile(fileAbs: string): Violation[] {
  const r = rel(fileAbs);
  const ext = path.extname(fileAbs);
  if (!EXT.has(ext)) return [];

  const lines = readLines(fileAbs);
  const v: Violation[] = [];

  const isWebSrc = r.startsWith("apps/web/src/");
  const isWebV0Drop = r.startsWith("apps/web/_v0_drop/");
  const isBff = r.startsWith("apps/bff/");

  const push = (ruleId: string, i: number, message: string) => {
    v.push({ ruleId, file: r, line: i + 1, message, snippet: lines[i]?.slice(0, 180) });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // UI must not reference contracts/api
    if (isWebSrc) {
      if (line.includes("packages/contracts/src/api") || /contracts\/src\/api/.test(line)) {
        push(
          "UI_NO_CONTRACTS_API",
          i,
          "UI must NOT reference packages/contracts/src/api. Use packages/contracts/src/bff only."
        );
      }
    }

    // UI must not call Domain API directly
    if (isWebSrc) {
      if (/['"`]\/api\//.test(line) || line.includes("apps/api") || /DOMAIN_API/i.test(line)) {
        push("UI_NO_DOMAIN_API_DIRECT", i, "UI must NOT call Domain API directly. UI must call BFF only.");
      }
    }

    // UI must not use fetch directly (except HttpBffClient.ts)
    if (isWebSrc) {
      const allowed = r.endsWith("/api/HttpBffClient.ts");
      if (line.includes("fetch(") && !allowed) {
        push("UI_NO_DIRECT_FETCH", i, "Direct fetch() is prohibited in UI. Use HttpBffClient only.");
      }
    }

    // v0 drop should not import contracts/api or call /api
    if (isWebV0Drop) {
      if (line.includes("packages/contracts/src/api") || /contracts\/src\/api/.test(line) || /['"`]\/api\//.test(line)) {
        push("V0_DROP_FORBIDDEN", i, "v0 drop contains forbidden references. Fix before migrating into apps/web/src.");
      }
    }

    // BFF must not access DB directly (Prisma hint)
    if (isBff) {
      if (/PrismaClient/.test(line) || /from\s+['"`].*prisma/i.test(line)) {
        push("BFF_NO_DB_DIRECT", i, "BFF must NOT access DB directly. BFF must call Domain API only.");
      }
    }
  }

  return v;
}

function main() {
  const violations: Violation[] = [];

  // Soft check support: does UI reference contracts/bff anywhere?
  let uiReferencesContractsBff = false;

  for (const dir of TARGET_DIRS) {
    const abs = path.join(repoRoot, dir);
    if (!fs.existsSync(abs)) continue;

    for (const f of walk(abs)) {
      const r = rel(f);
      const ext = path.extname(f);
      if (!EXT.has(ext)) continue;

      // detect contracts/bff reference in web/src
      if (r.startsWith("apps/web/src/")) {
        const text = fs.readFileSync(f, "utf8");
        if (text.includes("packages/contracts/src/bff") || /contracts\/src\/bff/.test(text)) {
          uiReferencesContractsBff = true;
        }
      }

      violations.push(...scanFile(f));
    }
  }

  // Soft check (currently treated as FAIL to make it explicit)
  if (fs.existsSync(path.join(repoRoot, "apps/web/src")) && !uiReferencesContractsBff) {
    violations.push({
      ruleId: "UI_SHOULD_USE_CONTRACTS_BFF",
      file: "apps/web/src",
      line: 1,
      message:
        "UI should reference packages/contracts/src/bff (contracts-first). If UI has no contract usage yet, ignore only in very early bootstrap.",
      snippet: "",
    });
  }

  if (violations.length === 0) {
    console.log("✅ Structure Guards: OK (no violations)");
    process.exit(0);
  }

  console.error("❌ Structure Guards: violations found\n");
  for (const vv of violations) {
    console.error(`- [${vv.ruleId}] ${vv.file}:${vv.line} ${vv.message}`);
    if (vv.snippet) console.error(`  > ${vv.snippet.trim()}`);
  }
  process.exit(1);
}

main();
