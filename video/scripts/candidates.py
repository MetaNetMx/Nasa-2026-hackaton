"""Every read of every script line: timings + clarity/hesitation/pace/loudness/pitch metrics + a mid-frame still.
Run with: uvx --with librosa --with numpy python -I candidates.py <scratch>"""
import json, os, re, sys, difflib, subprocess
import numpy as np, librosa

S = sys.argv[1]
T = os.path.join(S, "takes")
VID = "/Users/diego/.t3/projects/nasa-hackaton/video/public/takes"
LINES = [
    "On Mars, your doctor is 40 minutes away.",
    "This is real NASA data from the Inspiration4 crew.",
    "The day after landing, red-cell size fell in all four.",
    "Every Earth lab range said normal.",
    "Measured against each astronaut's own baseline,",
    "that shift is bigger than anything after recovery.",
    "Delta-Me checks every crew member against themselves.",
    "And in a real solar storm, it calls for the shelter in minutes,",
    "not 40.",
    "Delta-Me, your own baseline.",
]
READS = [(1, "t1", 0, 40.3), (2, "t2A", 30.5, 63.8), (2, "t2B", 67.0, 106.4), (3, "t3", 0.5, 20.0),
         (4, "t4R1", 0, 36.5), (4, "t4R2", 41.0, 77.0), (4, "t4R3", 78.5, 117.0), (4, "t4R4", 123.5, 159.5), (4, "t4R5", 162.0, 201.0)]
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
script = [(li, w) for li, l in enumerate(LINES) for w in l.replace("-", " ").split()]
os.makedirs(os.path.join(S, "cand"), exist_ok=True)
audio = {n: librosa.load(os.path.join(T, f"take{n}.wav"), sr=16000)[0] for n in (1, 2, 3, 4)}

rows = []
for take, rid, t0, t1 in READS:
    words = [w for s in json.load(open(os.path.join(T, f"take{take}.json")))["segments"] for w in s["words"] if t0 <= w["start"] <= t1]
    a = [norm(w["word"]) for w in words]
    b = [norm(w) for _, w in script]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    owner = {}  # spoken word idx -> line
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op in ("equal", "replace"):
            for i in range(i1, i2):
                j = j1 + min(j2 - j1 - 1, int((i - i1) * (j2 - j1) / max(1, i2 - i1)))
                owner[i] = script[j][0]
    for li in range(len(LINES)):
        idx = [i for i, l in owner.items() if l == li]
        if not idx:
            continue
        ws = words[min(idx):max(idx) + 1]
        exp = len([1 for l, _ in script if l == li])
        cover = len(idx) / exp
        st, en = ws[0]["start"], ws[-1]["end"]
        probs = [w["probability"] for w in ws]
        gaps = [ws[k + 1]["start"] - ws[k]["end"] for k in range(len(ws) - 1)] or [0]
        y = audio[take][int(st * 16000):int(en * 16000)]
        f0, vf, _ = librosa.pyin(y, fmin=70, fmax=300, sr=16000, frame_length=1024) if len(y) > 4000 else (np.array([np.nan]), None, None)
        f0 = f0[~np.isnan(f0)]
        pitch_st = float(np.std(12 * np.log2(f0 / np.median(f0)))) if len(f0) > 5 else None
        rms = librosa.feature.rms(y=y)[0] if len(y) else np.array([0])
        db = 20 * np.log10(rms + 1e-6)
        still = os.path.join(S, "cand", f"L{li}_{rid}.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(st + en) / 2:.2f}", "-i", os.path.join(VID, f"take{take}.mp4"), "-frames:v", "1", "-vf", "scale=480:-1", still])
        rows.append(dict(line=li, read=rid, take=take, start=round(st, 2), end=round(en, 2), dur=round(en - st, 2),
                         wps=round(exp / max(0.3, en - st), 2), cover=round(cover, 2), meanProb=round(float(np.mean(probs)), 3),
                         minProb=round(float(np.min(probs)), 3), maxGap=round(float(max(gaps)), 2),
                         pitchSt=None if pitch_st is None else round(pitch_st, 2), energyDb=round(float(np.percentile(db, 90)), 1),
                         dynDb=round(float(np.percentile(db, 90) - np.percentile(db, 30)), 1),
                         heard=" ".join(w["word"].strip() for w in ws), still=still))
json.dump(rows, open(os.path.join(S, "candidates.json"), "w"), indent=1)
for r in sorted(rows, key=lambda r: (r["line"], r["read"])):
    print(f"L{r['line']} {r['read']:5s} {r['start']:7.2f}-{r['end']:7.2f} dur {r['dur']:4.2f} wps {r['wps']:.2f} cov {r['cover']:.2f} p {r['meanProb']:.2f}/{r['minProb']:.2f} gap {r['maxGap']:.2f} pitch {r['pitchSt']} E {r['energyDb']} dyn {r['dynDb']} | {r['heard']}")
