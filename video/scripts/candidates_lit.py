"""Every read of Diego's lines in the lit takes (8, 9, 10): timings + clarity/pace/pitch metrics + start/mid/end stills.
Run from video/:  uvx --python 3.11 --with librosa --with numpy python -I scripts/candidates_lit.py <whisper_dir> <wav_dir> <out_dir>"""
import json, os, re, sys, difflib, subprocess
import numpy as np, librosa

WD, AD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
VID = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "takes")
LINES = {
    0: "On Mars, your doctor is 40 minutes away.",
    1: "This is real NASA data from the Inspiration4 crew.",
    4: "Measured against each astronaut's own baseline,",
    5: "that shift is bigger than anything after recovery.",
    7: "And in a real solar storm, it calls for the shelter in minutes,",
    9: "Delta-Me, your own baseline.",
}
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
os.makedirs(os.path.join(OUT, "tri"), exist_ok=True)
rows = []
for take in (8, 9, 10):
    words = [w for s in json.load(open(os.path.join(WD, f"take{take}.json")))["segments"] for w in s["words"]]
    toks = [norm(w["word"]) for w in words]
    y, sr = librosa.load(os.path.join(AD, f"take{take}.wav"), sr=16000)
    for li, line in LINES.items():
        L = [norm(x) for x in line.replace("-", " ").split()]
        k = len(L)
        hits = []
        for i in range(len(toks)):
            for kk in range(max(1, k - 2), k + 2):
                r = difflib.SequenceMatcher(None, toks[i:i + kk], L, autojunk=False).ratio()
                if r >= 0.62:
                    hits.append((r, i, kk))
        hits.sort(reverse=True)
        used = set()
        for r, i, kk in hits:
            if any(j in used for j in range(i, i + kk)):
                continue
            used.update(range(i, i + kk))
            ws = words[i:i + kk]
            st, en = ws[0]["start"], ws[-1]["end"]
            probs = [w["probability"] for w in ws]
            seg = y[int(st * sr):int(en * sr)]
            f0 = librosa.pyin(seg, fmin=70, fmax=300, sr=sr, frame_length=1024)[0] if len(seg) > 4000 else np.array([np.nan])
            f0 = f0[~np.isnan(f0)]
            pitch = float(np.std(12 * np.log2(f0 / np.median(f0)))) if len(f0) > 5 else None
            rid = f"t{take}@{st:.0f}"
            tri = os.path.join(OUT, "tri", f"L{li}_{rid}.jpg")
            ins = []
            for t in (st + 0.08, (st + en) / 2, en - 0.05):
                ins += ["-ss", f"{max(0, t):.2f}", "-i", os.path.join(VID, f"take{take}.mp4")]
            subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex",
                            "[0]scale=420:-1[a];[1]scale=420:-1[b];[2]scale=420:-1[c];[a][b][c]hstack=3", "-frames:v", "1", tri])
            rows.append(dict(line=li, read=rid, take=take, start=round(st, 2), end=round(en, 2), dur=round(en - st, 2), match=round(r, 2),
                             meanProb=round(float(np.mean(probs)), 3), minProb=round(float(np.min(probs)), 3),
                             pitchSt=None if pitch is None else round(pitch, 2), heard=" ".join(w["word"].strip() for w in ws), tri=tri))
json.dump(rows, open(os.path.join(OUT, "candidates_lit.json"), "w"), indent=1)
for r in sorted(rows, key=lambda r: (r["line"], -r["match"], -r["meanProb"])):
    print(f"L{r['line']} {r['read']:9s} {r['start']:7.2f}-{r['end']:7.2f} dur {r['dur']:4.2f} m {r['match']:.2f} p {r['meanProb']:.2f}/{r['minProb']:.2f} pitch {r['pitchSt']} | {r['heard']}")
