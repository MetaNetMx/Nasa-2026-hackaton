# In-flight crew health monitoring and autonomous medical care: literature notes

Purpose: design inputs for an astronaut self-assessment health tool (NASA Space Apps 2026).
Method: NASA NTRS API records (title/abstract read; full PDFs NOT read), CSA Bio-Monitor page, NASA HRP pages already in `raw/`. Raw downloads: `research/raw/monitoring/` (NTRS JSON in `rec/`, `n_*.json`).
Convention: every claim has a URL. Items tagged **[inference]** are mine, not sourced. NTRS record URL pattern: `https://ntrs.nasa.gov/citations/<id>`.
Limits: abstracts only; no numbers invented. Not found in sources: Moon/Mars delay figures from a primary page, POMS cut-offs, alarm-fatigue studies for space medical UIs, Private Medical Conference (PMC) protocol detail beyond one record (see Gaps).

---

## 1. Earth-Independent Medical Operations (EIMO) and ExMC

- EIMO = gradual transfer of medical care and decision-making from terrestrial resources to space-based assets. Drivers: no resupply; limits on mass, power, volume, data; communication latency; inability to evacuate. Needs integration with mission planning, vehicle, suit, and data architecture. Source: EIMO ConOps, https://ntrs.nasa.gov/citations/20230014109 (also 20240001402, 20250000009).
- Terrestrial assets stay essential for pre-mission screening, planning, prevention, health maintenance, long-term care contingencies. Source: EIMO Datascope, https://ntrs.nasa.gov/citations/20240000914 ; EIMO Definition Workshop, https://ntrs.nasa.gov/citations/20240002454.
- Task saturation is an explicit risk: today LEO offloads most medical tasks to ground teams ("dozens of flight surgeons, specialists, and engineers": monitoring environmental systems, tracking medications, guiding procedures, advice). Beyond LEO these fall on the crew. Source: Task Load Management in EIMO, https://ntrs.nasa.gov/citations/20230015503.
  - **[inference]** Design implication: the app must reduce crew cognitive load (few prompts, auto-capture, prioritised actions), not add to it.
- ExMC (Exploration Medical Capability, HRP element) mission: advance medical system design and risk-informed decision making beyond LEO. Source: https://ntrs.nasa.gov/citations/20210022439.
- Key autonomy drivers named by ExMC: lack of consumable resupply, evacuation opportunities, real-time ground support. Source: https://ntrs.nasa.gov/citations/20205008379.
- Mars medical ConOps: 2-3 year missions; constraints on real-time communication, resupply, evacuation drive architecture; considers time to definitive care, crew-ground communication protocols, crew skill sets, medical hardware/software, data management. Source: https://ntrs.nasa.gov/citations/20200001715.
- Required EIMO medical-system features (5): (1) prevention/diagnosis/treatment tech, (2) fits mass/volume/power/crew-time/training limits, (3) accounts for the astronaut caregiver's medical skill level, (4) data collected/stored/analysed in a central architecture, (5) guidance/support tools enabling autonomy. Source: https://ntrs.nasa.gov/citations/20230001365.
- Crew Health & Performance Integrated Data Architecture (CHP-IDA): CHP data on ISS is manually downlinked and in disparate locations; project builds a backend to collect, store, process, display it, auto-collected, synchronised across vehicles/habitats/ground "as communication delay permits". Source: https://ntrs.nasa.gov/citations/20240008508.
  - **[inference]** Offline-first with later sync is a sound pattern for the tool.

## 2. Medical Decision Support (CDSS / MDSS)

- ExMC Clinical Decision Support System (CDSS) goal: augment crew knowledge/skills/abilities under time pressure, stress, fatigue, "potential medical crisis"; guide autonomous diagnosis, treatment, prevention. Source: https://ntrs.nasa.gov/citations/20210025824 ; ConOps https://ntrs.nasa.gov/citations/20220017856 ; "Augmenting Crew Autonomous Medical Decision Making" https://ntrs.nasa.gov/citations/20205008927.
- Datascope: AI-based CDSS to monitor/analyse data and give real-time consultative support to the Crew Medical Officer (CMO); data flow/storage severely constrained. Source: https://ntrs.nasa.gov/citations/20240000914.
- Autonomous Medical Operations (AMO) project: AI trained on ultrasound images (e.g., pericardial effusion vs pneumothorax) as baseline for a Medical Decision Support System advising crew on long missions. Sources: https://ntrs.nasa.gov/citations/20180002541 ; https://ntrs.nasa.gov/citations/20170010678.
- Multi-functional integrated medical devices: NASA trade study picked Tempus Pro and LifeBot 10 (BP, ECG, HR, EtCO2, respiration rate, SpO2, temperature, ultrasound; procedural guidance, report generation). Source: https://ntrs.nasa.gov/citations/20240001624. ISS demo prep: https://ntrs.nasa.gov/citations/20230001365.
- **[inference]** A hackathon tool should present itself as decision *support* (what to measure, interpret ranges, escalate or not), with the crew/flight surgeon retaining authority, consistent with "augment" framing above.

