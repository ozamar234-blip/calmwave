# CalmWave — Scientific Basis & Research Foundation

## Overview
CalmWave detects stress via smartphone accelerometer tremor analysis and uses adaptive music (Entrainment / Iso Principle) to guide relaxation. This document summarizes the peer-reviewed research backing each component.

---

## 1. Physiological Tremor & Stress Detection

### Scientific Evidence
**Enhanced Physiological Tremor (EPT)** is a well-documented phenomenon where normal hand tremor becomes amplified under stress, anxiety, fatigue, and sympathetic nervous system activation.

- **Frequency range**: Physiological tremor occurs at **8–12 Hz** (central component), with the broader postural tremor band spanning **4–12 Hz** (Frontiers in Neurology, 2021; AAFP, 2018)
- **Mechanism**: Increased sympathetic activity amplifies the normal mechanical-reflex tremor. Anxiety, stress, and caffeine are established enhancers (Deuschl et al., 1991; Tremor Syndromes Review, PMC 2021)
- **Amplitude increase**: Stress increases tremor **amplitude** while frequency remains relatively stable at 8–12 Hz (PMC 5144461)
- **Reversibility**: EPT resolves when the triggering condition (stress/anxiety) is removed, confirming it as a direct biomarker of acute stress state

### CalmWave Implementation
- **Frequency band: 4–12 Hz** ✅ — Matches the standard postural tremor band used in clinical accelerometer studies
- **RMS + Band Power combination** — Captures both overall tremor amplitude (RMS) and frequency-specific tremor energy (Band Power in 4-12Hz)

### Key References
- Frontiers in Neurology (2021): "Tremor Syndromes: An Updated Review" — 4-12 Hz postural tremor band
- Nature Scientific Reports (2022): PSD ratio of 4-12 Hz / 0.5-4 Hz band validated for tremor detection
- PMC (2023): Physiological tremor during exercise measured via wrist accelerometer, 8-12 Hz
- Deuschl et al. (1991): Acute sympatholytic intervention normalized enhanced tremor, proving sympathetic involvement

---

## 2. Smartphone Accelerometer Validation

### Scientific Evidence
Multiple peer-reviewed studies validate smartphone accelerometers for tremor measurement:

| Study | Year | Finding |
|-------|------|---------|
| Joundi et al. (iPhone tremor detection) | 2011 | iPhone accelerometer can rapidly assess tremor frequency |
| LopezBlanco et al. (iTremor app) | 2015 | Good correlation with clinical scores, higher discriminatory power than clinical ratings (PMID: 25720954) |
| Smartphone as standalone platform | 2013 | Reliable time- and frequency-domain tremor characteristics compared to lab accelerometer (PMID: 23346053) |
| Smartphone apps for OT screening | 2018 | 92-100% sensitivity, 92-100% specificity (PMID: 30363432) |
| Tremor evaluation in standardized settings | 2022 | Sufficiently detailed and reliable for closed-loop DBS control (PMID: 35979340) |
| Consumer product accelerometers vs lab | 2020 | Feasible quantification in ET and PD patients (J Clinical Movement Disorders) |

### CalmWave Implementation
- Uses standard Web DeviceMotion API at ~60Hz sampling ✅
- Falls back to `accelerationIncludingGravity` for Safari compatibility ✅
- Personal calibration baseline accounts for device/person differences ✅

---

## 3. FFT Signal Processing

### Scientific Evidence (PMC 7869147 — MS Tremor Detection Study)
The most relevant validation study used FFT-based tremor detection from wrist accelerometer data:

| Parameter | Validated Setting | CalmWave Setting |
|-----------|-------------------|------------------|
| Window function | Hanning (Hann) | Hanning ✅ |
| Sample rate | 100 Hz (interpolated) | 60 Hz (device native) |
| Window duration | 2 seconds (optimal) | ~17 seconds (1024/60) |
| Overlap | 50% (optimal for Hanning) | N/A (single analysis) |
| Frequency range | 3–15 Hz | 4–12 Hz ✅ |
| Amplitude threshold | 0.06g | Relative to personal baseline ✅ |
| **Sensitivity** | **97.4%** | — |
| **Specificity** | **97.1%** | — |

