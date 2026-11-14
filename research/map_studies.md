# Map of NASA HRP study pages (non-risk, non-hazard) and what the app can borrow

Scope: every non-risk/non-hazard page in research/raw/sub/ (21 pages). Source text was read from the local .txt copies; each section cites the live URL. Anything not stated on the page is marked "not stated". Items tagged [inference] are our own design suggestions, not NASA claims. No numbers are invented; all numbers are quoted from the pages.

Caveat that matters for the pitch: almost none of these pages give measurement frequencies or device model names. They describe study design at a high level ("before, during, and after"). Frequencies below are only those the pages actually give.

---

## A. Core monitoring batteries (most relevant to the app)

### A1. Spaceflight Standard Measures
URL: https://www.nasa.gov/reference/standard-measures/
- Measured: activity and light exposure (wrist sensor), sleep reports, fluid samples for diet/nutrition, saliva for immune function, cognition tests, sensorimotor tests (balance, inner ear), total-body strength test, fecal samples for microorganism composition.
- Devices: wrist sensor named only generically. Blood collection is done on the ISS (photo caption).
- Frequency: "various time points", before/during/after mission. No cadence stated.
- Findings: none on the page (data bank). The Artemis II page says the experiment began in 2018 and has data from more than 30 astronauts in low Earth orbit (https://www.nasa.gov/reference/artemis-ii-standard-measures/).
- Borrow: the multi-domain "standard battery" as our baseline checklist: activity/light, sleep, cognition, balance, strength, immune/nutrition. Pre-mission baseline then in-flight deviation from own baseline [inference]. Each domain becomes a tile on the dashboard [inference].

### A2. Artemis II Standard Measures
URL: https://www.nasa.gov/reference/artemis-ii-standard-measures/
- Measured: blood, saliva, urine (nutritional status, cardiovascular health, immune function); MRIs (eye and brain health); balance, motion-sickness symptoms, vestibular health, muscle performance; microorganism composition. Unique to Artemis: capsule egress and simulated moonwalk in a pressurized suit right after return.
- Devices: MRI named; others generic. Frequency: before, during, after Artemis II. Not stated beyond that.
- Findings: none yet.
- Borrow: motion-sickness symptom survey as a daily 1-tap check; "fitness for duty" task checklist for environment transitions (landing, EVA) [inference]. Deep-space variant of the same battery supports "environment-aware" prompts (spacecraft vs surface).

### A3. ARCHeR (Artemis Research for Crew Health & Readiness)
URL: https://www.nasa.gov/reference/archer/
- Measured: well-being, activity, sleep patterns, and interactions (teamwork).
- Devices: actigraphy plus behavioral performance surveys.
- Frequency: surveys before and after mission; actigraphy also during mission. No cadence stated.
- Top risks addressed: inadequate teamwork, inadequate sleep/irregular schedules, behavioral conditions/psychiatric disorders.
- Borrow: passive actigraphy (sleep/activity) as zero-effort input, plus a short well-being and crew-interaction survey. Mood + sleep + team-cohesion on one chart [inference].

### A4. CIPHER (Complement of Integrated Protocols for Human Exploration Research) - 14 studies
URL: https://www.nasa.gov/reference/cipher/
General: eye and vision exams, cognitive and spatial reasoning tests, cardiovascular imaging, exercise and sensorimotor tests, MRIs; collected before, during, and after missions; missions up to a year for several sub-studies. Sub-studies as listed on the page:
| Sub-study | What is measured | Methods |
|---|---|---|
| Bone Health | blood/urine calcium, joint-health biomarkers | blood + urine samples |
| Bone Support (TBone2) | bone microarchitecture | high-res 3D images of leg and arm bones, pre/post |
| Coronary Responses | atherosclerosis progression, atrial fibrillation risk | MRI, CT, ultrasound (with/without contrast) |
| Data Integration | integrates all CIPHER data across durations and systems | analysis |
| Egress Fitness | post-landing task capability | capsule egress + suited simulated spacewalk |
| Heart Health (Vascular Calcium) | calcium from bone entering arteries, arterial stiffness | blood, urine, ultrasound, high-res bone/artery scans |
| ISAFE | eye structure/function, venous flow, brain structure | vision tests |
| Musculoskeletal Adaptations | bone/muscle strength time course (constant vs accelerating after six months) | 3D CT, muscle assessments, questionnaires |
| Routine Ultrasound Assessment | neck, legs, spine, organs/vessels likely affected | ultrasound incl. radiofrequency and 3D imaging, astronauts perform scans themselves |
| Spaceflight Standard Measures | core set (see A1) | samples, functional tests |
| Space Physiology | muscle strength, cardiorespiratory performance; inflight exercise, diet, sleep | tests pre/in/post |
| Spatial Cognition | spatial cognition, sleep, immunity, stress, operational performance | MRI, blood, brain-function tests, in-flight robotic training system |
| Telomere Health | telomere length, telomerase activity, DNA damage response | blood before/during/after |
| Vestibular Health | orientation/balance organs | head, eye, whole-body movement tests |
- Findings: none on the page.
- Borrow: Routine Ultrasound is the direct precedent for the challenge's "ultrasound self-assessment": the astronaut performs the scan, targets neck veins, legs, spine [from page]; guided probe placement UI is [inference]. Space Physiology precedent for logging exercise + diet + sleep together. Spatial Cognition precedent for a short cognitive game/test inside the app (gamification) [inference].

---

## B. Telemedicine and autonomy

### B1. Tempus Pro
URL: https://www.nasa.gov/reference/tempus-pro/
- Measured: vital health data collection and integration, medical imaging, near-real-time telemedicine diagnosis.
- Devices: Tempus Pro commercial telemedicine device (photo credit SEM/ESA). Specific sensors not stated.
- Design: device data compared to standard periodic health exams after the mission; the crew medical officer diagnoses a simulated medical scenario using device data, a crew member acting as patient, and supplemental information.
- Rationale quoted: communication delays grow with distance, so crews may benefit from lightweight, compact, energy-efficient, versatile medical devices.
- Borrow: single integrated "vitals + imaging + remote consult" flow; a crew medical officer role (CMO) as first escalation tier before ground [inference on tiering]; store-and-forward packet when comms delayed [inference]. Related link on the Spacecraft Occupant Protection page points to "NASA to Test Telemedicine, Gather Essential Health Data with Polaris Dawn Crew" (title only; page not read).
- Frequency: not stated.

---

## C. Eye/brain/fluid (SANS) countermeasure and monitoring studies
All relate to Spaceflight-Associated Neuro-ocular Syndrome (SANS), thought to arise as fluids shift toward the head.

| Study | URL | Measured | Devices/Method | Frequency | Borrow |
|---|---|---|---|---|---|
| B-Complex | https://www.nasa.gov/reference/b-complex/ | whether daily B vitamin prevents/mitigates swelling at back of eye; genetics | blood draws, genetic analysis, eye exams; OCT camera (caption) | supplement daily: six months before flight, during mission, 30 days after | daily supplement adherence checkbox; streak mechanic [inference] |
| Thigh Cuff | https://www.nasa.gov/reference/thigh-cuff/ | vision and blood-flow changes with cuffs on | thigh cuffs; ultrasound of leg and neck vein flow | worn six hours in each of two sessions | timed countermeasure session with countdown and ultrasound step [inference on UI] |
| Venous Haemostasis (with ESA) | https://www.nasa.gov/reference/venous-haemostasis/ | venous flow, clot risk, vein structure, blood composition | pre/post MRI; jugular vein ultrasound, blood draws, BP checks before and during flight | not stated | BP + jugular ultrasound as a combined routine; flag clot-risk symptoms [inference] |
| Spinal Fluid Biomarkers | https://www.nasa.gov/reference/spinal-fluid-biomarkers/ | spinal fluid biomarkers of brain/eye change | fluid taken shortly after landing and months later; compared with head, eye, BP measurements | post-flight only | eye ultrasound photo shows self-scanning on ISS; low app relevance (lab-only) |
| Brain Fluid Pressure | https://www.nasa.gov/reference/brain-fluid-pressure/ | intracranial pressure vs SANS; pressures in brain, eyes, neck veins | measured shortly after return vs preflight baseline; spinal fluid, blood, urine biomarkers; eye pressure measurement (caption) | post-flight | eye pressure self-check is a plausible in-app field [inference]; ICP itself is not self-assessable |

Findings: none on any of these pages. Pattern for the app: preflight baseline vs in-flight value deviation; vision-symptom prompt ("blurred near vision") tied to escalation [inference].

---

## D. Exercise, musculoskeletal, performance

- Zero T2 (https://www.nasa.gov/reference/zero-t2/): tests whether exercise without a treadmill preserves strength, fitness, bone health, balance during long-duration flight. Rationale: Moon/Mars craft are smaller, treadmills use space, power, resources. Devices/frequency not stated. Borrow: exercise log with device type and a strength/balance self-test; "available equipment" setting per environment (station vs small vehicle vs surface base) [inference].
- Simulating Manual Piloting for Moon Landings (https://www.nasa.gov/reference/simulating-manual-piloting-for-moon-landings/): laptop lunar-landing simulation plus cognitive and balance tests before, during, right after missions. Borrow: short laptop/tablet performance test as a "readiness to operate" check and game element; also shows dizziness impairs driving on Earth too (page statement).
- Spacecraft Occupant Protection (https://www.nasa.gov/reference/spacecraft-occupant-protection/): survey of crew discomfort during re-entry combined with spacecraft sensor data; landing is the most dynamic flight event. Borrow: post-event discomfort/injury check-in after landing, launch, rover crash/jolt (dynamic events) [inference].
- Astronauts' Spines Under Scrutiny (https://www.nasa.gov/missions/station/astronauts-spines-under-scrutiny/, May 17, 2021): qCT and MRI of spines immediately before and after flight; nine astronauts with >6 months on ISS scanned. Finding quoted: weight-bearing bones become roughly 1% less dense per month if no countermeasures. Resistive exercise is the proposed counter. Borrow: that stated bone-loss rate as the rationale for an exercise-adherence tracker; no imaging self-assessment possible (CT/MRI).

---

## E. Immune, omics and molecular

- Immune Biomarkers (https://www.nasa.gov/reference/immune-biomarkers/): begins with Artemis II. Blood before/after mission; saliva also during mission; liquid saliva on Earth, dry saliva (blotted on special paper in pocket-sized booklets) in space and Earth. Targets stress hormones, viruses (e.g. shingles virus reactivation), cells. Borrow: dry-saliva booklet = low-burden self-sample; app could schedule and track sample collection with barcode/checklist [inference].
- Scientists Probe How Long-Term Spaceflight Alters Immunity (https://www.nasa.gov/missions/station/scientists-probe-how-long-term-spaceflight-alters-immunity/): blood, saliva, urine from 10 astronauts since 2016, average six months on ISS, before/during/after, versus 10 age- and sex-matched ground controls over six months. Blood returns within 37 hours via cargo ship undocking. Cytokines in blood, stress hormones in urine, reactivated viruses in saliva and urine. Finding: astronauts generally show minor or no symptoms of latent-virus reactivation, but could pass virus to crew; unknown for deep space. Borrow: symptom log (rash, cold sores, fever) with crew-contagion advisory and escalation; ground-control comparison concept = own-baseline comparison [inference].
- Omics Archive (https://www.nasa.gov/reference/omics-archive/): routine blood, urine, saliva, feces, cells before/during/after flight for DNA, RNA, protein, microbiome. Data collection complete. Borrow: personalized baselines; app should store a longitudinal per-person record [inference]; nothing self-assessable.

---

## F. Nutrition, food, plants, microbes, mood

- Enhanced Diet / Food Physiology (https://www.nasa.gov/missions/station/enhanced-diet-may-help-astronauts-adapt-to-spaceflight/, May 4, 2021): enhanced diet rich in flavonoids, lycopene, omega-3 vs standard diet. Pre-mission consultation; daily food-intake logging; weekly discussion with research team that gives feedback on dietary status; blood, urine, saliva, fecal samples before/during/after. Eight participants needed. Began with Expedition 61 (launched Sept. 25, 2019). Findings: not yet reported. Borrow: daily food log + weekly nutrition feedback loop; mass/volume trade-offs noted (food is a big mass driver) so logging should be minimal-effort.
- How Does Spaceflight Change Food Appeal? (https://www.nasa.gov/humans-in-space/how-does-spaceflight-change-food-appeal/, Apr 28, 2021): weekly survey rating acceptability of foods and drinks (appearance, flavor, texture, aroma); at least 13 astronauts targeted. Early finding quoted: personal preference matters but variety is key. Rationale: menu fatigue can cause low intake, body mass loss, deficiencies. Borrow: weekly appetite/menu-fatigue slider; trigger alert when intake drops (weight loss risk) [inference on trigger].
- Can Space Gardening Help Astronauts Cope With Isolation? (https://www.nasa.gov/humans-in-space/can-space-gardening-help-astronauts-cope-with-isolation/, May 13, 2021): survey 2-3 times over the month-long plant growth cycle on mood effects (engaging, demanding, meaningful; time passage; crew relationships; connection to Earth), plus sensory assessment at harvest. Seven of target 24 astronauts done. Findings: some loved it and spent many leisure hours, others preferred other activities; none found it meaningless; all valued it. Borrow: mood-linked "activity" prompts and optional restorative activities (individual variability, so personalize) ; cycle-based check-ins (gamification: grow-a-plant streak) [inference].
- Researchers Put Space Garden Microbes Under the Microscope (https://www.nasa.gov/missions/station/researchers-put-space-garden-microbes-under-the-microscope/): crew swab Veggie hardware and drinking water about every four months, incubate five days, record colony density, return samples. Samples from Expeditions 58, 59, 61, 62 (since 2019); Penicillium and Staphylococcus epidermidis found, "not always enough to cause concern". Borrow: environment-hygiene log module (surfaces, water) with trend not single-reading logic; that quote supports trend-based alerts.

---

## G. What the app should borrow (consolidated)
1. Standard-Measures-style battery as the daily/weekly checklist: activity/light, sleep, cognition, balance/vestibular, strength, mood, nutrition (A1, A3).
2. Passive actigraphy for sleep/activity to cut burden (A1, A3).
3. Own-baseline comparison: pre-flight vs in-flight vs post-flight (every flight study; "ground control" concept in immunity article).
4. Telemedicine tiering with comms delay in mind: self-assess, crew medical officer, flight surgeon (Tempus Pro) [tiering is inference].
5. Self-performed ultrasound with guidance (CIPHER Routine Ultrasound; Venous Haemostasis jugular ultrasound; Thigh Cuff leg/neck ultrasound).
6. Timed countermeasure sessions (Thigh Cuff six hours x2; B-Complex daily supplement) with timers/streaks.
7. Light-weight self-sampling (dry saliva booklets) scheduled by the app.
8. Short cognitive/performance mini-tests as game elements (lunar-landing sim, Spatial Cognition tests).
9. Environment-specific modules: post-landing egress/suited tasks (Egress Fitness), dynamic-load discomfort survey, equipment-limited exercise (Zero T2).
10. Mood/restoration prompts tied to isolation and individual variability (gardening survey).
11. Gaps: pages give no numeric normal ranges or thresholds for BP, HR, glucose, temperature; the color-coding thresholds must come from other sources (risk pages / clinical references), not these study pages.