## 3. Integrated Medical Model (IMM)

- IMM: probabilistic (Monte Carlo) simulation forecasting medical events, resource use, probability of evacuation, probability of loss of crew life, and "quality time lost"; Crew Health Index derived from quality time lost. Evidence in iMED database; ~100 conditions. Sources: https://ntrs.nasa.gov/citations/20150002713 ; https://ntrs.nasa.gov/citations/20150022114 ; https://ntrs.nasa.gov/citations/20170001541.
- Original proposal to use IMM as the foundation for in-flight medical decision support for an autonomous crew: https://ntrs.nasa.gov/citations/20110023074.
- Validation: IMM under-predicted ~10% of modeled conditions for Shuttle missions and over-predicted ~20% for ISS missions; prediction strength depends on mission specs such as length. Source: https://ntrs.nasa.gov/citations/20190001886.
  - **[inference]** Do not present risk scores as precise probabilities; show ranges/uncertainty.

## 4. ISS Crew Health Care System (CHeCS) and ground roles

- CHeCS = Space Life Sciences group organised as Environmental Maintenance System, Countermeasures System, Health Maintenance System. Source: https://ntrs.nasa.gov/citations/20110011351. Exploration-era care/habitability drivers: https://ntrs.nasa.gov/citations/20090032068.
- Ground roles: ISS Medical Operations are supported by Flight Surgeons (board-certified physician overseeing all crew medical concerns) and Biomedical Engineer (BME) flight controllers (operational/engineering support for CHeCS). On an emergent crew call-down the BME contacts a Surgeon ASAP and coordinates a **Private Medical Conference (PMC)** between crew and Surgeon. Simulation study (5 BMEs) found real sequences deviated from the written procedure due to differing task priority perceptions and imprecise language; 40 recommendations (34 being implemented) incl. clearer instructions and faster Surgeon contact. Source: https://ntrs.nasa.gov/citations/20080026306.
  - **[inference]** For the tool: a one-tap "request PMC / escalate" action with an auto-assembled summary of current vitals and symptoms for the flight surgeon; wording must be unambiguous.
- NASA frames distance as the hazard that makes medical care "increasingly challenging" and requires self-sufficiency; up to 20 minutes one-way delay for Mars. Source: https://www.nasa.gov/hrp/hazard-distance-from-earth/ (local: `raw/sub/hrp_hazard-distance-from-earth.txt`).

## 5. Wearables: Astroskin / Bio-Monitor (CSA), Hexoskin

- CSA Bio-Monitor: smart shirt + headband + tablet app on ISS; records pulse and heart electrical activity, blood pressure, breathing rate and volume, skin temperature, SpO2, physical activity; can be worn during sleep and exercise; replaces separate ECG, BP cuff, fingertip oximeter, ankle activity sensors that are "bulky and invasive" and time-consuming; data sent to ground. Source: https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp (saved `raw/monitoring/csa_bm.html`).
- Commercial version of the Bio-Monitor shirt is Hexoskin (same CSA page). Hexoskin measures ECG, HR, HRV, breathing rate/volume, actigraphy, steps, cadence, via Bluetooth to phone/tablet (Wikipedia summary, company-sourced; low reliability): https://en.wikipedia.org/wiki/Hexoskin.
- Astroskin (earlier prototype): garment + headband measuring vital signs, sleep quality, activity; NASA-CSA collaboration since 2014; tested at Ames and in HERA (30-day analog missions) for 24-hour monitoring, exercise fitness, comfort/usability feedback. Sources: https://ntrs.nasa.gov/citations/20190001996 ; https://ntrs.nasa.gov/citations/20190000238 ; collaboration overview https://ntrs.nasa.gov/citations/20180008707.
- Astroskin accuracy study vs ECG, respiration rate, systolic BP during autogenic-feedback training and Orion re-entry simulations; data to the user's mobile device and the on-board Exploration Medical System; abstract concludes it looks suitable for ambulatory monitoring (abstract truncated in my read). Source: https://ntrs.nasa.gov/citations/20150021842.
- Lunar Health Monitor (Orbital Research SBIR): dry-electrode garment sensing respiration, temperature, ECG HR; intra- and extravehicular. Source: https://ntrs.nasa.gov/citations/20160005394.
- NASA gap statement (2015 abstract): NASA lacked a capability to noninvasively monitor crew for extended periods. Source: https://ntrs.nasa.gov/citations/20150021842.
  - **[inference]** App should accept wearable streams (HR, resp, temp, SpO2, activity) as passive inputs and reserve manual entry for what wearables miss (BP cuff, glucose, mood).