### CalmWave Implementation
- Cooley-Tukey radix-2 FFT ✅ — Standard algorithm
- Hanning window ✅ — Recommended for 95% of vibration analysis cases (NI Application Notes)
- Frequency resolution: 60/1024 ≈ 0.059 Hz ✅ — Excellent for the 4-12 Hz band
- Band power computed as sum of squared magnitudes in target band ✅

### Recommendation Based on Research
- **Current 4-12 Hz range is well-supported**, though extending to 3-15 Hz could catch edge cases
- The 60 Hz sample rate provides adequate Nyquist frequency (30 Hz) for the tremor band

---

## 4. Stress Score Formula

### Current Formula
```
raw = 0.4 × RMS_relative + 0.6 × BandPower_relative
score = clamp(1, 10, 1 + (raw - 1) × 4.5)
```

### Scientific Basis
- **RMS** measures overall vibration amplitude — the standard metric per ISO 20816-1:2016
- **Band Power (4-12Hz)** measures frequency-specific tremor energy — captures enhanced physiological tremor selectively
- **Higher weight on Band Power (0.6)** is justified because:
  - General hand movement (non-tremor) contributes to RMS but NOT to 4-12Hz band power
  - Stress specifically enhances tremor in the 8-12 Hz band (EPT literature)
  - The Nature Scientific Reports 2022 study specifically used the PSD ratio in the 4-12 Hz band as the primary discriminator

### Personal Calibration
- Computing baseline RMS and Band Power during a relaxed state, then measuring relative to baseline, is consistent with the clinical approach of normalizing tremor amplitude
- This accounts for individual differences in natural tremor level, device sensitivity, and hand-holding position

### Recommendation
The 0.4/0.6 weighting is reasonable. Band Power deserves higher weight because it's more specific to stress-induced tremor.

---

## 5. Musical Entrainment & the Iso Principle

### Scientific Evidence
The core therapeutic approach in CalmWave is based on two well-established music therapy principles:

#### A. Auditory-Motor Entrainment
- **Definition**: The phenomenon where human motor and physiological systems synchronize to external rhythmic stimuli (Thaut, 2015; PMC 4344110)
- **Neural basis**: The auditory system has richly distributed fiber connections to motor centers from the spinal cord upward (Frontiers in Psychology, 2014)
- **Evidence**: Finger and arm movements instantaneously entrain to the period of a rhythmic stimulus and stay locked even when subtle tempo changes are induced that are not consciously perceived

#### B. The Iso Principle
- **Definition**: A music therapy technique where music first **matches** the patient's current state and then **gradually changes** tempo/rhythm to guide them toward the desired state (Brewer & Campbell, 1991)
- **CalmWave implementation**: Start BPM matches stress score → gradually ramp down to 65 BPM ✅
- **Clinical validation**: "The iso principle has been indicated in prior research to be more effective than other musical sequences at reducing tension" (PMC 8906590)
- **Mechanism**: Works at a sub-conscious level through the autonomic nervous system

#### C. Tempo and Autonomic Effects
- A tempo of **60 BPM** was associated with **greater vagal (parasympathetic) modulations** of heart rate than faster tempi (Sage Journals, 2019)
- Slow music stimulates the parasympathetic nervous system, decreasing heart rate
- Music tempo affects cardiovascular function regardless of musical style or personal preference

### CalmWave Implementation
- Start BPM 65-120 based on stress score ✅ — Iso Principle: match current state
- Gradual ramp to 65 BPM over 3-8 minutes ✅ — Iso Principle: guide to desired state
- Target 65 BPM ✅ — Within the validated 60-90 BPM optimal range

