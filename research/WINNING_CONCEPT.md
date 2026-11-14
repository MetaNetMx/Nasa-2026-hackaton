# Winning Concept: judging panel verdict

Challenge: NASA Space Apps 2026, "Create Health Monitoring Software for Astronauts on Space Missions" (`research/challenge_raw.txt`). Judging criteria: Impact, Creativity, Validity, Relevance (NASA data as core), Presentation. Dataset facts come from the verified list in `research/DATASETS.md`. Unsourced items are marked [inference].

## 1. Scores (1-5)

| Concept | Impact | Creativity | Validity | Relevance | Presentation | 48-h feasibility | Total /30 |
|---|---|---|---|---|---|---|---|
| 1 SpaceMirror | 4 | 5 | 3 | 4 | 5 | 2 | 23 |
| 2 Delta-Me | 4 | 4 | 5 | 5 | 4 | 5 | **27** |
| 3 LIGHTLAG | 5 | 4 | 4 | 4 | 4 | 3 | 24 |
| 4 HULL | 3 | 4 | 3 | 4 | 4 | 3 | 21 |

Reasons:
- **SpaceMirror.** It has the best wow moment, because the judge becomes the astronaut. But it stacks five risky parts: rPPG, PERCLOS, pose sway, voice parsing and a 3D CC BY-SA mesh. None of these sensing outputs is validated, so Validity takes the hit, and the build is the hardest of the four to finish in 48 h. Its real data appears only as decoration on the twin.
- **Delta-Me.** It is the only concept with a finding we can check against the data ("N in-range values that are abnormal for this person"). It uses three real human OSDR datasets as the actual logic, and its main build is a small Z-score engine plus an SVG body map. Its weakness is that the headline number is unknown until hour 4, so it needs the trend-velocity fallback.
- **LIGHTLAG.** It has the strongest operational story, Earth-independent medicine (comm delay, EVA go/no-go, store-and-forward), which matters most for Mars. But the comm queue, ground tab, FHIR, PVT and EVA board make the scope large, and the delay feature does not use any NASA data.
- **HULL.** The metaphor is memorable, but it risks making medicine feel trivial, and ten decks spread the data thin. The "412 of 600 mSv" figure and the MSL RAD constant are unverified. The best part to keep is the SPE alarm with its "you act first" beat.

## 2. Final concept: **DELTA-ME, your own baseline, 20 minutes from help**

Delta-Me is the base. It takes three grafts and nothing more:
1. From LIGHTLAG: a signal-delay banner plus an escalation tier ("Ground reply ETA 41 min, you act first"). This is UI text only, not a packet system.
2. From HULL and SpaceMirror: the live or replayed SPE alarm with one action tap ("Shelter").
3. From SpaceMirror, as a stretch: a webcam pulse check using vitallens.js local mode.

**Pitch.** Lab reference ranges were built from people living on Earth. Delta-Me scores each astronaut against their own pre-flight baseline, so it catches drift that a standard lab report calls normal. It shows this on real Inspiration4 blood data, adds live NOAA and NASA radiation alerts on top, and says what to do when the flight surgeon is 20 minutes away.

**Wow moment (30 s).**
1. The screen shows "Crew C00x, R+1, real NASA OSDR data". Every region of the body map is green, because every value is inside the population range.
2. The presenter flips one toggle, "Population range → My baseline". Regions turn amber or red, and a counter appears: "N hidden deviations across 4 crew".
3. The presenter presses "Solar particle event" (a replayed real SWPC alert with its original timestamp, or live if one is active). The radiation layer goes red and the banner reads "Ground reply ETA 41:12. You act first: shelter, no EVA, retest CBC in 48 h." The judge taps Shelter and the board settles.

### Features

**MVP (must ship):**
- A data build script turns the OSD-575 CMP, OSD-569 CBC and OSD-656 urine files into `crew.json`. The file holds each crew member's timepoints, baselines and the shipped `*_range_min/_range_max` columns.
- A personal-baseline engine with these rules:
  - green: within ±2 SD of the person's own baseline
  - yellow: beyond ±2 SD
  - red: beyond ±3 SD, or outside the population range
  - The SD comes from the pooled within-subject SD, with a minimum floor, because each person has only about 3 pre-flight points.
- A clickable SVG body map with 6 regions: blood, immune, kidney, liver, metabolic and radiation. Clicking a region shows what the organ does, its status, a sparkline and a "Why this exam?" drawer linking the HRP risk page and the hazard involved.
- The population/personal toggle and the deviation counter, which is the headline.
- A radiation layer fed by NOAA SWPC (no key, read client-side), with DONKI SEP/GST as the NASA source through a cached proxy. A bundled replay event covers the offline case.
- A mission preset (ISS, Moon or Mars) that sets the one-way delay banner and the escalation tier: self, then crew medical officer, then flight surgeon.
- Rule-based action cards with citation chips. Each card shows the rule that fired, and the screen carries a "Decision support, not diagnosis" banner.
- Daily self-entry for BP, HR, glucose, temperature, sleep hours, mood (a 1-5 tap) and NASA-TLX. These values are scored against the same personal baselines.
- A methods page listing accession numbers, the API calls, n=4 and the limitations.

**Stretch (in cut order, cut from the top first):**
1. A webcam pulse check (vitallens.js local POS/CHROM), labelled "estimate".
2. Replay of the MMASH 24 h HR and sleep trace as a simulated wearable feed, labelled SIMULATED.
3. A trend-velocity view, which is also the fallback headline.
4. A flight-surgeon packet exported as FHIR Observation JSON.
5. A light streak and "baseline confidence" meter.

**Explicitly out of scope:** 3D twin, WebLLM, Open MCT ground view, PVT, voice input, omics files.

### Datasets and exactly how each is used

