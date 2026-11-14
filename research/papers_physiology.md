# Quantitative spaceflight physiology for self-monitorable indicators

Compiled 2026-11-14. Abstracts retrieved via Europe PMC REST API (PubMed records); NASA pages via local downloads in `research/raw/`. PMID links: `https://pubmed.ncbi.nlm.nih.gov/<PMID>/`. Items marked **[inference]** are not stated by a source. Items marked **[not retrieved]** were requested but no verifiable number was obtained; do not use a number for them without checking.

## 1. Cardiovascular

| Indicator | Finding | Source |
|---|---|---|
| Resting HR during sleep, ISS up to 6 mo (n=7) | Unchanged in flight; elevated postflight 59.6 +/- 8.9 vs 53.3 +/- 7.3 bpm preflight (P<0.01). HRV (time and frequency domain) reduced in flight, partly recovered postflight. | Hughson/ Xu et al. 2013, Am J Physiol Regul, PMID 23637139, doi:10.1152/ajpregu.00423.2012 |
| HR on standing, landing + 1 day (n=9, mean 165 d) | ~10 bpm higher supine and standing than preflight ("modest cardiovascular deconditioning"). Pulse-arrival-time-based BP estimate had SEE 9-11 mmHg SBP, 6-7 mmHg DBP (useful as a cuffless-BP accuracy benchmark). | PMID 31414954, doi:10.1152/japplphysiol.00317.2019 |
| 24 h ambulatory BP in flight (n=8, 85-192 d on ISS) | Brachial BP **reduced 8-10 mmHg**; systemic vascular resistance **-39%**; cardiac output and stroke volume **+35-41%** between 3 and 6 months; nocturnal dip maintained. | Norsk et al. 2015, J Physiol, PMID 25774397, doi:10.1113/jphysiol.2014.284869 |
| Arterial stiffness (n=8, 6 mo ISS) | Carotid distensibility coefficient and beta-stiffness index reflect **17-30% increase in stiffness** within 38 h of landing; an index of insulin resistance rose in flight (P<0.001; larger in men); renin/aldosterone rose more in women. | Hughson et al. 2016, Am J Physiol Heart, PMID 26747504, doi:10.1152/ajpheart.00802.2015 |
| Orthostatic intolerance (OI) | Postflight OI incidence ~20% after short-duration flights; after 129-190 d flights, **5 of 6** astronauts became presyncopal on tilt test (vs 5 of 20 on landing day after short Shuttle flights). Lower stroke volume/cardiac output in long-flight presyncopal subjects. | Buckey/Meck et al. 2001, Psychosom Med, PMID 11719623, doi:10.1097/00006842-200111000-00003 |
| OI countermeasure | Midodrine 10 mg (oral, ~1 h pre-test) prevented severe drops in SV, CO, SBP and severe HR rises in a previously affected astronaut; reduced postflight tachycardia (p=0.036) in 5 non-presyncopal men. | PMID 15198285; PMID 16676655 |
| NASA risk page | Low-G can cause blood clots, arrhythmias, low BP "which elevates the chances of fainting at landing"; heart becomes more spherical. Mitigations: exercise, lower-body compression garments, drinking lots of fluids before landing. | https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/ |
| Cardiac structure (n=13, median 164 d) | Significant reductions in LV end-diastolic volume, stroke volume and myocardial deformation (full numbers not retrieved from abstract). | PMID 42741837, doi:10.1161/circulationaha.125.078665 |

**App implications [inference]:** in flight, BP/HR baselines shift down/flat, so alert thresholds should be *personal-baseline relative*, not Earth population cut-offs; the high-risk window for HR rise and presyncope is the first days after gravity re-exposure (landing, and plausibly Moon/Mars arrival: see Mars-gravity tilt study PMID 42741837). Orthostatic-symptom check plus standing HR/BP prompts before and after gravity transitions.

## 2. Body temperature ("space fever")

