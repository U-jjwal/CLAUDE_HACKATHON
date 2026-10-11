# PLAN.md — Backend + Officer Workflow Addition

**Baseline (confirmed green):**
- `npm run verify`: All checks passed (1524 rows; value 1226 / bdl 174 / likely_bdl 63 / not_sampled 61; DO below 5: 42/116; BOD above 3: 100/112; pH outside: 6/115)
- `npm run typecheck`: Clean (tsconfig.json + tsconfig.ui.json)
- `npm run build`: Clean (vite build, 440 kB JS)

**Canonical ghat names (from CSV `site` column):**
1. `Bairagarh (Sant Hirdaram) kund`
2. `Hathaikheda dam / kund`
3. `Khatlapura ghat`
4. `Malikhedi kund`
5. `Prempura ghat`
6. `Rani Kamlapati ghat / Kamla Park kund`
7. `Shahpura lake ghat`

**Exact parameter strings (from CSV / core):**
- `Dissolved oxygen` / `BOD` / `pH`

**PROTECTED files (never edit):**
- `src/core/clean.ts`, `src/core/types.ts`, `src/core/limits.ts`, `src/core/score.ts`, `src/core/insights.ts`
- `scripts/verify.ts`, `data/bhopal_ghats_2023_2025.csv`

**What exists:**
- React 18 + TypeScript + Vite UI in src/ui/
- Core logic in src/core/
- Historical CSV bundled via raw import
- package.json type "module"
- Git initialized, 5 commits

**New dependencies (all approved):**
Runtime: express, mongoose, bcryptjs, jsonwebtoken, cookie-parser, cors, helmet, express-rate-limit, zod, dotenv
Dev: supertest, mongodb-memory-server, @types/express, @types/cookie-parser, @types/cors, @types/jsonwebtoken, @types/bcryptjs, @types/supertest

**Architecture:**
- tsconfig.server.json: module NodeNext, moduleResolution NodeNext, types [node]
- Dev server: tsx watch server/index.ts
- Prod: tsx server/index.ts serves API + dist/
- Vite dev proxy: /api -> localhost:3001
- Cookie: httpOnly, sameSite lax, secure in prod, path /, 8h expiry
