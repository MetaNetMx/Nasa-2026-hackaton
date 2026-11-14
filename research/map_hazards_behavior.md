# Hazard -> Risk -> Indicator Map (RIDGE hazards, behavioral/sleep/radiation/autonomy)

Scope: NASA HRP five hazards, with emphasis on isolation/confinement, sleep/circadian, radiation dosimetry (CSA CANS), and comm delay/autonomy. Source texts are in `research/raw/`. "[inference]" = my design proposal, not stated by a source. No numeric alert thresholds are given by the sources; any threshold in the app must be [inference] and clinician-set.

## Source key
- S1 NASA 5 Hazards: https://www.nasa.gov/humans-in-space/5-hazards-of-human-spaceflight/ (file `hazards.txt`; URL slug [inference], not in urls.txt - verify)
- S2 Risks overview: https://www.nasa.gov/hrp/risks/ (`risks.txt`; slug [inference])
- H-ISO https://www.nasa.gov/hrp/hazard-isolation-and-confinement/
- H-DIST https://www.nasa.gov/hrp/hazard-distance-from-earth/
- H-GRAV https://www.nasa.gov/hrp/hazard-gravity-fields/
- H-HOST https://www.nasa.gov/hrp/hazard-hostile-closed-environments/
- H-RAD https://www.nasa.gov/hrp/hazard-space-radiation/
- R-BEH https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/
- R-SLEEP https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
- R-TEAM https://www.nasa.gov/reference/risk-of-inadequate-teamwork/
- R-SYS https://www.nasa.gov/reference/risk-of-inadequate-systems-operations-support/
- R-CANCER https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/
- R-HOSTMIC https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/
- R-HYPOXIA https://www.nasa.gov/reference/risk-of-hypoxia/
- SM https://www.nasa.gov/reference/standard-measures/ ; ARCHeR https://www.nasa.gov/reference/archer/ ; A2SM https://www.nasa.gov/reference/artemis-ii-standard-measures/ ; TEMPUS https://www.nasa.gov/reference/tempus-pro/ ; CIPHER https://www.nasa.gov/reference/cipher/
- GARDEN https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/
- CSA-RAD https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- CSA-SCI https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp

## 1. The five hazards (S1)
Space radiation, isolation and confinement, distance from Earth, gravity fields, hostile/closed environments. NASA states the hazards "do not stand alone" and can "feed off one another" (S1) -> the app should show compound-risk, not isolated metrics [inference].

## 2. Master map

| Hazard | Risk (NASA name) | What the source says | Candidate indicator for the app | Source |
|---|---|---|---|---|
| Isolation & confinement | Behavioral conditions & psychiatric disorders | Anxiety, depression; impacts sleep, morale, decision making | Daily mood/anxiety self-check (short validated-style scale [inference]); journal prompt; morale trend | R-BEH |
| Isolation & confinement | Inadequate teamwork | Cooperation, coordination, communication, psychosocial adaptation; conflicts in small space; comm delays worsen | Weekly team-cohesion pulse; conflict flag; private vs crew-shared view [inference] | R-TEAM |
| Isolation & confinement | Inadequate sleep & irregular schedules | Sleep loss, circadian desynchronization, work overload -> performance decrements | Sleep duration/quality (wrist actigraphy + self report), light exposure, workload rating, caffeine log | R-SLEEP, H-ISO, SM |
| Distance from Earth | Inadequate systems operations support | Earth-independent operation; crews now rely on real-time ground help; need more training/user-friendly systems | In-app step-by-step procedures, offline guidance, device-usage checklists; "confidence" rating | R-SYS |
| Distance from Earth | (autonomy / medical) | Mars: ~3 yr trip, comm delay up to 20 min one-way, equipment failure/medical emergency, rationing | Offline-first app; store-and-forward messages to flight surgeon; local triage | H-DIST |
| Space radiation | Radiation-induced cancers | Cancer; also degenerative disorders (heart, vessels, eyes); CNS: cognitive/performance impairment; personalized risk by dose + genetics | Cumulative dose display from dosimeters (neutron share via CANS); event alerts; cognitive check trend | R-CANCER, H-RAD, CSA-RAD |
| Gravity fields | Sensorimotor/vestibular; bone; cardiovascular; SANS | Disorientation, space motion sickness, lightheadedness/fainting at transitions; bone loss avg 1-1.5% mineral density/month; fluid shift to head -> vision issues; kidney stone risk with dehydration | Dizziness/nausea checklist; orthostatic symptom check; vision check; hydration; exercise adherence | H-GRAV, S2 |
| Hostile/closed env. | Host-microorganism; altered immune; hypoxia; (noise, temp, light) | Microbes more transferable; stress hormones up, immune change; mild hypoxia from partial cabin depressurization causes confusion if untreated | Cabin environment feed (temp, pressure, lighting, noise); symptom log (rash, infection); confusion/SpO2 flag [SpO2 sensor is inference] | H-HOST, R-HOSTMIC, R-HYPOXIA |

