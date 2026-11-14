# Physiology risk map (NASA HRP "Human System Risks") for an astronaut self-assessment tool

Scope: 13 physiology-related risk pages in `raw/sub/reference_risk-*.txt`. Each is a short NASA summary (about 2 KB), so quantitative facts are few. Do not invent more.

Conventions:
- Every fact cites the NASA page it came from. Page URL = `https://www.nasa.gov/reference/<slug>/`, with the slug given in each section header.
- `[inference]` marks a product or design suggestion, or a general-physiology link that the page does not state. Treat these as hypotheses to verify with flight-surgeon or literature sources.
- "Measured in flight" lists only what the page names. Everything else is `[inference]`.
- Hazard names come from the HRP five hazards: radiation, isolation/confinement, distance from Earth, gravity fields, hostile/closed environments (https://www.nasa.gov/hrp/hazards/, from `raw/hazards.txt`).
- Not covered here: sleep, behavioral health, teamwork and systems-operations risks (other files).

---

## 1. Altered immune system responses
Slug: `risk-of-altered-immune-system-responses`
- **Hazards:** radiation, microgravity, poor sleep and "other spaceflight stressors". The first three are stated.
- **Mechanism:** the immune system shifts. Weaker immunity may mean more infections. Elevated immunity may mean allergies. Dormant viruses (cold sores, shingles) may reactivate.
- **Symptoms reported on ISS:** cold sores, rashes, atypical allergies, infections.
- **Measurable indicators:** NASA names no vital sign. The tracked samples are blood, saliva and urine. [inference] A self-assessment tool could log skin rash, cold-sore or shingles-like lesions, new allergy symptoms, infection signs and temperature.
- **How measured in flight:** crew biological samples (blood, saliva, urine). A recent focus is returning in-flight samples to Earth.
- **Countermeasures:** none established on the page. Research is ongoing.
- **Quantitative:** none.

## 2. Altered sensorimotor and vestibular function
Slug: `risk-of-altered-sensorimotor-and-vestibular-function`
- **Hazards:** gravity fields (altered gravity and transitions between gravity types).
- **Mechanism:** loss of orientation and motion sickness. Crew can have trouble with tasks, vehicle controls and spacewalks.
- **Symptoms:** motion sickness, spatial disorientation. Disorientation is also seen immediately after landing.
- **Indicators:** NASA gives none. [inference] Self-reported nausea or dizziness scale, and balance or reaction tasks.
- **How measured in flight:** the page mentions astronaut surveys on motion-sickness medications used. Landing-readiness tests are linked as a related article.
- **Countermeasures:** under research. They include medication combined with training or orientation aids, and specific head movements tested with the US Navy.
- **Quantitative:** "the majority of astronauts experience motion sickness." Earth motion-sickness history does not predict space motion sickness.

## 3. Cardiovascular adaptations
Slug: `risk-of-cardiovascular-adaptations`
- **Hazards:** low gravity and other spaceflight stressors.
- **Mechanism:** the heart and vessels change. The heart becomes more spherical.
- **Outcomes:** blood clots, arrhythmias, cardiovascular disease, low blood pressure with higher fainting chance at landing. Risk rises with mission length.
- **Indicators:** [inference] BP and HR (including orthostatic readings), rhythm, and any leg swelling or pain. The page names none of these.
- **How measured in flight:** ultrasound is shown in the page image caption as a tool to see heart structure and function.
- **Countermeasures:** regular exercise, healthy diet, lower-body compression garments, drinking lots of fluids before landing, and enhanced training for cardiovascular emergencies on Mars missions.
- **Quantitative:** none.

## 4. Decompression sickness (DCS)
Slug: `risk-of-decompression-sickness`
- **Hazards:** a pressure drop from the spacecraft to the lower-pressure spacesuit during EVA. This is a hostile/closed-environment issue.
- **Mechanism:** dissolved nitrogen forms bubbles in tissue and blood.
- **Symptoms:** severe pain that can make a diver double over. In severe cases, breathing impact, blocked vessels and stroke-like symptoms.
- **Indicators:** the page lists symptoms only. [inference] Joint or limb pain score, neuro-symptom checklist and breathing symptoms after any pressure change.
- **Countermeasures:**
  - Ground training in high and low pressure.
  - Oxygen prebreathe before EVA to displace nitrogen.
  - Protocol: if symptoms occur, end the spacewalk safely but rapidly and return to the spacecraft.
  - Variable-pressure suits in development. They let the crew raise suit pressure quickly, at the cost of mobility, dexterity and fatigue.
  - Lower-pressure habitats are possible.
- **Escalation rule from NASA text:** DCS symptoms during EVA mean end the EVA and return inside. Further medical steps are not stated.
- **Quantitative:** none. Longest spacewalk was 8 h 56 min (see EVA, section 8).

## 5. Host-microorganism interactions
Slug: `risk-of-host-microorganism-interactions`
- **Hazards:** closed environment, spaceflight stressors.
- **Mechanism:** skin and gut microbe communities change. Some microbes are more virulent in flight. NASA says it is unknown whether the cause is microbiome change, microbe virulence change or immune shift, and that they may interact.
- **Symptoms:** infection and illness. No specific symptom list is given.
- **Indicators:** [inference] fever, skin lesions, GI symptoms.
- **How measured in flight:** crew biological samples and swabs of station surfaces.
- **Countermeasures:** limit exposure to large groups in the two weeks before launch. Disinfectants, anti-inflammatories and antibiotics are being assessed.
- **Quantitative:** the 2-week pre-launch window.

## 6. Hypoxia
Slug: `risk-of-hypoxia`
- **Hazards:** a planned partial cabin depressurization on deep-space craft, adopted to cut nitrogen passively and reduce pure-oxygen prebreathe needs.
- **Mechanism:** tissue oxygen falls below normal.
- **Symptoms if untreated:** confusion, headaches, vision impairment, trouble sleeping.
- **Indicators:** NASA gives none. [inference] SpO2, headache, cognition and sleep self-ratings.
- **How measured in flight:** not stated. NASA is building new health-monitoring protocols for partial depressurization.
- **Countermeasures:** research on balancing oxygen concentration and pressure. Suits whose pressure the crew can toggle.
- **Quantitative:** NASA calls the risk relatively low and likens it to altitude sickness on arriving in a high mountain community. No ground-based study tests oxygen levels with all spaceflight stressors.

## 7. Inadequate food and nutrition
Slug: `risk-of-inadequate-food-and-nutrition`
- **Hazards:** distance from Earth and long mission duration (no regular resupply), food shelf life and mass limits.
- **Mechanism:** meals must be acceptable, safe, nutritious, long-lasting, easy to prepare and varied enough to avoid menu fatigue. Inadequate food leads to performance decrement and illness.
- **Symptoms and indicators:** not given. [inference] Intake log, appetite or food-appeal rating, weight trend.
- **Countermeasures:** sodium reduced, new foods added, enhanced diets researched, long-duration analog tests.
- **Quantitative:** more than 200 foods and beverages are available on ISS. ISS resupply carries only a small portion of fresh produce.

## 8. Injury and compromised performance from EVA
Slug: `risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva`
- **Hazards:** pressure and oxygen differences between habitat and suit, unfamiliar surfaces, gravity, suit weight and the physical and mental demands of long or frequent EVAs.
- **Mechanism:** DCS risk, injury, and performance loss in the suit.
- **Indicators:** [inference] fatigue and pain ratings, bone and muscle status before EVA.
- **Countermeasures:** prebreathe protocols. Suit design for durability, dexterity and biomedical monitoring. Exercise for bone and muscle strength to sustain suit weight where gravity is higher.
- **Quantitative:** the longest spacewalk was 8 h 56 min (James Voss and Susan Helms, 12 March 2001).

## 9. Reduced cardiorespiratory and musculoskeletal fitness
Slug: `risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness`
- **Hazards:** microgravity. Moving between gravity levels increases fall and trip risk.
- **Mechanism:** weaker bones, muscles and cardiopulmonary systems. Losses appear in upper and lower body strength and endurance, flexibility, aerobic fitness, agility and coordination.
- **Indicators:** strength, aerobic fitness and the other performance areas listed. [inference] workout logs and HR response to a standard exercise task.
- **How measured in flight:** periodic crew fitness self-evaluations.
- **Countermeasures:** ISS exercise is resistance plus aerobic, 1.5 h per day, 6 to 7 days a week. Deep-space craft will have less exercise space, so devices and protocols are being optimized.
- **Quantitative:**
  - Average ISS losses to strength and aerobic fitness are 10-12% of pre-mission levels.
  - Depending on the measure, 12-38% of ISS crew lose more than 20% of pre-mission fitness.
  - Strength loss affects more crew than aerobic decline.

## 10. Spaceflight Associated Neuro-ocular Syndrome (SANS)
Slug: `risk-of-spaceflight-associated-neuro-ocular-syndrome-sans`
- **Hazards:** chronic weightlessness (gravity fields).
- **Mechanism:** blood and cerebrospinal fluid shift toward the head.
- **Findings:** optic nerve swelling, retinal folds, flattening of the back of the eye, brain swelling. Severity ranges from mild to clinically significant. Long-term outcome is unknown. Risk is higher on longer missions.
- **Indicators:** [inference] a self-reported vision change check, such as near-vision blur, and headache.
- **How measured in flight:** fundoscope imaging of the retina (page image caption).
- **Countermeasures:** under investigation. They include nutritional supplements and mechanical devices that reverse the headward fluid shift. Ground analog is 6-degree head-down-tilt bed rest lasting weeks to months.
- **Quantitative:** about 70% of ISS astronauts have some swelling at the back of the eye.

## 11. Spaceflight-induced bone changes
Slug: `risk-of-spaceflight-induced-bone-changes`
- **Hazards:** microgravity unloads the spine and hips.
- **Mechanism:** bone density loss. This leads to fracture risk and premature osteoporosis.
- **Indicators:** bone density from scans. [inference] a back-pain log.
- **How measured:** routine bone scans before and after flight (the page does not state in-flight scans).
- **Countermeasures:** resistive exercise (essential). Bisphosphonate medications in NASA studies "could help mitigate some" loss.
- **Quantitative:**
  - Average loss is 1% to 1.5% of bone density per month on 4-6 month missions.
  - Spine straightens and elongates, with height gain up to 3%.

## 12. Injury from dynamic loads
Slug: `risk-of-injury-from-dynamic-loads`
- **Hazards:** landing and gravity transitions (microgravity, then Moon or Mars gravity, then Earth), disorientation and bone loss.
- **Mechanism:** landing forces act on bodies already weakened in bone and muscle.
- **Indicators:** not given. [inference] pre-landing readiness check combining bone, orthostatic and vestibular status.
- **Countermeasures:** human body models set vehicle standards (seat configuration, restraints). Better suit protection. On the Moon and Mars the crew must self-egress and function autonomously shortly after landing.
- **Quantitative:** none.

## 13. Radiation-induced cancers
Slug: `risk-of-radiation-induced-cancers`
- **Hazards:** space radiation, which is higher than on Earth. Missions to the Moon and Mars leave the protective magnetosphere. ISS missions stay inside it.
- **Mechanism:** cancer development. Radiation may also raise risk of degenerative disorders of the heart, vessels and eyes. It may affect the central nervous system, causing cognitive or performance impairment in flight.
- **Indicators:** radiation dose. NASA names none for symptoms.
- **How measured in flight:** radiation-measuring instruments aboard ISS.
- **Countermeasures:** health surveillance practices, medicines to counter radiation effects (under development), shielding for Artemis and Gateway, personalized cancer risk assessment from dose and genetics.
- **Quantitative:** none on the page.

---

## Cross-cutting notes for the app

1. Most page text is qualitative. Hard numbers available: ISS fitness loss 10-12% average, 12-38% of crew losing more than 20% (fitness page); bone loss 1-1.5% per month (bone page); SANS about 70% (SANS page); exercise 1.5 h per day, 6-7 days a week (fitness page); longest EVA 8 h 56 min (EVA page); 200+ foods (food page).
2. NASA's pages name no numeric thresholds for BP, HR, SpO2, glucose or temperature. Thresholds for color coding must come from other sources, not these pages. [inference]
3. Flight tools named on these pages: ultrasound (heart), fundoscope (eye), bone scans (pre and post flight), radiation instruments, blood, saliva, urine samples, surface swabs, fitness self-evaluations, motion-sickness medication surveys.
4. Escalation text that does exist: end the EVA if DCS symptoms appear (DCS page). Everything else is [inference].
5. Landing and surface-arrival readiness (orthostatic BP, vestibular, bone, fitness) links four risks: sections 2, 3, 9 and 12. [inference] A single pre-landing checklist would fit the app.
6. Several risks share hazards and interact (immune with radiation, sleep and stress; hypoxia with DCS through the cabin-pressure trade-off). NASA says hazards "feed off one another" (hazards page).

Sources (base): https://www.nasa.gov/reference/<slug>/ for each slug above; https://www.nasa.gov/hrp/hazards/ for hazard categories.