- Stahn et al. 2017, Sci Rep, PMID 29170507, doi:10.1038/s41598-017-15560-w: during exercise core body temperature rises higher and faster in space than on Earth; at rest a **sustained CBT increase of about 1 degC developed gradually over ~2.5 months** in long-duration astronauts, associated with higher interleukin-1 receptor antagonist. Authors state minor CBT increases can impair physical and cognitive performance.
- Sample size and absolute temperatures were not in the abstract **[not retrieved]**.
- **App implication [inference]:** a +1 degC drift in resting core temperature is normal-for-flight; fever flags should compare to a rolling in-flight baseline and combine with symptoms, rather than use 37.5/38 degC alone.

## 3. Glucose / insulin / metabolism

- Hughson 2016 (PMID 26747504 above): in-flight insulin resistance index increased (P<0.001), greater change in men (P=0.034) in 6-month ISS crew (4 men, 4 women).
- Twins Study (Garrett-Bakelman et al., Science 2019, PMID 30975860, doi:10.1126/science.aau8650): year-long ISS mission documented **decreased body mass**, carotid artery distension and increased intima-media thickness, altered ocular structure, metabolic and transcriptional changes, some cognitive decline postflight; telomere length/gene expression mostly returned near baseline within 6 months of return. Exact body-mass percentage **[not retrieved]**.
- Fasting-glucose in-flight reference ranges: **[not retrieved]**.

## 4. Bone