## 6. Ultrasound with remote guidance

- First ocular ultrasound in space: ISS crewmember with minimal sonography training, remotely guided by an imaging expert from Mission Control via space-to-ground video and two-way audio, using reference cards (landmarks, controls, target images); obtained B- and M-mode views and pupillary response. Source: https://ntrs.nasa.gov/citations/20050182738.
- "Balanced Expertise Distribution": four components: existing expertise, limited pre-flight training, adaptive onboard proficiency-enhancement tools, real-time ground guidance. Source: https://ntrs.nasa.gov/citations/20110011352.
- Beyond LEO ground guidance is delayed, so on-board AI image interpretation (AMO project, above) is the intended route. Sources in section 2.
  - **[inference]** For the tool: ultrasound module = guided acquisition (on-screen landmark cards, target images) plus store-and-forward image to flight surgeon; no diagnosis claims.

## 7. Behavioral health, cognition, mood, fatigue

- Spaceflight Standard Measures (flight study since 2018, >30 ISS astronauts): wrist activity/light sensor, sleep reports, cognition tests, saliva, blood, balance tests, strength, fecal samples, collected before/during/after missions. Sources: https://www.nasa.gov/reference/standard-measures/ ; https://www.nasa.gov/reference/artemis-ii-standard-measures/ (local `raw/sub/`).
- Cognition Test Battery (CTB): 10 sub-tests from low-level perception to high-level decision-making; Fine Motor Skills battery 4 sub-tests; norms from 91 "astronaut-like" pilots; response times more correlated than accuracy; first RT factor >40% of variance; NASA-STD-3001 requires performance within clinically accepted values. Sources: https://ntrs.nasa.gov/citations/20205008023 ; https://ntrs.nasa.gov/citations/20190025239.
- Newer work on reducing the CTB to a single alertness-and-mood score (Pundyavana, Gilad, Stahn, Basner; Applied Sciences 13(4):2364, 2023; no abstract retrieved): https://ntrs.nasa.gov/citations/77794093696409 (DOI 10.3390/app13042364).
- Reaction Self Test (Psychomotor Vigilance Self Test on ISS, Expeditions 21/22): addresses NASA gaps for brief, valid, low-burden objective cognitive measures and a practical objective aid to quickly identify and manage fatigue effects. Source: https://ntrs.nasa.gov/citations/20090029851.
- PVT in flight: brief 3-minute PVT in 24 astronauts on 6-month ISS missions; most important predictors of alertness were past performance, reported fatigue and stress, temperature and radiation exposure (ensemble model). Source: https://ntrs.nasa.gov/citations/20210022966.
- Mood scales: Shuttle/Mir study used subscales of the Profile of Mood States (POMS), Group Environment Scale, Work Environment Scale weekly (5 astronauts, 8 cosmonauts, 58 ground staff). Crew showed little time effect and less dysphoria than Earth work groups; but tension/dysphoria were displaced from crew to mission control and from control to management; commander support perceived to fall in the second half. Sources: https://ntrs.nasa.gov/citations/20040088701 ; https://ntrs.nasa.gov/citations/20040088445.
  - **[inference]** Mood self-ratings may under-report; combine with objective tests, and watch crew-ground interpersonal signals. Also, a mood tool should be short (weekly scale cadence is the evidence-based precedent).
