# data.nasa.gov sweep for the astronaut health challenge

Date: 2026-11-14. The catalog is CKAN (`https://data.nasa.gov/api/3/action/package_search`) with **36,518 datasets**.

**Method:**
- 43 keyword queries plus a partial full crawl, giving 19,169 unique records.
- A human-relevance filter cut that to 411.
- The usable ones were hand-checked. Each had its download tested with curl and no login.

Raw files are in `data/raw/datanasa/`. The list is `shortlist.json` and the query dumps are in `q/`.

Most hits are **not usable** for a crew-facing app. They are rodent, cell, plant or microbe omics studies, or Earth-science datasets.

## Verified usable datasets (open, no login)

| Dataset | What it is | Access (tested) | Fits the app as |
|---|---|---|---|
| **ISS TEPC Dose Analyzer** ([catalog](https://data.nasa.gov/dataset/iss-tissue-equivalent-proportional-counter-tepc-dose-analyzer-10-s-data-61b24)) | ISS radiation from 2010-04-29 to 2018-04-11. Dose rate (µGy/min), dose equivalent (µSv/min), ISS lat/lon/alt, one row per minute. | HAPI JSON/CSV API `https://cdaweb.gsfc.nasa.gov/hapi/data?id=ISS_DOSANL_TEPC&...`. Works. | **Real radiation layer.** We pulled Sep 4-15, 2017: normal ≈0.9 mSv/day, and **the 2017-09-11 solar storm = 1.71 mSv/day (×1.9)**. Inside the South Atlantic Anomaly the median rate is ×2.1, with a peak minute of 33.5 µSv/min. |
| **Flight Crew Physiological Data for Crew State Monitoring** ([catalog](https://data.nasa.gov/dataset/flight-crew-physiological-data-for-crew-state-monitoring)) | Pilot pairs. ECG, respiration, GSR and 20-channel EEG at 256 Hz. Labeled cognitive states: channelized attention, diverted attention, startle/surprise, and a full simulated flight (LOFT). | `https://data.nasa.gov/docs/datasets/public/csm/{5,6,9,10}.zip`. Open, ~120 MB each. | **Readiness/fatigue model.** It derives HR, HRV, breathing rate and stress (GSR) and is trained against NASA's own state labels. This is the NASA source of the Kaggle "Reducing Commercial Aviation Fatalities" competition, so **no Kaggle needed**. |
| **MSL RAD Level 2 dosimetry** ([catalog](https://data.nasa.gov/dataset/mars-science-laboratory-msl-radiation-assessment-detector-rad-level-2-observation-dosimetr-e2695)) | Radiation dose rate on the **Mars surface** (Curiosity rover) | CDF files at `https://spdf.gsfc.nasa.gov/pub/data/aaa_planetary/msl/rad/cdf/obs-l2/` (listing opens). It is not in the HAPI catalog, so a CDF parser is needed. | Gives the "Mars base" preset its real dose rate |
| **NASA 3D Models: Astronaut** ([catalog](https://data.nasa.gov/dataset/nasa-3d-models-astronaut)) | 3D astronaut model (6,381 polygons) | The zip URL returns an HTML page, so the link is stale. Try https://nasa3d.arc.nasa.gov or the NASA 3D GitHub. | Body map or 3D twin (stretch) |
| Inspiration4 OSDR panels (OSD-575 CMP, OSD-569 CBC) | Real crew blood work, 3 pre-flight and 4 post-flight timepoints | Downloaded. See `data/raw/osdr/`. | **Delta-Me core.** Personal-baseline tests (see below) |
| Mars-520 epigenetics (GLDS-140), astronaut sEV small RNA, "Spaceflight Modulates Gene Expression in Astronauts", astronaut hair follicles (ISS) | Human omics from isolation and flight | GeneLab/OSDR, open | Background science only. Too heavy for a crew UI. |
| ASRS crew fatigue reports | Narrative PDFs of real pilot fatigue reports | Open PDFs | Optional: real quotes for the fatigue "why" cards |

Not usable or not reachable:
- ATom ARMAS: the URL is `/protected/`, so it needs an Earthdata login.
- The EVA US/Russia API: the Socrata endpoint returns 404.
- Head-down tilt (OSD-679): it is a rat model, not human.

## Delta-Me feasibility test on the Inspiration4 day-after-landing samples (R+1)

The method compares each value to the person's own pre-flight mean, using the SD pooled within each person across the crew.

- 151 checks in total.
- Only **5** values are outside the lab's population range.
- **11** are in range but ≥2 SD from the person's baseline. About 7 would be expected by chance.
- **4** are in range but ≥3 SD. Under 1 would be expected by chance. **Use 3 SD.**
- Headline: **MCV fell in all 4 crew members (−2.8 to −4.6 SD) while every value stayed "normal"**. MCV is mean red-cell volume.

## The winning idea from this data

**Real NASA signals drive every color in the app. Nothing is mocked.**

1. **Personal baseline (Inspiration4):** each crew member is compared against themselves. The standard population range would hide these shifts.
2. **Live radiation, replayed for real (ISS TEPC):** the dose meter replays real ISS minutes. It shows South Atlantic Anomaly passes on an orbit map and the real 2017-09-11 storm doubling the daily dose. Then comes "Ground reply in 41 min: shelter now" (the Mars preset).
3. **Readiness from heart, breathing and skin signals (crew-state data):**
   - A small model trained on NASA's labeled pilot-attention data estimates HR, HRV and breathing rate.
   - The webcam pulse check feeds the same readiness score in the demo.
   - Pitch: "your sensors tell you whether you are ready for an EVA".

This combination uses three independent NASA datasets as core logic, which covers Relevance and Validity. The cross-check showed that no 2025 winner and no past astronaut-health entry did this.
