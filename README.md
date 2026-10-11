# Visarjan Ghat Watch - Bhopal

A decision-support tool that triages Bhopal water-quality records to help municipal officers prioritize immersion ghats.

- **Track**: Track 2: Visarjan Ghat Watch
- **Target Event**: Durga Visarjan, 20 October 2026
- **Location**: Bhopal, Madhya Pradesh, India
- **Live Demo**: https://ghattriage.up.railway.app/#trust-limits
- **Current Status**: Client-side prototype. Automated data verification, ranking logic, bilingual briefs, and production build pass all checks. Browser rendering has not been tested in a live browser.

---

## Table of contents

- [Read this first (30-second summary)](#read-this-first-30-second-summary)
- [The problem](#the-problem)
- [Who is this for](#who-is-this-for)
- [What the tool does](#what-the-tool-does)
- [Key findings from the data](#key-findings-from-the-data)
- [How the risk tiers work](#how-the-risk-tiers-work)
- [How we keep the data honest](#how-we-keep-the-data-honest)
- [Limits and assumptions](#limits-and-assumptions)
- [Demo mode features](#demo-mode-features)
- [What works / What does not work yet](#what-works--what-does-not-work-yet)
- [How to run it](#how-to-run-it)
- [How to check our work (for evaluators)](#how-to-check-our-work-for-evaluators)
- [Project structure](#project-structure)
- [Tech stack and why](#tech-stack-and-why)
- [Data sources](#data-sources)
- [Roadmap](#roadmap)
- [Team](#team)
- [Glossary](#glossary)
- [Disclaimer](#disclaimer)

---

## Read this first (30-second summary)

- **The Problem**: Idol immersion stresses Bhopal lakes. Official test data is locked in dense PDF files with missing values.
- **Who It Helps**: Bhopal Municipal Corporation (BMC) officers who must allocate aerators, cleanup staff, and field testing teams.
- **What It Does**: Ranks 7 monitored ghats into three triage tiers using transparent rules and multi-year data.
- **Main Finding**: Bairagarh consistently ranks at highest risk. Water starts Durga visarjan in worse condition than Ganesh visarjan in 14 of 19 test years.
- **Honest Limits**: This is historical decision support. It is not live sensor data. It does not measure health risks or disease.

---

## The problem

During Ganesh and Durga festivals, devotees immerse idols into city lakes.
The Madhya Pradesh Pollution Control Board (MPPCB) samples water before, during, and after immersion.
Results are published across large government PDF reports.
These reports contain missing values, unclear site names, and numbers without printed units.
Municipal officers must prepare ghats before crowds arrive.
They need to know which sites need aeration and cleanup first.
Without a structured tool, officers must search hundreds of PDF pages by hand.

---

## Who is this for

This tool is designed for the Bhopal Municipal Corporation (BMC) officer planning immersion logistics for Durga Visarjan on 20 October 2026.
It also assists municipal engineers, field sampling teams, and administrative supervisors who need quick access to verified testing history.

---

## What the tool does

| Feature | What the officer sees | Status |
| :--- | :--- | :--- |
| Risk tiers | Ghats grouped into Tier A (Act First), Tier B (Close Group), and Tier C (Lowest Concern) | Works (tested) |
| Plain-language reasons | Explanatory tags showing why a ghat was flagged (hypoxia, organic shock, slow recovery) | Works (tested) |
| Evidence tables | Row-by-row table listing every test with report name, festival, phase, and source page | Works (tested) |
| Data-gap grid | Matrix showing coverage across all 6 multi-year events with cell inspection | Works (not browser-tested) |
| Unmonitored sites list | Editable operational list of 5 provisional sites reported in press without testing history | Works (not browser-tested) |
| Top 3 Actions | Algorithmically prioritized civic actions with trigger rules and supporting evidence | Works (tested) |
| Ganesh-to-Durga carry-over warning | Operational warning showing that water quality starts Durga worse than Ganesh | Works (tested) |
| Festival filter | Buttons to recalculate tiers for Durga-only or All historical events | Works (tested) |
| Map and search | Bhopal map with tier pins and search bar for monitored and provisional sites | Works (not browser-tested) |
| New-reading check | Sandbox form comparing a field measurement against Class B and historical percentiles | Works (tested) |
| English / Hindi switch | Segmented control toggling UI text with a draft review notice | Works (not browser-tested) |
| One-page brief & WhatsApp summary | Deterministic bilingual brief with number-lock verification and one-click copy | Works (tested) |
| Print view | Clean layout to print or export the operational brief to PDF | Works (not browser-tested) |
| Demo officer area | Prototype login, client-side CSV upload, and simulated threshold alerts | Prototype / demo only |
| Trust and limits section | Transparent summary of 10 governance rules and data limitations | Works (not browser-tested) |

---

## Key findings from the data

The findings below come from the verified historical dataset (2023–2025). They do not represent live water quality today.

- **1,524 total records** analyzed across 7 monitored ghats.
- **Dissolved Oxygen (DO)** dropped below the 5.0 mg/L limit in 42 of 116 numeric tests (36.2%).
- **Biochemical Oxygen Demand (BOD)** exceeded the 3.0 mg/L limit in 100 of 112 numeric tests (89.3%).
- **pH** fell outside the 6.5 to 8.5 range in 6 of 115 numeric tests (5.2%).
- **Seasonal Carry-Over Effect**:
  - Pre-immersion DO is lower at Durga than at Ganesh in 14 of 19 paired ghat-years (mean Ganesh pre: 6.27 mg/L vs Durga pre: 5.51 mg/L).
  - Pre-immersion BOD is higher at Durga than at Ganesh in 14 of 18 paired ghat-years (mean Ganesh pre: 4.55 mg/L vs Durga pre: 6.53 mg/L).
- **All-Events Triage Ranks**:
  - **Tier A (Act First)**: Bairagarh (score 0.42, top 2 in 100% of resamples, top 1 in 98.95%).
  - **Tier B (Close Group)**: Shahpura (0.26), Malikhedi (0.23), Hathaikheda (0.20), Rani Kamlapati (0.19), Khatlapura (0.17).
  - **Tier C (Lowest Concern)**: Prempura (score 0.07, bottom 2 in 99.8% of resamples).
- **Durga-Only Triage Ranks**:
  - Both Bairagarh (score 0.49, pTop2: 99.95%) and Shahpura (score 0.35, pTop2: 85.8%) qualify for Tier A.
  - Prempura remains Tier C (score 0.03, pBottom2: 100%).

---

## How the risk tiers work

- The composite score combines three key water parameters: DO (weight 0.45), BOD (weight 0.40), and pH (weight 0.15).
- Benchmarks use Central Pollution Control Board (CPCB) Class B outdoor bathing criteria: DO >= 5 mg/L, BOD <= 3 mg/L, pH 6.5 to 8.5.
- Because each ghat has only about 6 historical events, ranking 1 to 7 directly creates false precision.
- We run bootstrap resampling 2,000 times with random draws of historical events to see if ranks stay stable.
- **Tier A (Act First)**: Ghats ranking in the top 2 highest risk positions in 80% or more of resamples.
- **Tier B (Close Group)**: Middle ghats where ranks fluctuate across events; order within this group is not reliable.
- **Tier C (Lowest Concern)**: Ghats ranking in the bottom 2 positions in 80% or more of resamples. Tier C is NOT certified clean or safe.
- The weights, cutoffs, and benchmark choices are operational policy judgements, not physical laws.

---

## How we keep the data honest

| Value State | Count in Dataset | Meaning |
| :--- | :---: | :--- |
| Measured value (`value`) | 1,226 | Genuine numeric laboratory measurement |
| Below Detection Limit (`bdl`) | 174 | Concentration was below instrument measurement threshold; not zero and not missing |
| Likely BDL (`likely_bdl`) | 63 | 2025 numeric value matching a known detection limit without the "<" prefix; flagged for checking |
| Not sampled (`not_sampled`) | 61 | Report explicitly states not sampled or cell is blank; total absence of evidence |
| **Total** | **1,524** | **Complete verified row count** |

- **Missing is never zero**: Unrecorded tests are never counted as clean water.
- **Missing is never green**: Data gaps appear with hatched patterns, never as passing scores.
- **Strict provenance**: Every reading retains its report year, festival, and source page citation.
- **Immutable raw data**: The official CSV file is never edited or overwritten by the application.

---

## Limits and assumptions

- **Assumed Units**: Official MPPCB reports omit units in tables. Standard units (mg/L for DO and BOD; standard logarithmic units for pH) are assumed.
- **Unconfirmed BOD Method**: MPPCB lake reports mention 3 days at 27 °C, while CPCB Class B requires 5 days at 20 °C. Immersion tables state no incubation method.
- **No Coliform Data**: National Class B criteria limit total coliform to 500 MPN/100ml. The MPPCB visarjan dataset contains zero microbial tests.
- **63 Likely-BDL Values**: Exactly 63 numeric metal readings in 2025 match laboratory detection limits (Chromium 29, Lead 19, Copper 13, Zinc 2). They require MPPCB confirmation.
- **Missing 2025 Durga Tables**: Bairagarh and Malikhedi have no tables in the published 2025 Durga report.
- **Provisional Blind Spots**: The 5 unmonitored sites come from a February 2026 press report and need BMC validation.
- **Approximate Map Coordinates**: Ghat latitude and longitude coordinates are visual approximations.
- **Draft Hindi Text**: Hindi translations are automated draft text that require human administrative review.
- **Decision Support Only**: This tool assists municipal triage. It is not an epidemiological health study.
- **No Disease Conclusions**: Low oxygen levels indicate aquatic stress, not human disease incidence.

---

## Demo mode features

- **Officer Login**: Use demo credentials `test@gmail.com` with password `123`.
- **Visible Credentials**: Login credentials are defined in `src/ui/demoAuth.ts` and visible in client code. This is not real security.
- **In-Memory Storage**: Uploaded CSV data and generated alerts exist only in your browser tab memory. Nothing is sent to a server or saved to a database.
- **WhatsApp Summary**: The button copies formatted text to your system clipboard. No actual network messages are transmitted.
- **Production Requirements**: A production version requires a secure server backend, database persistence, authenticated sessions, audit logging, and an approved WhatsApp Business API account.

---

## What works / What does not work yet

### What works
- Parsing 1,524 rows into 4 distinct value states (`npm run verify`).
- Flagging 63 detection-limit metal placeholders (`npm run verify`).
- Composite scoring and 2,000 bootstrap resamples (`npm run verify`).
- Generating per-ghat profiles and seasonal carry-over metrics (`npm run verify`).
- Validating field readings against Class B limits (`npm run verify`, `npm run verify:ui`).
- Generating bilingual briefs with number-lock validation (`npm run verify:ui`).
- Strict TypeScript typechecking for core and UI with zero errors (`npm run typecheck`).
- Production bundling with Vite (`npm run build`).

### What was not browser-tested
- Wide-screen responsive layout across 320px to 1920px viewports.
- Interactive Leaflet map rendering, zoom hijacking protection, and fullscreen expansion.
- Autocomplete search behavior with keyboard and mouse interactions.
- Dynamic DOM language toggling between English and Hindi.
- Inspection drawer clicks inside the monitoring matrix.
- Physical touch targets on mobile displays.

### What does not work yet
- No backend server or database storage.
- No automated WhatsApp message delivery.
- No direct ingestion or OCR parsing of government PDF files.

---

## How to run it

Prerequisites: Node.js (tested on v24.16.0; Node.js 18+ required) and npm.

```bash
# 1. Clone the repository
git clone [REPOSITORY URL: fill in]
cd ghat-triage-core

# 2. Install dependencies
npm install

# 3. Start local development server (runs at http://localhost:5173)
npm run dev

# 4. Run core data verification checks
npm run verify

# 5. Run UI and extended logic verification checks
npm run verify:ui

# 6. Check TypeScript types across core and UI
npm run typecheck

# 7. Build production static bundle into dist/
npm run build

# 8. Preview production build locally
npm run preview
```

---

## How to check our work (for evaluators)

Follow this 5-minute walkthrough to inspect the live project:

1. Start the server with `npm run dev` and open `http://localhost:5173`.
2. Inspect the map and top bar: Observe 7 monitored pins and 5 unmonitored site markers.
3. Switch Event Filter to "Durga Visarjan": Verify that Shahpura joins Bairagarh in Tier A.
4. Click "View Detailed Evidence & Testing History" on Bairagarh: Inspect the row-by-row evidence drawer.
5. Verify the zero-DO readings: Check Bairagarh records for Ganesh 2023 (p. 26), Durga 2023 (p. 60), and Ganesh 2025 (p. 28).
6. Open the Data-Gap Grid: Verify hatched missing cells for Bairagarh and Malikhedi in Durga 2025. Click a cell to inspect source metadata.
7. Open the "Check an entered reading" form: Select Prempura, DO, 3.2 mg/L. Verify it flags as failing Class B.
8. Click "हिं" in the top bar: Confirm interface labels change to Hindi with the human-review draft pill.
9. Scroll down to the Bilingual Brief: Confirm the green "Number-Lock Verified" badge is visible.

### Verification status

| Check | Type | Status | Result |
| :--- | :--- | :---: | :--- |
| `npm run verify` | Automated | ✅ done | 1,524 rows, scoring, carry-over, and states verified |
| `npm run verify:ui` | Automated | ✅ done | UI logic, coverage, and number lock verified |
| `npm run typecheck` | Automated | ✅ done | Zero TypeScript errors across core and UI |
| `npm run build` | Automated | ✅ done | Production bundle built cleanly into `dist/` |
| Visual Browser Rendering | Visual / Manual | ⚠️ partly | Code written; not tested in an interactive browser |
| PDF Source Audit | Human review | ⬜ not done | Audit about 20 readings against original MPPCB PDFs |
| Site List Confirmation | Municipal review | ⬜ not done | Confirm 5 provisional press sites with BMC officers |
| BOD Incubation Protocol | Lab inquiry | ⬜ not done | Confirm 3-day vs 5-day protocol with MPPCB |
| Hindi Translation Audit | Linguistic review | ⬜ not done | Human officer review of draft Hindi wording |

---

## Project structure

```text
ghat-triage-core/
├── data/
│   └── bhopal_ghats_2023_2025.csv       # Verified MPPCB dataset (1,524 rows, read-only)
├── scripts/
│   ├── verify.ts                         # Core data and scoring verification script
│   └── verify-ui.ts                      # Extended logic and number-lock verification script
├── src/
│   ├── core/
│   │   ├── actions.ts                    # Top 3 priority actions generator
│   │   ├── briefText.ts                  # Bilingual brief and WhatsApp text generator
│   │   ├── clean.ts                      # CSV parser and value state classifier
│   │   ├── coverage.ts                   # Multi-year event coverage and confidence ratings
│   │   ├── facts.ts                      # Deterministic facts compiler for briefs
│   │   ├── insights.ts                   # Per-ghat profile tags and carry-over logic
│   │   ├── limits.ts                     # CPCB Class B threshold evaluator
│   │   ├── numberLock.ts                 # Number-lock anti-hallucination validator
│   │   ├── score.ts                      # Composite scoring and 2,000-resample bootstrap tiers
│   │   └── types.ts                      # Shared TypeScript domain types
│   └── ui/
│       ├── components/                   # React components (map, header, tiers, matrix, drawers)
│       │   └── officer/                  # Demo officer workspace (overview, upload, alerts)
│       ├── i18n/                         # Zero-dependency typed translation system (EN & HI)
│       ├── App.tsx                       # Root dashboard application
│       ├── demoAuth.ts                   # Mock authentication credentials
│       ├── readingDisplay.ts             # Display label helpers for reading states
│       └── styles.css                    # Fluid CSS styling and responsive layout
├── package.json                          # Dependencies and script definitions
├── tsconfig.json                         # TypeScript configuration for core and scripts
├── tsconfig.ui.json                      # TypeScript configuration for UI components
└── vite.config.ts                        # Vite bundler configuration
```

---

## Tech stack and why

- **React 18**: Provides component-based UI composition.
- **TypeScript 5**: Enforces strict type safety and identical bilingual translation keys.
- **Vite 5**: Fast development server and production bundler.
- **PapaParse 5**: Fast, client-side CSV parsing.
- **Leaflet 1.9 & OpenStreetMap**: Interactive mapping without external tracking or API keys.
- **Why No Backend or AI**: Keeps calculations 100% deterministic, auditable, and transparent for municipal officers.

---

## Data sources

- **Madhya Pradesh Pollution Control Board (MPPCB) Reports**:
  - 2023: `Idol_immer._Report_23_CPCB.pdf`
  - 2024: `Ganesh_and_Durga_visarjan_report-2024.pdf`
  - 2025: `Ganesh_and_Durga_visarjan_report-2025.pdf`
- **Central Pollution Control Board (CPCB)**: Water Quality Criteria for Class B (Outdoor Bathing).
- **Cleaned Dataset**: `data/bhopal_ghats_2023_2025.csv`.
- **License**: MIT License (see [LICENSE](LICENSE)).

---

## Roadmap

1. Audit historical readings directly against original MPPCB PDF printouts (Planned).
2. Validate provisional immersion sites with BMC field officers (Planned).
3. Deploy static web application to GitHub Pages (Planned).
4. Implement secure authenticated backend for official data entry (Planned).
5. Integrate approved WhatsApp Business API for automated officer notifications (Planned).
6. Collect total coliform bacterial data during immersion rounds (Planned).

---

## Team

| Name | Role | Contribution |
| :--- | :--- | :--- |
| [MEMBER 1: fill in] | [ROLE: fill in] | [CONTRIBUTION: fill in] |
| [MEMBER 2: fill in] | [ROLE: fill in] | [CONTRIBUTION: fill in] |
| [MEMBER 3: fill in] | [ROLE: fill in] | [CONTRIBUTION: fill in] |

---

## Glossary

- **DO (Dissolved Oxygen)**: Oxygen dissolved in water needed by fish. Class B requires at least 5.0 mg/L.
- **BOD (Biochemical Oxygen Demand)**: Amount of oxygen consumed by organic waste. Class B allows at most 3.0 mg/L.
- **pH**: Scale measuring acidity or alkalinity. Neutral is 7.0; Class B standard is 6.5 to 8.5.
- **BDL (Below Detection Limit)**: A true laboratory measurement below the instrument detection threshold. It is not zero.
- **Likely BDL**: A numeric reading matching an instrument detection limit where the "<" sign was omitted in published tables.
- **CPCB (Central Pollution Control Board)**: India's national environmental regulatory board.
- **MPPCB (Madhya Pradesh Pollution Control Board)**: State authority that tests water quality across Bhopal ghats.
- **BMC (Bhopal Municipal Corporation)**: Urban local body responsible for city immersion arrangements and cleanup.
- **Class B**: CPCB national water quality standard designated for outdoor bathing.
- **Bootstrap Resampling**: Statistical technique that re-runs ranking 2,000 times with random draws of events to test stability.
- **Risk Tier**: Attention category (Tier A = Act First, Tier B = Close Group, Tier C = Lowest Concern).

---

## Disclaimer

Visarjan Ghat Watch is a decision-support prototype based on historical water quality records.
It does not provide live sensor telemetry.
It is not a substitute for official laboratory testing or statutory directives from MPPCB or CPCB.
It provides no medical, epidemiological, or public health safety certifications.
