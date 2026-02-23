export interface GlossaryEntry {
  abbr?: string
  name: string
  tooltip: string  // 1-sentence hover text
  wiki: string     // full markdown-style explanation
  thresholds?: { label: string; value: string; status: 'good' | 'ok' | 'bad' | 'neutral' }[]
}

export const glossary: Record<string, GlossaryEntry> = {
  ctl: {
    abbr: 'CTL',
    name: 'Chronic Training Load (Fitness)',
    tooltip: 'Your long-term fitness — a 42-day exponential moving average of daily training stress.',
    wiki: `CTL (Chronic Training Load) represents your **fitness level** — the cumulative training stress your body has absorbed over the past ~6 weeks.\n\nIt is calculated as a 42-day exponential moving average of your daily Training Stress Score (TSS). A higher CTL means you have built more fitness. However, fitness alone doesn't tell the whole story — it must be balanced with fatigue (ATL) and form (TSB).\n\n**Ramp rate** (how fast CTL is rising) matters too: gaining more than ~5–7 points/week increases injury risk.`,
    thresholds: [
      { label: 'Beginner', value: '< 30', status: 'neutral' },
      { label: 'Recreational', value: '30–60', status: 'ok' },
      { label: 'Competitive', value: '60–100', status: 'good' },
      { label: 'Elite', value: '> 100', status: 'good' },
    ],
  },

  atl: {
    abbr: 'ATL',
    name: 'Acute Training Load (Fatigue)',
    tooltip: 'Your short-term fatigue — a 7-day exponential moving average of recent training stress.',
    wiki: `ATL (Acute Training Load) reflects your **current fatigue** — the training stress you've accumulated over the past ~week.\n\nCalculated as a 7-day exponential moving average of daily TSS. High ATL means you've been training hard recently and may need recovery. ATL rises quickly and drops quickly, making it a sensitive indicator of acute workload.\n\nATL is most meaningful in relation to CTL — if ATL is much higher than CTL, you may be overreaching.`,
    thresholds: [
      { label: 'Fresh / tapering', value: 'ATL < CTL', status: 'good' },
      { label: 'Normal training', value: 'ATL ≈ CTL', status: 'ok' },
      { label: 'Overreaching risk', value: 'ATL >> CTL', status: 'bad' },
    ],
  },

  tsb: {
    abbr: 'TSB',
    name: 'Training Stress Balance (Form)',
    tooltip: 'Your form — the difference between fitness (CTL) and fatigue (ATL). Positive = fresh, negative = tired.',
    wiki: `TSB (Training Stress Balance), often called **Form**, is calculated as **CTL − ATL**.\n\nA positive TSB means you are fresher than your baseline fitness — ideal for racing or peak performance. A negative TSB means you are carrying fatigue, which is normal during training blocks.\n\n**Zones:**\n- **> +5** — Fresh. Good for racing, easy to push hard.\n- **−10 to +5** — Grey Zone. Normal training state.\n- **−10 to −30** — Overreaching. High training stress, recovery needed soon.\n- **< −30** — Overtraining risk. Prolonged fatigue, risk of illness/injury.`,
    thresholds: [
      { label: 'Fresh (race ready)', value: '> +5', status: 'good' },
      { label: 'Grey zone (training)', value: '−10 to +5', status: 'ok' },
      { label: 'Overreaching', value: '< −10', status: 'bad' },
    ],
  },

  ac_ratio: {
    abbr: 'A:C',
    name: 'Acute:Chronic Workload Ratio',
    tooltip: 'ATL divided by CTL — measures if your recent load is appropriate relative to your fitness base.',
    wiki: `The **A:C Ratio** (Acute:Chronic Workload Ratio) compares your short-term load (ATL, ≈1 week) to your long-term fitness (CTL, ≈6 weeks).\n\nIt answers: "Are you doing more or less than your body is prepared for?"\n\n**Thresholds (research-based):**\n- **0.8–1.3** — Sweet spot. Load is appropriate for your fitness.\n- **< 0.8** — Underloading. Risk of detraining.\n- **> 1.3** — Danger zone. Significantly elevated injury risk.\n- **> 1.5** — High risk. Associated with sharp spikes in injury rates in studies on team sports athletes.`,
    thresholds: [
      { label: 'Underloading', value: '< 0.8', status: 'neutral' },
      { label: 'Sweet spot', value: '0.8–1.3', status: 'good' },
      { label: 'Danger zone', value: '1.3–1.5', status: 'ok' },
      { label: 'High injury risk', value: '> 1.5', status: 'bad' },
    ],
  },

  monotony: {
    name: 'Training Monotony',
    tooltip: 'How varied your training is — low monotony means varied days, high monotony means every day looks the same.',
    wiki: `**Monotony** measures how repetitive your daily training load is. It is calculated as the **7-day average load divided by the standard deviation** of daily loads.\n\nHigh monotony (same load every day, e.g. always running 10 km) is associated with increased overtraining risk. Low monotony (mix of hard and easy days) allows better recovery and adaptation.\n\n**Rule of thumb:**\n- **< 1.5** — Good variation, healthy pattern.\n- **1.5–2.0** — Moderate. Consider adding more rest or variation.\n- **> 2.0** — High monotony. Overtraining risk increases.`,
    thresholds: [
      { label: 'Good variation', value: '< 1.5', status: 'good' },
      { label: 'Moderate', value: '1.5–2.0', status: 'ok' },
      { label: 'High monotony', value: '> 2.0', status: 'bad' },
    ],
  },

  training_strain: {
    name: 'Training Strain',
    tooltip: 'Weekly training load multiplied by monotony — a combined measure of total stress with pattern penalty.',
    wiki: `**Training Strain** combines how much you are training with how monotonously you are training:\n\n> Strain = Weekly Load × Monotony\n\nA high strain can result from either a very high weekly load, or a repetitive pattern without enough recovery days — or both.\n\nIt is useful as a single number to track accumulated stress over a training block. Like monotony, aim to keep strain in a manageable range and avoid sudden spikes.`,
  },

  hrv: {
    abbr: 'HRV',
    name: 'Heart Rate Variability',
    tooltip: 'The variation in time between heartbeats — a key indicator of recovery and autonomic nervous system status.',
    wiki: `**HRV (Heart Rate Variability)** measures the variation in time intervals between successive heartbeats, typically in milliseconds.\n\nA **higher HRV** generally indicates better recovery, parasympathetic dominance, and readiness to train. A **lower-than-baseline HRV** suggests stress, fatigue, illness, or poor recovery.\n\n**Common metrics:**\n- **RMSSD** — Root Mean Square of Successive Differences. The most used HRV metric for athletes. Reflects vagal (parasympathetic) activity.\n- **SDNN** — Standard Deviation of NN intervals. Reflects overall HRV including both sympathetic and parasympathetic branches.\n\n**What matters is your personal trend**, not absolute numbers — compare to your own 30-day baseline.`,
  },

  fatigue: {
    name: 'Subjective Fatigue',
    tooltip: 'Self-reported fatigue level on a 1–5 scale (1 = very fresh, 5 = very tired).',
    wiki: `**Subjective Fatigue** is a self-reported rating of how tired you feel, logged daily.\n\n**Scale:**\n- **1** — Very fresh, no fatigue\n- **2** — Slightly tired\n- **3** — Moderate fatigue\n- **4** — Quite tired\n- **5** — Very tired / exhausted\n\nNote that for this metric, **lower is better** — unlike most training metrics. A score of 4–5 on consecutive days is a signal to prioritize recovery. Pair with HRV and TSB for a fuller picture of readiness.`,
    thresholds: [
      { label: 'Very fresh', value: '1', status: 'good' },
      { label: 'Moderate', value: '2–3', status: 'ok' },
      { label: 'Tired', value: '4–5', status: 'bad' },
    ],
  },

  soreness: {
    name: 'Subjective Soreness',
    tooltip: 'Self-reported muscle soreness on a 1–5 scale (1 = no soreness, 5 = very sore).',
    wiki: `**Subjective Soreness** (also called muscle soreness or DOMS — Delayed Onset Muscle Soreness) is a self-reported score.\n\n**Scale:**\n- **1** — No soreness\n- **2** — Slight soreness\n- **3** — Moderate soreness\n- **4** — Significant soreness, affects movement\n- **5** — Severe soreness\n\nSome soreness after hard workouts is normal and indicates adaptation. Persistent high soreness (4–5 for multiple days) is a signal to reduce intensity or volume. **Lower is better** for readiness.`,
    thresholds: [
      { label: 'No soreness', value: '1', status: 'good' },
      { label: 'Manageable', value: '2–3', status: 'ok' },
      { label: 'High soreness', value: '4–5', status: 'bad' },
    ],
  },

  resting_hr: {
    name: 'Resting Heart Rate',
    tooltip: 'Your heart rate at complete rest — a lower resting HR generally indicates better cardiovascular fitness.',
    wiki: `**Resting Heart Rate (RHR)** is the number of heartbeats per minute when you are at rest. It is one of the simplest indicators of cardiovascular health and recovery status.\n\nA **higher-than-normal RHR** (e.g. +5–7 bpm above baseline) can signal fatigue, illness, overtraining, or dehydration. As fitness improves over months, RHR tends to decrease.\n\n**Context:** Always compare to your personal baseline. Elite endurance athletes may have RHR in the 30s–40s; 60–80 bpm is typical for recreational athletes.`,
  },

  sleep: {
    name: 'Sleep',
    tooltip: 'Total sleep duration and quality score — the single most important recovery metric.',
    wiki: `**Sleep** is the most powerful recovery tool available. Both duration and quality matter.\n\n**Duration:**\n- Most adults and athletes need **7–9 hours**.\n- Chronic sleep restriction (<6h) significantly impairs performance, HRV, and injury resilience.\n\n**Sleep Quality / Score:**\nGarmin and similar devices estimate sleep quality based on sleep stages (light, deep, REM). A higher score indicates more restorative sleep.\n\nPrioritize consistent sleep timing, a cool dark room, and avoiding alcohol and screens before bed.`,
  },

  stress: {
    name: 'Stress Score',
    tooltip: 'An overall stress score from Garmin/Intervals.icu based on HRV and other signals.',
    wiki: `The **Stress Score** is a composite metric provided by Garmin or Intervals.icu. It reflects your overall physiological and psychological stress level.\n\nDerived primarily from HRV patterns, it estimates how much your autonomic nervous system is being taxed across the day — not just from training, but from life stress, illness, and poor sleep as well.\n\n**Lower is better.** High stress scores on rest days may indicate that recovery is not happening as expected.`,
    thresholds: [
      { label: 'Low stress', value: '0–25', status: 'good' },
      { label: 'Moderate', value: '26–50', status: 'ok' },
      { label: 'High stress', value: '51–75', status: 'bad' },
      { label: 'Very high', value: '76–100', status: 'bad' },
    ],
  },

  readiness: {
    name: 'Readiness Score',
    tooltip: 'An overall readiness-to-train score from Garmin/Intervals.icu (0–100, higher is better).',
    wiki: `The **Readiness Score** is a composite score from Garmin or Intervals.icu that estimates how ready your body is for training today.\n\nIt typically incorporates HRV, sleep, recovery time from previous activities, and stress levels. **Higher is better.** A score above 70 generally indicates good readiness; below 40 suggests prioritizing recovery over hard training.`,
    thresholds: [
      { label: 'Good to train hard', value: '70–100', status: 'good' },
      { label: 'Moderate effort OK', value: '40–70', status: 'ok' },
      { label: 'Prioritize recovery', value: '0–40', status: 'bad' },
    ],
  },

  vo2max: {
    abbr: 'VO₂max',
    name: 'Maximum Oxygen Uptake',
    tooltip: 'Your aerobic capacity — the maximum rate at which your body can use oxygen during exercise.',
    wiki: `**VO₂max** (maximum oxygen uptake) is the gold standard measure of aerobic fitness. It represents the maximum volume of oxygen (in mL) your body can consume per kilogram of body weight per minute (mL/kg/min).\n\nA higher VO₂max means your cardiovascular system can deliver more oxygen to working muscles, translating to better endurance performance.\n\n**Wearable estimates** (Garmin, Apple Watch, etc.) use heart rate data during runs to estimate VO₂max. These are approximations — lab testing is more accurate.\n\nVO₂max improves over months of consistent aerobic training and naturally declines with age.`,
  },

  mood: {
    name: 'Mood',
    tooltip: 'Self-reported mood on a 1–5 scale — part of subjective wellness tracking.',
    wiki: `**Mood** is a self-reported measure of your psychological state, logged daily.\n\n**Scale:**\n- **1** — Very bad mood\n- **2** — Below average\n- **3** — Neutral\n- **4** — Good\n- **5** — Excellent\n\nMood is closely linked to training state: overtraining and accumulated fatigue often manifest as irritability or low mood before physical performance declines. Consistently low mood scores alongside high fatigue are a strong signal to reduce training load.`,
  },

  motivation: {
    name: 'Motivation',
    tooltip: 'Self-reported motivation to train on a 1–5 scale.',
    wiki: `**Motivation** reflects your drive to train, logged as a daily self-assessment.\n\n**Scale:**\n- **1** — No motivation\n- **2** — Low\n- **3** — Moderate\n- **4** — Good\n- **5** — Very high\n\nLow motivation (especially persistent low scores) is a classic early warning sign of overtraining syndrome. Used alongside HRV, TSB, and mood, it provides a holistic picture of your readiness and long-term wellbeing.`,
  },

  rpe: {
    abbr: 'RPE',
    name: 'Rate of Perceived Exertion',
    tooltip: 'How hard a workout felt on a 1–10 scale.',
    wiki: `**RPE (Rate of Perceived Exertion)** is a subjective rating of how hard an activity felt.\n\n**Borg CR10 scale (common in running):**\n- **1–2** — Very easy, minimal effort\n- **3–4** — Easy, comfortable pace\n- **5–6** — Moderate, somewhat hard\n- **7–8** — Hard, uncomfortable\n- **9** — Very hard, near max\n- **10** — Maximum effort\n\nRPE is useful for calibrating training zones without heart rate data, and for tracking how a given pace or power feels over time as fitness improves.`,
  },

  spo2: {
    abbr: 'SpO₂',
    name: 'Blood Oxygen Saturation',
    tooltip: 'The percentage of hemoglobin in your blood that is carrying oxygen.',
    wiki: `**SpO₂ (Peripheral Oxygen Saturation)** measures what percentage of your hemoglobin is carrying oxygen, as estimated by a pulse oximeter on your wearable device.\n\nAt sea level, healthy values are typically **95–100%**. Values below 94% may indicate breathing issues, illness, or altitude effects.\n\n**Wearable accuracy:** Consumer devices are less accurate than medical-grade pulse oximeters. Treat readings as a trend indicator rather than precise medical data.\n\nDeclines at altitude are normal — the body adapts over days by producing more red blood cells.`,
    thresholds: [
      { label: 'Normal', value: '95–100%', status: 'good' },
      { label: 'Below normal', value: '90–94%', status: 'ok' },
      { label: 'Concerning', value: '< 90%', status: 'bad' },
    ],
  },

  weight: {
    name: 'Body Weight',
    tooltip: 'Your recorded body weight in kg.',
    wiki: `**Body Weight** is tracked as a trend metric. Day-to-day fluctuations of 1–2 kg are normal due to hydration, food intake, and other factors.\n\nFor athletes, weight is most useful as a long-term trend rather than a daily number. Sudden drops may indicate dehydration; gradual changes reflect body composition shifts.`,
  },

  body_fat: {
    name: 'Body Fat Percentage',
    tooltip: 'Estimated percentage of body weight that is fat mass.',
    wiki: `**Body Fat %** is an estimate of the proportion of your body mass that is fat. Consumer devices (smart scales, Garmin) estimate this via bioelectrical impedance, which is less accurate than DEXA scans.\n\nUse it as a trend over time rather than an absolute number. Hydration status significantly affects readings — measure at consistent times (e.g. morning, after using the bathroom, before eating).`,
  },
}
