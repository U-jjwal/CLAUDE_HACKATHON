# Ghat Triage core (Visarjan Ghat Watch, Track 2)

Team: <name> · Members: <names> · Track 2 · User: a BMC officer planning Durga visarjan (20 Oct 2026)

Core logic only (no UI yet). The UI imports `src/core/*`.

## Run (3 steps)
1. `npm install`
2. `npm run verify`  (checks the guide's headline numbers and every finding below)
3. `npm run typecheck`

## What each file does
- `clean.ts`: reads the CSV. Keeps value / BDL / likely-BDL / not-sampled as separate states. Flags 2025 metal values that equal MPPCB detection limits.
- `limits.ts`: CPCB class B checks (DO >= 5, BOD <= 3, pH 6.5 to 8.5).
- `score.ts`: transparent composite score and bootstrap rank stability (tiers A / B / C).
- `insights.ts`: per-ghat profile (recurring baseline, immersion-triggered, slow recovery, organic-load spike, data gap), Ganesh-to-Durga carry-over, and `assessReading` for "add today's reading".

## Assumptions and limits (keep this section honest)
- Units are the standard ones assumed in the data pack; the reports print none.
- Class B is a reasonable benchmark for immersion ghats, not an official immersion class. Ghat data has no coliform, which class B also limits.
- Score weights (DO 0.45, BOD 0.40, pH 0.15) are a judgement call. Only the extreme ranks are stable; the middle five ghats are close.
- BOD method is not printed in the visarjan reports (lake reports say 3 days at 27 C, the CPCB table says 5 days at 20 C). Unconfirmed.
- Metals: no class B limit, years are not comparable, and 63 numeric 2025 values equal detection limits and are treated as likely BDL (verify with MPPCB).
- Bairagarh and Malikhedi have no Durga 2025 table. Missing data is never scored as clean.
- Carry-over uses 19 (DO) and 18 (BOD) ghat-year pairs. Small sample.
- Not a health assessment. The tool points to readings; the officer decides.

Data: `data/bhopal_ghats_2023_2025.csv` from the Impact Lab participant pack (MPPCB reports 2023 to 2025).
# CLAUDE_HACKATHON
