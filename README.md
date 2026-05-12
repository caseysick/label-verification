# Alcohol label verification (prototype)

Assistive web app for comparing **beverage label evidence** (pasted text or bundled OCR) against **structured application fields**, styled for reviewer workflows similar to TTB-style label checks. **Not** integrated with COLA or any production federal system.

## Quick start

```bash
npm install
npm run dev
```

Local development URL: [http://localhost:3000](http://localhost:3000).

Tests:

```bash
npm run test
```

Production build:

```bash
npm run build && npm start
```

## Approach

- **Next.js (App Router)** with **TypeScript** and **Tailwind CSS**.
- **Layered `src/lib`** layout:
  - `domain/`: shared types and constants (including canonical government warning baseline).
  - `compare/`: pure string normalization + per-field verdict logic (`match` | `mismatch` | `uncertain` | `missing`).
  - `ocr/`: adapters (`manual`, bundled **Tesseract.js** on the server).
  - `services/`: `runVerification` orchestration with timeouts and typed errors.
  - `api/`: **Zod** schemas for JSON boundaries.
- **API**
  - `POST /api/verify`: manual text or server OCR + comparison.
  - `POST /api/compare`: OCR-free comparison when the browser (or another client) supplies extracted text.
- **Security posture (prototype-level):** no secrets in client bundles for OCR; validate payloads; image size cap (~4&nbsp;MB decoded); **Node** runtime for OCR routes (`serverExternalPackages` includes `tesseract.js`).

## Take-home deliverables

Cross-reference with the project brief:

| Deliverable | Notes |
|-------------|--------|
| **Source code** | This repository. |
| **README** (setup, run, approach, assumptions) | Sections below; **spec alignment** and **design decisions** document traceability to the brief. |
| **Deployed application URL** | Reserved row for the hosted URL after deployment (e.g. Vercel or comparable); intended for submission materials per brief. |

## Spec alignment & requirement coverage

| Brief theme | Implementation location |
|-------------|----------------|
| Compare structured application ↔ label evidence | `VerificationWorkbench`, `runVerification`, `compareFields` |
| TTB-style fields (brand, class/type, ABV, net contents, bottler/producer address, country of origin, gov warning) | `ApplicationPayload`, `FIELD_ORDER`, UI + API schemas |
| Sample distilled spirits example (“OLD TOM DISTILLERY”, …) | `buildDemoApplication()` defaults |
| Government warning exactness + **`GOVERNMENT WARNING:`** banner | `government-warning.ts` (literal banner; normalized body; partial/typo paths → `uncertain`) |
| Brand / class nuance (e.g. casing; not brittle mismatches) | Fuzzy normalization + token overlap for **brand** and **class/type** only (`thresholds.ts`, `fuzzy-token-overlap.ts`) |
| ~5&nbsp;s feedback expectation | **Manual paste** offers the most predictable fast path; **bundled OCR** can exceed ~5&nbsp;s on first cold start (see limitations) |
| Batch / peak-season uploads | Server OCR accepts multiple images under **Label evidence**; **per-file** queue rows + **View comparison** keep results attributable to each file |
| Standalone POC (no COLA) | Described in this README intro |
| Blocked outbound / no cloud ML dependency required | Server-side **Tesseract.js**; no mandatory external inference API |
| Tests | `npm run test` (Vitest: compare pipeline + schemas + OCR adapters) |

**Out of scope for text/OCR-based comparison:** visual prominence of the warning (**bold**, type size, placement on artwork). Layout and presentation remain a human review responsibility; the prototype operates on transcribed text only.

## Design decisions (stakeholder context → engineering)

- **Latency:** A dependable **manual transcript** path supports repeatable demos and grading; OCR remains optional with timeouts rather than implying vendor-grade latency on hobby-tier hosting.
- **Firewall / egress:** **Bundled OCR** aligns with environments where outbound ML APIs are unreliable or blocked, avoiding reliance on features that fail behind strict egress.
- **Accessible UX:** Single workbench, large controls, plain-language statuses; OCR queue rows name files so outcomes stay accountable under spike workloads.
- **Government warning:** Banner substring and body text are treated conservatively; **`uncertain`** is preferred over silent **`match`** when OCR degrades wording. Pixel-level bold/size/layout verification is out of scope (see above).
- **Strict vs fuzzy fields:** Heuristic looseness is limited to **brand** and **class/type**; ABV, net contents, producer address, and country follow **strict** normalized substring checks for predictable behavior.

## Limitations & assumptions

- **Bundled OCR quality** varies with glare, skew, and resolution; **manual paste** is the most deterministic path for demos and evaluation.
- **Government warning** logic checks for the literal `GOVERNMENT WARNING:` banner plus normalized body text; **bold / font size / physical placement** are **not** scored (only recovered text). Real adjudication may require additional TTB-specific rules.
- **No database:** OCR queue runs sequentially in-session only.
- **Cold starts** on hobby hosts can exceed ideal ~5&nbsp;s UX for the first OCR invocation; latency is documented explicitly for evaluation transparency.

## Production-style deployment deltas (Treasury / Bureau narrative)

A hardened Bureau deployment would typically add: formal **authorization** (ATO/FedRAMP track), **agency IdP / PIV**, **encrypted storage & retention schedules**, **SIEM logging** without sensitive payloads, **allow-listed egress** (or on-prem inference), **supply-chain** governance for dependencies, and **continuous monitoring**. This repository stays deliberately scoped as a homework-grade prototype.

## Deploy (e.g. Vercel)

Typical deployment imports this repository with **Node** runtime for API routes; larger bundles and slower first OCR worker initialization are expected. The resulting public URL can be recorded in **Take-home deliverables** for submission alongside the brief.

## License

Private / homework use; no SPDX license file attached yet.