## 3. Behavioral health
- Mechanism: prolonged isolation/confinement raises behavioral/psychiatric risk; sleep, morale, decision making affected (R-BEH).
- Countermeasures NASA names: regular journaling, growing fresh vegetables, windows reduce monotony/confinement, privacy as top priority (R-BEH). Journaling is a tool behavioral scientists use to assess mental/emotional state (H-ISO).
- NASA uses "seven key points" for coping (H-ISO links to an article; content not in our files - fetch if needed).
- Gardening study measures mood via surveys: engaging/demanding/meaningful, effect on time perception, task performance, crew relationships, connection to Earth (GARDEN). These question themes are directly reusable as mood-check prompts [inference].
- Food: "menu fatigue" can have serious consequences (H-DIST); link to nutrition risk.
- App implications [inference]: low-friction daily check-in (<1 min), free-text journal, trend charts, gentle escalation to crew medical officer then flight surgeon; privacy controls so astronauts report honestly.

## 4. Sleep and circadian
- Stressors: work overload, irregular light-dark cycles, sleep disruption (R-SLEEP). ISS crew see 16 sunrises/sunsets per day (R-SLEEP).
- Mitigations: LEDs simulating Earth light-dark cycle; research on light and caffeine effects on body clock; scheduled relaxation/self-care to prevent burnout (R-SLEEP). Light therapy for circadian alignment, phase shifting, alertness under study (H-ISO).
- Existing measurement precedent: Standard Measures collects wrist-sensor activity and light exposure plus sleep reports (SM); ARCHeR uses actigraphy and behavioral surveys for Artemis, actigraphy during the mission (ARCHeR).
- Indicators: sleep duration, sleep regularity, light exposure, caffeine timing, workload, alertness self-rating [inference on exact set; precedent sources above]. Color-code vs the individual's own baseline rather than population cutoffs [inference].
- Note on environments: lunar/Mars day length differs from the ISS cycle; schedule logic must be environment-configurable [inference].

## 5. Teamwork
- Mars-class challenges: comm delays, increased isolation, resource constraints (no resupply), much smaller living space than ISS (R-TEAM).
- Mitigation: pre-mission team-building exercises; in-mission medical support (harder with delay) (R-TEAM). Analogs (HERA, CHAPEA) used to study teams (R-TEAM, H-ISO).
- App implications [inference]: anonymized team-level cohesion trend; prompts for conflict de-escalation; shared-state across crew without exposing individual medical data.