| Dataset | Role | Exact use |
|---|---|---|
| OSD-575 CMP TRANSFORMED csv (8.5 KB) | core | Supplies glucose, electrolytes, kidney and liver analytes for each crew member and timepoint. Pre-flight rows give the baseline mean and SD. The `*_range_min/max` columns give the population band. These drive the metabolic, kidney and liver regions. |
| OSD-575 cardiovascular + immune Eve csv (6 KB, 41 KB) | core | Shown as relative change from baseline only. Drives the immune glow and a cardiac tile, with no population band. |
| OSD-569 CBC TRANSFORMED csv (9.3 KB, 28 rows, 61 cols) | core | Supplies WBC, RBC, Hgb, platelets and the differential, with their ranges. Drives the blood and immune regions (anemia and immune shift). |
| OSD-656 urine NULISAseq TRANSFORMED csv (115 KB) | core | Picks 5 inflammation markers. Values are NPQ, so the tile shows change from the person's baseline only, framed as a "low-burden self-sample". |
| NOAA SWPC JSON (protons, alerts, noaa-scales) | core, live | Gives the S-scale banner and proton flux sparkline, and triggers the SPE action. |
| NASA DONKI SEP/GST/FLR (api.nasa.gov, personal key) | core, live | Provides the NASA-sourced event list, cached by a proxy. Its event timestamp is shown on the alert. |
| NASA HRP Human Research Roadmap risks | logic | Gives each region its risk link and hazard mapping in the "Why this exam?" drawer. |
| NTRS (NASA-TLX 20000021488; search API) | logic | Provides the TLX form and the citations for thresholds. |
| PhysioNet MMASH (23.5 MB, ODbL) | stretch | Supplies the simulated wearable HR and sleep feed. |
| OSD-570/571/687/572-574/630 etc. | citation only | Cited as background on the methods page. Never downloaded. |

Sampling caveat: we must check in the ISA zip at hour 0-4 whether there are in-flight samples or only pre- and post-flight ones. If they are pre/post only, the story becomes "return day R+1" [inference].

### Data the user must fetch from Kaggle (account login needed)

None of these is required for the MVP. They are optional extras for the stretch features:
- FitBit Fitness Tracker Data, CC0: https://www.kaggle.com/datasets/arashnic/fitbit . A second option for the simulated HR, sleep and steps feed if MMASH parsing goes slowly. Save it under `data/kaggle/fitbit/`.
- Sleep Health and Lifestyle Dataset, CC0: https://www.kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset . Use it only to sanity-check sleep and stress self-entry defaults. Check the row count (400 vs 374) before citing it.

Do not use the Kaggle heart, mental-health or skin datasets, which are off-scope.

### Architecture and tech stack

```
build time:  scripts/fetch_osdr.py (GET geode-py download URLs; HEAD returns 403)
             -> pandas -> public/crew.json  (+ public/replay_spe.json snapshot of SWPC/DONKI)
runtime:     Vite + React + TS + Tailwind + Recharts
             SVG body map -> zustand store -> rules engine (pure TS, unit-tested)
             SWPC fetched client-side; /api/donki Vercel function holds the key and caches 1 h
             localStorage for self-entries; no backend DB; deployed on Vercel (HTTPS)
```

### 48-hour plan by role (4 people)

| Hours | Data/Science | Frontend A (body map) | Frontend B (live + rules UI) | Story/PM |
|---|---|---|---|---|
| 0-4 | Fetch the 3 CSVs and map sample IDs to crew and timepoints from the ISA. Compute the hidden-deviation count and lock the headline. | Scaffold the app and draw the SVG regions. | Register the DONKI key, write the proxy, snapshot the SWPC replay. | Write the HRP risk map and the citation table. |
| 4-16 | Write `crew.json` and the Z-score engine, plus tests. | Wire regions to data, add the drawer and sparklines. | Radiation banner, mission presets, delay banner. | Action-card text and the escalation tiers. |
| 16-30 | Self-entry scoring, methods-page numbers. | Toggle animation and counter. | Self-entry forms, TLX, action cards. | Draft the slides and the demo script. |
| 30-40 | Stretch: trend velocity, MMASH. | Polish, mobile, accessibility (icon plus text, never color alone). | Stretch: webcam HR (cut at H34 if unstable). | Record a backup screen capture. |
| 40-48 | Freeze at H44. Deploy, README with provenance. | Bug fixes. | Offline test. | 30 s video, 7 slides, submit. |

### Demo script (30 s video and live)
1. (0-5 s) "Inspiration4 crew, real NASA blood panels. A standard lab report says everything is normal."
2. (5-15 s) Flip the toggle. "Against their own baseline, N values aren't." Click the kidney region, show the drawer and the HRP link.
3. (15-25 s) Set the preset to Mars, then trigger the SPE. "Help is 41 minutes away. Delta-Me says act now." Tap Shelter.
4. (25-30 s) "Real NASA data, every rule cited, live at <url>."

### Risks
- **n=4 crew and a 3-day flight.** Show n on screen and frame the result as a demonstration of the method.
- **Unstable baseline SD.** Use the pooled within-subject SD with a floor, and say so on the methods page.
- **Zero hidden deviations.** Switch the headline to trend velocity plus the cytokine and urine panels.
- **DONKI 429 or a quiet sun.** Use SWPC as primary and replay the bundled event by default.
- **Medical liability.** Triage is deterministic, the banner is always visible, and every red result routes to the flight surgeon.
- **Licences.** Avoid PHQ-9/GAD-7 (licence unverified). MMASH is ODbL, so attribute it. Check PANAS before using it; the MVP uses a 1-5 mood tap.
- **Scope creep.** Follow the cut list above. Nothing from the out-of-scope list is added after H24.