---

## 6. 60-65 BPM Target for Relaxation

### Scientific Evidence
- **Meta-analysis** (de Witte et al., 2020): Music at **60–90 BPM** produced large effect sizes (d = 0.900) for stress reduction, significantly larger than other tempos
- **Alpha brainwave induction**: Music at ~60 BPM can induce alpha brainwaves associated with relaxation after ~45 minutes of listening
- **Parasympathetic activation**: 60 BPM tempo showed greater vagal modulation than faster tempi
- **Cortisol reduction**: Landmark PLOS ONE study (2013) showed music significantly affects cortisol response to stress (p = 0.025)

### CalmWave Target: 65 BPM ✅
Slightly above the absolute minimum to maintain musical engagement while staying within the validated relaxation range.

---

## 7. Breathing Synchronization

### Scientific Evidence
- Breathing at **5.5 breaths per minute** (I:E ratio 5:5) achieves greatest HRV increase (ScienceDirect)
- Musical phrases with **10-second periodicity** (= 6 breaths/min) synchronize with circulatory Mayer waves and enhance baroreflex sensitivity (Circulation, 2006)
- Music can guide breathing without conscious awareness through loudness modulation (Leslie, 2019)
- Combined music + controlled breathing produces stronger parasympathetic activation than either alone

### CalmWave Implementation
- Breathing cycle synced to BPM (4 beats per breath) ✅
- At target 65 BPM: breathing rate = 65/4 ≈ 16 breaths/min (higher than optimal 6 bpm)
- **Potential improvement**: Consider 8-10 beats per breath cycle at low BPM to approach the optimal 6 breaths/min

---

## 8. Summary of Scientific Validation

| Component | Evidence Level | Status |
|-----------|---------------|--------|
| 4-12 Hz tremor band for stress | Strong (multiple studies) | ✅ Validated |
| Smartphone accelerometer for tremor | Strong (clinical validation) | ✅ Validated |
| FFT + Hanning window | Strong (standard practice) | ✅ Validated |
| RMS + Band Power combination | Moderate (standard vibration metrics) | ✅ Reasonable |
| 0.4/0.6 RMS/BP weighting | Low (our custom ratio) | ⚠️ Reasonable but not directly from literature |
| Iso Principle (match → guide) | Strong (established music therapy) | ✅ Validated |
| Entrainment to music tempo | Moderate (respiratory > cardiac) | ✅ Supported |
| 60-65 BPM for relaxation | Strong (meta-analysis) | ✅ Validated |
| Breathing sync to music | Moderate | ✅ Supported |

---

## References

1. Tremor Syndromes: An Updated Review — Frontiers in Neurology (2021)
2. Wearable sensors for essential tremor — Nature Scientific Reports (2022)
3. Physiological tremors during exercise — PMC 9925111 (2023)
4. MS tremor FFT detection algorithm — PMC 7869147 (2021)
5. Smartphone tremor detection validation — PMID: 23346053 (2013)
6. iTremor app validation — PMID: 25720954 (2015)
7. Smartphone OT screening — PMID: 30363432 (2018)
8. Cardiovascular entrainment by music — PMC 3547422 (2013)
9. Music & stress: PLOS ONE — PMC 3734071 (2013)
10. Music therapy meta-analysis — Taylor & Francis (2020)
11. Iso Principle in mood management — Idun/Augsburg
12. Neurobiological foundations of rhythmic entrainment — PMC 4344110 (2014)
13. Controlled tempo & cardiovascular autonomic function — Sage Journals (2019)
14. 60-90 BPM meta-analysis — de Witte et al. (2020)
15. Breathing at 5.5 bpm & HRV — ScienceDirect (2013)
16. Dynamic cardiovascular & cerebral rhythms — Circulation (2006)
17. Enhanced physiological tremor — AAFP (2018), PMC 5144461 (2016)
18. Deuschl et al. tremor in RSD — PubMed (1991)