## 6. Radiation and dosimetry
- Hazard: GCRs (supernova remnants) and solar particle events/CMEs; cannot be seen or felt (H-RAD). Beyond the magnetosphere (Moon/Mars) exposure is higher than ISS, which is inside it (R-CANCER).
- Health effects: cancer risk, CNS damage, altered cognition, reduced motor function, behavioral changes (H-RAD); also heart, vessels, eyes (R-CANCER).
- CANS (CSA-RAD): Canadian Active Neutron Spectrometer; compact, autonomous, continuous neutron exposure measurement. CSA awarded $5.5 million to Bubble Technology Industries for continued development (dated 2026-02-26). Neutrons are about 30% of total ISS radiation and especially harmful. Predecessors: bubble detectors; other Canadian experiments MOSFET, EVARM, Radi-N, Radi-N2.
- NASA says it follows procedures to continuously monitor space radiation and astronaut exposure (H-RAD, link only; details not in our files).
- Indicators for the app: cumulative personal dose (from crew dosimeter feed), neutron component, SPE alert/shelter status, per-environment exposure (spacecraft vs surface habitat vs rover) [inference]. Radiation is not user-measurable, so the app is a display/alert layer for instrument data, not a self-assessment (consistent with "can't see or feel" in H-RAD).
- Caveat: no dose limits appear in our source files; do not hard-code any. Use "per agency limit" placeholders [inference].
- Also: radiation exposure may affect CNS and cognition (R-CANCER), so a cognition/psychomotor check trend is a plausible indirect indicator [inference].

## 7. Comm delay and autonomy
- Mars one-way delay up to 20 minutes (H-DIST). HERA simulates delays of up to five minutes each way (H-DIST).
- Today ISS crews can talk with family and medical professionals; delays on Mars trips create new challenges (R-BEH). Care in teamwork also harder (R-TEAM).
- Systems: crews need more training to fix software/equipment without mission control; NASA astronauts train on average 300 hours in simulators pre-launch (R-SYS). Ultrasound is among the systems crews are trained on, with real-time ground assistance today (R-SYS).
- Telemedicine precedent: Tempus Pro tests a commercial device that collects vitals and medical imaging and supports near-real-time diagnosis; a crew medical officer diagnoses a simulated scenario from device data (TEMPUS). Polaris Dawn telemedicine test referenced (R-SYS, TEMPUS).
- Design implications [inference]: offline-first; local decision support with explicit escalation tiers (self-manage / crew medical officer / flight surgeon); asynchronous store-and-forward report packet; delay-aware UI that shows "message sent, expected earliest reply" using configured delay; guided imaging (ultrasound) instructions.
- CSA lists increased communication delay and less reliance on Earth for emergency medical assistance as consequences of Moon/Mars missions (CSA-SCI).

## 8. Cross-links (compound effects)
- Sleep loss + isolation + radiation (CNS) all point to performance/mood: combine into one "cognitive readiness" view [inference].
- Hostile environment (noise, light, temperature) feeds sleep and immune risk (H-HOST, R-SLEEP).
- Distance amplifies teamwork, behavioral and systems-support risks (R-TEAM, R-BEH, R-SYS).
- Gravity transitions (Moon/Mars landing) affect readiness for mission-critical tasks (H-GRAV) -> post-landing check protocol (A2SM includes simulated moonwalk tasks after return; CIPHER obstacle course in suit).

## 9. Measurement protocols to copy for self-assessment (precedents)
- Standard Measures: wrist activity/light, sleep reports, diet/nutrition fluids, saliva immune, cognition tests, sensorimotor, strength, fecal microbiome (SM); more than 30 ISS astronauts since 2018 (A2SM).
- Artemis II Standard Measures: blood/saliva/urine, MRI, balance, motion-sickness symptoms, vestibular, muscle performance, microbiome, spacesuit post-landing tasks (A2SM).
- ARCHeR: well-being, activity, sleep, interactions (ARCHeR).
- CIPHER: 14 studies (eye/vision, cognition, cardiovascular imaging, sensorimotor, MRI) (CIPHER).

## 10. Gaps / to verify
- Exact URLs for S1 and S2 are inferred from titles; confirm.
- Content of NASA's "seven key points" isolation article, radiation monitoring procedures page, and Human System Risk Board evidence not fetched.
- No clinical thresholds (BP, HR, glucose, sleep hours, dose limits) in these files; need NASA-STD-3001 or medical literature before color-coding numbers.