- NASA: weight-bearing bones lose on average **1-1.5% of density per month** on 4-6 month missions; height can increase up to 3% from spinal elongation. Bisphosphonates and resistive exercise mitigate. https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/
- Meta-analysis (148 individuals; Stavnichuk et al. 2020, npj Microgravity, PMID 32411816, doi:10.1038/s41526-020-0103-2): post-flight BMD change vs preflight: skull +2.2%; thorax/upper limbs -0.7%; **lumbar spine/pelvis -6.2%; lower limbs -5.4%**; lower-limb rate **-0.8%/month** [95% CI -1.1,-0.5]. Resorption markers rise to ~113% above baseline (half-max 11 days); formation markers unchanged for first 30 days then +7%/month. (Note: -0.8%/mo is below NASA's 1-1.5%/mo headline; use a range 0.8-1.5%/mo.)
- ARED (resistive device) + alendronate 70 mg/week maintained lumbar BMD (+2.8%, p=0.1 vs preflight) in 51 ISS crew; ARED alone did not (2026 study, PMID 41528521, doi:10.1007/s11657-025-01624-2).
- Bone is not self-measurable; app should track *proxies* (exercise adherence, resistive load minutes, vitamin D/calcium diet logs) **[inference]**.

## 5. Muscle and body mass

- Trappe et al. 2009 (reported in Scientific American summary and PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC2988519/ ; https://www.scientificamerican.com/blog/news-blog/spaceflight-wreaks-havoc-on-astrona-2009-04-08/): 9 crew, ~6 months ISS with aerobic (5 h/wk) and resistive (3-6 d/wk) exercise: calf muscle volume **-13 +/- 2%** (soleus -15%, gastrocnemius -10%), peak power ~32% lower.
- Lumbar spine: crew have **4.3x higher herniated disc risk** vs general/military aviators, with ~5 cm height lengthening in long missions (PMID 27779600, doi:10.1097/BRS.0000000000001873).
- Body mass: decreased in Twins Study (above); numeric value **[not retrieved]**. A daily/weekly weight and caloric-intake prompt is the simplest tracked indicator **[inference]**.

## 6. Fluid shift, SANS and vision

- Headward fluid shift is caused by loss of the head-to-foot hydrostatic gradient and "may underlie" SANS; ground-analog countermeasures reduced internal jugular vein area by 48% (LBNP), 31% (thigh cuffs), 56% (ITD) vs supine (n=10; PMID 33856253, doi:10.1152/japplphysiol.00863.2020).
- Mader et al. 2011, Ophthalmology, PMID 21849212: 7 ISS astronauts after ~6 months: disc edema (5), globe flattening (5), choroidal folds (5), cotton wool spots (3), nerve fiber layer thickening; ~300 additional astronauts surveyed on in-flight vision change (percentages not in abstract **[not retrieved]**). SANS has "no direct treatment" (PMID 39483988).
- Self-check candidates **[inference]**: near/far visual acuity (Amsler or near card), headache/pulsatile tinnitus log, handheld ocular ultrasound (optic nerve sheath diameter) if available; Inspiration4 flew handheld ultrasound (PMID 38862026).

## 7. Short-flight benchmark (Inspiration4 / SOMA)

Jones et al./Overbey et al., Nature 2024, PMID 38862026, doi:10.1038/s41586-024-07648-x: 3-day civilian mission induced stress responses, neurovestibular changes (ocular misalignment) and altered neurocognitive function; almost all returned to baseline after landing; authors conclude short missions "do not pose a significant health risk". Used handheld ultrasound and smartwatch wearables (supports feasibility of wearable + ultrasound self-monitoring). OSDR data: PMID 38744887.

## 8. Radiation and NASA-STD-3001

- **NASA-STD-3001 Vol 1 Rev B [V1 4030]:** career effective dose from spaceflight radiation **< 600 mSv**, universal for all ages and sexes (based on 35-year-old female model, ~3% REID cancer mortality). Solar particle event limit **250 mSv per event**; nuclear-technology exposure **< 20 mSv per mission year**. Source: NASA OCHMO Technical Brief OCHMO-TB-020 Rev E (12/27/2022), https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf (local copy: `research/raw/papers/ochmo_rad.pdf`). GCR limit not formally adopted per same brief.
- Same brief: surface-mission radiation environment ~**0.5 mSv/day** (basis of the 0.05 mSv/day nuclear limit); aluminum/polyethylene shielding gives ~50% reduction for SPE but only ~7% average for GCR.
- Mars transit: MSL RAD measured GCR dose equivalent ~**1.8 mSv/day** during the 253-day cruise and **0.66 +/- 0.12 Sv** for the shortest round trip with current propulsion/shielding (Zeitlin et al. 2013, Science, PMID 23723233, doi:10.1126/science.1235989; the 1.8 mSv/day figure from press coverage, e.g. https://spaceflightnow.com/mars/msl/130530rad/). A 180+600+180-day Mars mission was quoted at ~1.1 Sv (NPR, https://www.npr.org/sections/health-shots/2013/05/30/187164731/Headed-To-Mars-Watch-Out-For-Cosmic-Rays, secondary).
- ISS: ~80-100 mSv per 6-month stay in press quotes of NASA's Hassler (NPR link above); that equates to ~0.45-0.55 mSv/day **[inference, own arithmetic]**. A primary-source ISS mSv/day was **[not retrieved]**.
- Cancer-risk uncertainty for Mars is 400-600% (Cucinotta et al. 2001, PMID 11604093). Radiation is not directly felt: app should display dosimeter readings (cumulative mSv vs 600 mSv career, SPE alert) rather than symptoms.
- Early symptoms in mission (OCHMO brief mentions nausea/fatigue from in-mission acute exposure, near line 74-78 of the brief); thresholds for acute symptoms not retrieved.

## 9. Sleep (local NASA page only)

See `research/raw/sub/reference_risk-from-inadequate-sleep-and-irregular-schedules.txt` (https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/); no numeric sleep-duration data pulled in this pass **[not retrieved]**.

## 10. Gaps for follow-up

Twins body-mass %, Stahn n and absolute temperatures, SANS prevalence, in-flight glucose norms, NTRS HRP Evidence Reports (not accessed), quadriceps/whole-body lean mass losses, ISS mSv/day primary source, sleep hours.