- NASA behavioral risk page: isolation/confinement raise risk of anxiety and depression, affecting sleep, morale, decision making; self-care incl. keeping a journal recommended; windows and privacy help. Source: https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/ (local `raw/sub/`).
- Fatigue on ISS: causes include workload, extended duty, circadian misalignment, noise, elevated CO2, fluid shift, back pain; "space fog" (forgetfulness, slow reactions) correlates with arrival and may take up to 6 weeks to resolve. Source: https://ntrs.nasa.gov/citations/20140016946. CO2 on ISS typically ~10x Earth and linked to complaints of "mental viscosity" and headaches: https://ntrs.nasa.gov/citations/20160013696.

## 8. Sleep and actigraphy

- Wrist actigraphy validated in space (4 Shuttle astronauts): actigraph beat diary for bed/wake times; correlation with polysomnography r = 0.96 for sleep duration, r = 0.88 for sleep efficiency. Source: https://ntrs.nasa.gov/citations/20040141770.
- Shuttle study: scheduled rest-activity cycles 20-35 min shorter than 24 h; low, variable illuminance in cabin; reduced temperature-rhythm amplitude. Source: https://ntrs.nasa.gov/citations/20040088714.
- ISS: 16 sunrises/sunsets per day disrupt sleep-wake; LEDs simulate Earth light-dark cycle; scheduled relaxation/self-care. Source: https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/ (local `raw/sub/`).
- Bio-mathematical fatigue-model validity in operational environment evaluated: https://ntrs.nasa.gov/citations/20190025160 (abstract only; accuracy conclusion not read).

## 9. Communication delay

- NASA: Mars delay "up to 20 minutes one way"; HERA simulates up to 5 minutes each way. Source: https://www.nasa.gov/hrp/hazard-distance-from-earth/.
- 2025 NASA review of 20 years of delay research: delays harm crew behavioral health/performance and space-ground coordination; short delays (3 to 14 s one-way, "possible on lunar missions") are an evidence gap; analog studies lack fidelity for emergency response and complex procedures. Source: https://ntrs.nasa.gov/citations/20250003885.
- Not sourced: the figures "Moon ~1.3 s" and "Mars 4-24 min" given in the task brief. I could not retrieve a primary page for them (NASA pages returned 404/429). Treat as **[inference / brief-provided]**. The sourced figures above (up to ~20 min one-way; 3-14 s lunar-scenario one-way incl. relay/processing) are safer to cite.
  - **[inference]** Tool should show "ground contact status" and expected response latency per environment, and switch from "ask ground" to "act on onboard guidance, send summary" when latency exceeds an acuity-dependent threshold.

## 10. Human factors of medical UIs in space; alarm fatigue

- Caution & Warning on ISS uses various audio tones the crew must remember in high-stress, high-workload conditions, after training a year or more earlier; evidence suggests speech alarms may be recognised faster/more easily in off-nominal events; long missions require autonomous handling. Source: https://ntrs.nasa.gov/citations/20150021135.
- NASA SLS firing-room display design practice: minimise distractions in normal state, show intentional distraction only during warning/alarm, reduce detail of unimportant aspects. Source: https://ntrs.nasa.gov/citations/20140002818 (launch operations, not medical; applicable principle).
- Procedure clarity matters: ambiguous wording caused deviations in an ISS medical-operations procedure (section 4), https://ntrs.nasa.gov/citations/20080026306.
- Task saturation risk for small crews: https://ntrs.nasa.gov/citations/20230015503.
- Guidance gap: I found no NASA source specifically on "alarm fatigue" in space medical UIs. Everything below is **[inference]**:
  - Use tiered, rare interrupts: only red-tier items interrupt; yellow stays in-app; green silent.
  - Personal baselines and trend-based flags instead of single-point absolute thresholds (reduces false alarms).
  - Pair colour with icon/text (colour-blind, suit-glove/low-light use); speech or plain-language alerts per the speech-alarm finding.
  - Every alert must carry the next action (re-measure, treat, call, PMC), and measurement prompts should be batched to the crew schedule.

## Gaps and follow-ups

1. Moon ~1.3 s / Mars 4-24 min: cite a primary source (e.g., NASA SCaN/DSN page) before publishing in the deck.
2. PMC / Private Psychological Conference protocols beyond record 20080026306: not found in NTRS searches.
3. Alarm fatigue in clinical alarm literature (e.g., Joint Commission, AAMI) not retrieved; consider adding as terrestrial evidence.
4. Gamification evidence for crews: not covered here.
5. POMS item set/scoring: not retrieved; use only as precedent for a short mood scale.
6. Hexoskin technical specs: only Wikipedia (company-sourced) and the CSA page; no peer-reviewed validation retrieved.
