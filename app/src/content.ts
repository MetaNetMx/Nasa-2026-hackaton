import type { RegionId } from './data'

const HRP = 'https://www.nasa.gov/reference/'

export type Region = {
  id: RegionId
  name: string
  does: string
  space: string
  why: string
  links: { label: string; url: string }[]
  act: { yellow: string; red: string }
}

export const REGIONS: Record<RegionId, Region> = {
  brain: {
    id: 'brain',
    name: 'Brain & readiness',
    does: 'Attention, decisions, mood and sleep drive every safety-critical task: piloting, spacewalks, medical care.',
    space: 'Isolation, sleep loss (16 sunrises a day on the ISS) and radiation can all lower alertness and mood.',
    why: 'Readiness is checked before critical tasks so a tired or overloaded crew member is caught before the task, not during it.',
    links: [
      { label: 'NASA HRP: Sleep and irregular schedules', url: HRP + 'risk-from-inadequate-sleep-and-irregular-schedules/' },
      { label: 'NASA HRP: Behavioral conditions', url: HRP + 'risk-of-behavioral-conditions-and-psychiatric-disorders/' },
    ],
    act: {
      yellow: 'Re-check after a rest break. Shift a demanding task if you can. Keep light and caffeine timing on schedule.',
      red: 'Do not start an EVA or piloting task. Tell the crew medical officer and re-test in 30 min.',
    },
  },
  blood: {
    id: 'blood',
    name: 'Blood & heart',
    does: 'Red blood cells carry oxygen; platelets stop bleeding. The heart and vessels move both around the body.',
    space: 'Weightlessness shifts fluid to the head and changes blood volume. Astronauts destroy about 54% more red blood cells in space than on Earth ("space anemia").',
    why: 'A blood count catches anemia and red-cell changes early, before they show up as fatigue or fainting at landing.',
    links: [
      { label: 'NASA HRP: Cardiovascular adaptations', url: HRP + 'risk-of-cardiovascular-adaptations/' },
      { label: 'Trudel et al. 2022, Nature Medicine (space anemia)', url: 'https://doi.org/10.1038/s41591-021-01637-7' },
    ],
    act: {
      yellow: 'Re-test at the next scheduled draw. Log fatigue, dizziness or shortness of breath.',
      red: 'Send the result to the crew medical officer. Before landing: fluid loading and compression garments.',
    },
  },
  immune: {
    id: 'immune',
    name: 'Immune system',
    does: 'White blood cells fight infection and control dormant viruses.',
    space: 'Spaceflight stress can wake dormant viruses; ISS crews have reported rashes, cold sores and unusual allergies.',
    why: 'White cell counts show whether the immune system is shifting, which matters in a closed cabin where an infection reaches everyone.',
    links: [{ label: 'NASA HRP: Altered immune response', url: HRP + 'risk-of-altered-immune-system-responses/' }],
    act: {
      yellow: 'Log temperature and any rash or sore. Keep personal hygiene items separate.',
      red: 'Crew medical officer review. Photo of any skin change to the flight surgeon.',
    },
  },
  kidney: {
    id: 'kidney',
    name: 'Kidneys & fluids',
    does: 'Kidneys filter blood and balance water and salts such as sodium and potassium.',
    space: 'Fluid shifts toward the head in microgravity, and the body sheds fluid early in flight, changing salt and water balance.',
    why: 'Electrolytes and kidney markers show dehydration or salt imbalance, which affects heart rhythm and fainting risk.',
    links: [{ label: 'NASA HRP: Cardiovascular adaptations (fluid shift)', url: HRP + 'risk-of-cardiovascular-adaptations/' }],
    act: {
      yellow: 'Check fluid intake against your plan. Re-test at the next draw.',
      red: 'Crew medical officer review, especially sodium or potassium out of range.',
    },
  },
  liver: {
    id: 'liver',
    name: 'Liver & proteins',
    does: 'The liver processes nutrients and medicines and makes proteins such as albumin.',
    space: 'Diet, medication and metabolic stress in flight all pass through the liver.',
    why: 'Liver enzymes flag medicine or nutrition problems while they are still easy to fix.',
    links: [{ label: 'NASA HRP: Inadequate food and nutrition', url: HRP + 'risk-of-inadequate-food-and-nutrition/' }],
    act: {
      yellow: 'Review recent medication and meals. Re-test at the next draw.',
      red: 'Crew medical officer review before any new medication.',
    },
  },
  bone: {
    id: 'bone',
    name: 'Bones & muscle',
    does: 'Bones hold the body up and store calcium; muscles move it.',
    space: 'Without gravity bone density falls about 1–1.5% per month and strength drops 10–12% on average, even with 1.5 h of daily exercise.',
    why: 'Calcium and alkaline phosphatase track bone turnover; keeping exercise on schedule is the main countermeasure.',
    links: [
      { label: 'NASA HRP: Spaceflight-induced bone changes', url: HRP + 'risk-of-spaceflight-induced-bone-changes/' },
      { label: 'NASA HRP: Reduced fitness', url: HRP + 'risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/' },
    ],
    act: {
      yellow: 'Do not skip resistive exercise today. Check calcium and vitamin D intake.',
      red: 'Crew medical officer review. Report any new back pain.',
    },
  },
  metabolic: {
    id: 'metabolic',
    name: 'Metabolism',
    does: 'Glucose is the body’s main fuel; insulin moves it into cells.',
    space: 'Insulin resistance has been seen in flight, and menu fatigue can cut how much crews eat.',
    why: 'Blood glucose shows whether energy intake and use are balanced.',
    links: [{ label: 'NASA HRP: Inadequate food and nutrition', url: HRP + 'risk-of-inadequate-food-and-nutrition/' }],
    act: {
      yellow: 'Review meals and timing. Re-measure fasting.',
      red: 'If low: fast carbohydrate now, then re-measure in 15 min. If high: crew medical officer review.',
    },
  },
  radiation: {
    id: 'radiation',
    name: 'Radiation (whole body)',
    does: 'Radiation is not something the body measures; instruments on the vehicle do.',
    space: 'Outside Earth’s atmosphere crews get galactic cosmic rays and bursts from solar storms. You cannot see or feel either.',
    why: 'Dose is tracked against mission and career limits, and a solar storm needs a fast shelter decision.',
    links: [
      { label: 'NASA HRP: Space radiation hazard', url: 'https://www.nasa.gov/hrp/hazard-space-radiation/' },
      { label: 'NASA HRP: Radiation-induced cancers', url: HRP + 'risk-of-radiation-induced-cancers/' },
      { label: 'CSA: Monitoring radiation for astronaut health', url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp' },
    ],
    act: {
      yellow: 'Spend sleep and rest periods in the most shielded area.',
      red: 'Solar storm: go to the storm shelter now and follow the vehicle procedure.',
    },
  },
}

export type Preset = {
  id: string
  name: string
  delayText: string
  oneWaySec: number
  delaySource: string
  doseRef: number
  doseRefText: string
  red: string
}

export const PRESETS: Preset[] = [
  {
    id: 'iss', name: 'ISS (low Earth orbit)', delayText: 'near real-time', oneWaySec: 0,
    delaySource: 'Continuous link to Mission Control',
    doseRef: 0.9, doseRefText: '≈0.9 mSv/day measured by ISS TEPC, Sept 2017 (this app’s data)',
    red: 'Call the flight surgeon now (private medical conference).',
  },
  {
    id: 'moon', name: 'Moon surface (Artemis)', delayText: '1.3 s one way', oneWaySec: 1.3,
    delaySource: '384,400 km ÷ speed of light',
    doseRef: 1.37, doseRefText: '1.37 mSv/day on the lunar surface (Chang’e-4 LND, Zhang et al. 2020, Science Advances)',
    red: 'Call the flight surgeon now; expect a short audio lag.',
  },
  {
    id: 'mars-transit', name: 'Mars transit', delayText: 'up to 20 min one way', oneWaySec: 1200,
    delaySource: 'NASA HRP: Distance from Earth hazard',
    doseRef: 1.84, doseRefText: '1.84 mSv/day in cruise (MSL RAD, Zeitlin et al. 2013, Science)',
    red: 'Act now with the crew medical officer. A summary goes to Earth; the earliest reply is 40 min away.',
  },
  {
    id: 'mars-surface', name: 'Mars surface base', delayText: 'up to 20 min one way', oneWaySec: 1200,
    delaySource: 'NASA HRP: Distance from Earth hazard',
    doseRef: 0.64, doseRefText: '0.64 mSv/day on the Mars surface (MSL RAD, Hassler et al. 2014, Science)',
    red: 'Act now with the crew medical officer. A summary goes to Earth; the earliest reply is 40 min away.',
  },
]

export const CAREER_LIMIT_MSV = 600 // NASA-STD-3001 Vol. 1 (2022): 600 mSv career effective dose

export const STATUS_TEXT = { green: 'In range', yellow: 'Watch', red: 'Act', none: 'No data' } as const
export const STATUS_ICON = { green: '●', yellow: '▲', red: '■', none: '○' } as const
