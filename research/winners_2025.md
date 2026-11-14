# NASA Space Apps 2025: Global Winners, Finalists, Honorable Mentions, Judging, and Past Astronaut-Health Projects

Scope: input for our astronaut self-assessment health tool (challenge text: research/challenge_raw.txt). Items not backed by a source are marked [inference]. Raw data: research/raw/winners2025/ (nasa.gov and spaceappschallenge.org pages, GraphQL dumps `teams_raw.json`, `finalists.json`, `honorable.json`, `past/`).

## 1. The 2025 event in numbers
- 551 local events in 167 countries/territories, 114,000+ participants, 11,500+ project submissions; 10 Global Winners announced Dec 18, 2025. Source: https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/
- Funnel: Local/Universal event judges pick Global Nominees; Global judges (NASA and agency SMEs) pick Finalists and Honorable Mentions; an executive committee of agency leaders picks the 10 winners from the Finalists. Source: https://www.spaceappschallenge.org/2025/awards/
- Per the judging guide, Honorable Mentions are ranked highly by Global Judges "for their ingenuity and creativity" but do not advance to Executive Judging or awards. Source: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- Count (from the site's GraphQL API, nomination ids 79 and 80 for 2025): 45 Global Finalists (the 10 winners are among them) and 23 Honorable Mentions. Source: https://api.spaceappschallenge.org/graphql (read-only queries, results in raw/winners2025/finalists.json, honorable.json).

## 2. The 10 Global Winners (2025)
Official descriptions: NASA article above. Tech stack, links, data: each team's submission, retrieved through https://api.spaceappschallenge.org/graphql (raw/winners2025/teams_raw.json). Award definitions: https://www.spaceappschallenge.org/2025/awards/

| Award | Team (country) | Challenge | What they built | Tech / data (from submission) | Why it likely won [inference] |
|---|---|---|---|---|---|
| Best Use of Science | SpaceGenes+ (Germany; 1 member) | Build a Space Biology Knowledge Engine | Interactive dashboard showing non-additive ("synergistic") gene expression changes when radiation and microgravity act together; flags genes such as TP53, ATM, GADD45A, to inform astronaut-health protection | NASA GeneLab dataset OSD/GLDS-288 (mouse spleen RNA-seq); Python, NumPy, pandas; site on Framer. Project: https://spacegenes-plus.framer.website/ | Directly about astronaut health; real dataset; a specific scientific insight (stressors interact, not just add); scientifically legible to SME judges |
| Best Use of Data | Resonant Exoplanets (USA) | A World Away: Hunting for Exoplanets with AI | AI pipeline from Kepler/TESS/JWST data to transit detection and biosignature checks, with an "exact-math" solver ("Modulus") for atmospheric chemistry | Python, FastAPI, React, TypeScript, XGBoost; MAST archive. https://resonant-planet.vercel.app | End-to-end pipeline on real mission data, deployed live |
| Best Use of Technology | Twisters (Mexico) | Will It Rain On My Parade? | SkySense: personalized ultra-local weather-risk web app with a chat assistant ("TwisterBot") and safest-time-window suggestions | React, Firebase, Google APIs, Gemini API, NASA POWER API, Open-Meteo; Figma design. https://skysense.surf/ | Polished consumer UX, risk framing, conversational AI |
| Galactic Impact | Astro Sweepers (Universal Event) | Commercializing LEO | Orbital-debris compliance and risk platform; automates NASA Debris Assessment Software reports; computes a proprietary risk index (ASRI) per space object | NASA SPARK, Space-Track, ESA DISCOS data; web portal. https://astro-sweepers.vercel.app/ | A single composite risk score plus dashboards, operational/regulatory framing |
| Best Mission Concept | PureFlow (Brazil) | Your Home in Space: Habitat Layout Creator | 3D habitat design tool computing mass/power/life-support in real time, tested against live space weather (solar storms) | NASA DONKI API, 3D physics engine. https://larasdiniz.github.io/PureFlow-2025/src/public/html/home/home.html | "Survival simulator" with live NASA data and instant feedback |
| Most Inspirational | Photonics Odyssey (India) | Commercializing LEO | AakashNet: sovereign LEO broadband concept with a phased-array terminal; aims at 700M+ people without broadband | Slides/Canva demo; NASA Image and Video Library cited | Human-scale mission (connect a nation), storytelling |
| Best Use of Storytelling | HerCode Space (Universal Event) | Stellar Stories: Space Weather | "A Solar Tale", a scroll-driven children's story narrated by the Sun | HTML5, SCSS, React, react-scrollama. https://a-solar-tale.netlify.app/ | Emotional narrative with a clear audience (classrooms) |
| Global Connection | Gaia+LEO (USA) | Commercializing LEO | Mixed-integer optimization co-designing orbital and terrestrial data-center networks | Python, Three.js, Streamlit; NASA POWER data | Quantitative optimization model with a sustainability angle |
| Art & Technology | Zumorroda-X (Egypt) | NASA Farm Navigators | "Henry's Farm Adventure": mini-game teaching climate impacts on farming from NASA data | Web game. https://henrysfarmadventures.vercel.app/ | Gamified learning that uses real data stories |
| Local Impact | QUEÑARIS (Peru) | BloomWatch | Smart reforestation of queñua forests in Arequipa (satellite indices, drones, AI, native microorganisms) | NASA Earthdata vegetation indices (NDVI, EVI etc.), React/TypeScript/Node/Python. https://quenaris.vercel.app | Concrete local problem (water scarcity), measurable targets stated |

Every winner except Photonics Odyssey and Zumorroda-X has a live deployed demo URL; most use a React/Python/web stack with NASA open APIs. [inference from the project links above]

### 2023 and 2024 winners (for pattern comparison)
The site's winners award lists also return prior-year winners (event ids 1 and 2). Examples relevant to our theme: none are astronaut health tools. 2024 Best Use of Technology: 42 QuakeHeroes; 2023 Best Use of Technology: Spacebee; 2023 Best Use of Science: LunarTech Ensemble (both Moonquake challenge). Source: GraphQL award pages https://www.spaceappschallenge.org/2025/awards/global-winners/ (raw/winners2025/teams_raw.json).

## 3. Finalists and Honorable Mentions relevant to human health or habitats
(All 45 finalists and 23 honorable mentions are listed in raw/winners2025/finalists.json and honorable.json.)
- Space-biology challenge finalists: SpaceGenes+ (winner), Memora-Lab (Peru; AI/knowledge-graph explorer of NASA space-biology research, https://www.memoralab.us/), naiπ (Brazil; embedding-based links between articles and OSD datasets, https://nasa-biologic.vercel.app/), So-Cal 2025 (Universal; personas for scientists, investors and mission architects; FastAPI, Pinecone, GPT-4o, React/TypeScript/Tailwind, 608 papers, https://innovatestemacademy.com/).
- Space-biology honorable mentions: AstroBotanica (USA), !DS (South Korea), NyanGer (Italy). No project descriptions were returned for these.
- Habitat challenge: PureFlow (winner), BuBu (Taiwan finalist; AI interior-design assistant), Home Alone (Argentina, honorable mention).
- Mars waste: HammerSpaceCraft (Ethiopia finalist) and FyCUS (Spain finalist); Mars Bars (Egypt, honorable mention).
- Observation: no 2025 winner or finalist is a personal astronaut vital-sign tracker. The only astronaut-health winner (SpaceGenes+) is a researcher-facing molecular dashboard. [inference from the lists] This leaves room for a crew-facing self-assessment tool.

## 4. Judging criteria
Source: https://www.spaceappschallenge.org/resources/judging-awards-guide/ (note: the live guide text is the 2026 edition, with 2026 dates; the criteria are the same ones named in the task and are scored at every judging level).
- Every project is scored 1 to 5 on each criterion at every level (Local/Universal, Global, Executive).
- Impact: addresses a minor or major problem; breadth of audience and effect; a 5 "could change the world".
- Creativity: originality or a meaningful improvement on existing ideas.
- Validity: scientifically grounded, technically/functionally feasible, and usable/user-friendly; a 5 is fully developed and ready for real-world use.
- Relevance: fully addresses the submitted challenge and uses NASA data as a core component, not a superficial add-on.
- Presentation: clear communication of challenge, solution and significance; judges evaluate the demo and the full project. The guide tells teams to give presentation equal attention and to recruit storytelling and design skills.
- Submission rules (2026 guide): respond to an official challenge; teams of up to 6; a short demo as a slide deck (7-slide limit) or a video (30-second limit as printed in the guide); English required (subtitles if the video is in another language). Verify against the final 2026 submission guide before relying on the limits.
- Implication for us [inference]: the Validity and Relevance rubrics reward visible, real NASA data (e.g. NASA HRP standard measures) and usability; Presentation is a full 1/5 of the score, so the demo story and design matter.

## 5. Past Space Apps projects on astronaut health
Note: a "2015 astronaut smartwatch" often cited online appears to be a separate NASA crowdsourcing contest (winner Ignacio Calvo and Jocelyn Richard, $1,500) rather than a Space Apps result; see https://www.wareable.com/smartwatches/astronaut-smartwatch-app-nasa-iss-2015 (page blocked to our fetch; only the search snippet was seen). Treat as unverified.

| Year | Challenge | Project | What it did | Result (as shown) | Source |
|---|---|---|---|---|---|
| 2015 | Space Wearables: Designing for Today's Launch and Research Stars | OrbitWATCH | Smartwatch app showing heart rate, radiation level, space time, with astronaut and tourist versions | Entry; no award shown | https://2015.spaceappschallenge.org/project/orbitwatch/ |
| 2016 | Rock-IT Space Fashion and Design (Design for Health) | Canaria (University of Surrey) | 3D-printed earpiece monitoring heart rate, blood oxygen, ambient CO2 with an audible alarm threshold | Described as winning the global challenge; award category reported inconsistently | https://www.iot-now.com/2016/06/06/48175-university-surrey-students-project-canaria-wins-global-nasa-spaceapps-challenge-2016/ |
| 2016 | Same | Hearts in Orbit | Body-monitoring system (ECG, PPG, EDA, respiration, even EEG) with a comfortable chest belt | People's Choice semi-finalist | https://2016.spaceappschallenge.org/challenges/space-station/rock-it-space-fashion-and-design/projects/hearts-in-orbit |
| 2016 | Same | Drift Off (Dublin) | IoT sleeping bag plus smart headband for astronaut sleep | National (Dublin) winner | https://www.siliconrepublic.com/machines/3-winners-of-nasa-space-apps-challenge-hackathon-revealed |
| 2018 | Bring Your Own Solution / Make Sense Out of Mars | AstroMentis (AI over astronaut diaries to flag subclinical mental-health issues), Microdoze (vitals app that alerts when vitals depart from baseline), Random Guys (emotion sensors with crew alerts), Transmitter (VR therapy) | Concept apps | Team pages only; no awards shown | https://2018.spaceappschallenge.org/challenges/can-you-build/bring-your-own-solution/teams/astromentis |
| 2020 | Sleep Shift Scheduling Tool | Morpheus Sleeptech (Global Nominee) wristband plus AI sleep suggestions; Artemis Awake, SleepUs, Shuttle Sleep (app, wearable, sleep pod), Lights Out | Schedulers combining sleep, exercise, nutrition; wearables; AI | Morpheus Sleeptech marked Global Nominee; others unknown | https://2020.spaceappschallenge.org/challenges/sustain/sleep-shift-scheduling-tool |
| 2022 | Space Biology Superhero | Several teams (e.g. Tardinauts, Astro State, Go4Launch) on quick health support and vitamin degradation | Concept submissions | Not confirmed as Global Winners | https://2022.spaceappschallenge.org/challenges/2022-challenges/space-biology-superhero/teams/tardinauts |
| 2025 | Build a Space Biology Knowledge Engine | SpaceGenes+, Memora-Lab, naiπ, So-Cal 2025 | See sections 2 and 3 | Best Use of Science plus 3 finalists | see above |

### Patterns across years
1. Hardware concepts dominated 2015-2020 (wearables, patches, earpieces); software dashboards and AI knowledge tools dominate 2025. [inference from table]
2. Almost all astronaut-health projects are concepts; few show real NASA biomedical data. The 2025 winner stands out for using an actual GeneLab dataset.
3. Recurring feature set: heart rate, oxygen, CO2/radiation alerts, sleep scheduling, baseline-deviation alerts (Microdoze), mood/mental-health monitoring (AstroMentis, Random Guys). All of these match the target indicators in our challenge.
4. Winning projects pair a clear story with a live demo and a risk score or alert; the 2025 winners list shows this repeatedly (Astro Sweepers risk index, SkySense risk windows, PureFlow live alerts).
5. Gap we can exploit [inference]: no found prior project combines vitals plus mood plus imaging plus escalation guidance (when to contact a flight surgeon) in one self-assessment UI with color-coded status, routine prompts and gamification.

## 6. Limits and unverified items
- Finalist/HM project descriptions for several teams were empty in the API; I did not guess.
- 2016 Canaria's exact award name is inconsistent between sources.
- 2022 and 2018 award outcomes for astronaut-health teams were not established.
- The 2015 smartwatch contest attribution is unverified (blocked page).
- Judging guide dates and limits shown on the live site are for the 2026 event.
