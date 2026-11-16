"""
Build edit decision lists for the pitch drafts from Whisper word timings.

Each draft is a list of beats: (take, script_text, approx_start, approx_end).
For each beat we find the spoken words of `script_text` inside [approx_start-1, approx_end+1] of the take,
cut from the first word's start (minus a small head) to the last word's end (plus a tail), split out
internal pauses longer than MAXGAP, and emit:
  cuts:  [{take, from, to, rate, start, len}]   (source seconds, edit frames)
  words: [{w, a, b, key}]                        (script words, edit frames)
Usage (from video/): python3 -I scripts/edl.py   [whisper_dir out_dir]
Defaults: src/edit/whisper (Whisper word timings of the 4 takes) and src/edit/edl (reads drafts.spec.json, writes draftA/B.json).
"""
import json, re, sys, os, difflib

HERE = os.path.dirname(os.path.abspath(__file__))
D = sys.argv[1] if len(sys.argv) > 2 else os.path.join(HERE, "..", "src", "edit", "whisper")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "src", "edit", "edl")
FPS = 30
HEAD, TAIL, MAXGAP = 0.10, 0.16, 0.30

WORDS = {}
for n in range(1, 11):  # 1-4: Diego (dark room), 5: Ernesto, 6-10: Diego (lit room)
    p = os.path.join(D, f"take{n}.json")
    if os.path.exists(p):
        WORDS[n] = [w for s in json.load(open(p))["segments"] for w in s.get("words", [])]

norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
KEY = {"mars", "40", "doctor", "nasa", "inspiration4", "all", "four", "normal", "own", "baseline", "bigger", "recovery",
       "delta-me", "storm", "shelter", "minutes", "not"}


def beat(take, text, t0, t1, keys=None):
    ws = [w for w in WORDS[take] if w["start"] >= t0 - 0.4 and w["end"] <= t1 + 0.4]
    script = text.split()
    a = [norm(w["word"]) for w in ws]
    b = [norm(x) for x in script]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    # map each script word -> (start, end) using matched/replaced spoken words
    times = [None] * len(script)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op in ("equal", "replace") and i2 > i1:
            for j in range(j1, j2):
                # spread the spoken span over the script words proportionally
                k0 = i1 + (j - j1) * (i2 - i1) / (j2 - j1)
                k1 = i1 + (j - j1 + 1) * (i2 - i1) / (j2 - j1)
                s = ws[int(k0)]["start"]
                e = ws[min(i2 - 1, int(k1 - 1e-9))]["end"]
                times[j] = (s, e)
    # fill gaps (inserted script words not heard) by interpolation
    for j in range(len(script)):
        if times[j] is None:
            prev = next((times[k] for k in range(j - 1, -1, -1) if times[k]), None)
            nxt = next((times[k] for k in range(j + 1, len(script)) if times[k]), None)
            s = prev[1] if prev else (nxt[0] - 0.2)
            e = nxt[0] if nxt else (prev[1] + 0.2)
            times[j] = (s, max(e, s + 0.05))
    # anchor the beat on the matched words that actually lie in the window
    first = times[0][0]
    last = times[-1][1]
    return dict(take=take, script=script, times=times, a=first, b=last, keys=set(keys or []), lead=0)


def build(name, beats, rate=1.0, end_hold=0.0):
    """`rate` is the default playback rate; a beat may override it with its own "rate" (per speaker)."""
    cuts, words = [], []
    at = 0
    for bi, bt in enumerate(beats):
        r = bt.get("rate") or rate
        # split into sub-cuts at pauses > MAXGAP
        segs = [[0]]
        for j in range(1, len(bt["script"])):
            if bt["times"][j][0] - bt["times"][j - 1][1] > MAXGAP:
                segs.append([j])
            else:
                segs[-1].append(j)
        # source intervals for this beat (one per pause-split segment), then remove explicit silence cut-outs
        ivs = []
        for si, seg in enumerate(segs):
            s0 = bt["times"][seg[0]][0] - (HEAD if si == 0 else 0.06)
            e0 = bt["times"][seg[-1]][1] + (TAIL if si == len(segs) - 1 else 0.08)
            ivs.append([s0, e0])
        for ca, cb in bt.get("cutouts") or []:
            nxt = []
            for s0, e0 in ivs:
                if cb <= s0 or ca >= e0:
                    nxt.append([s0, e0])
                    continue
                if ca > s0: nxt.append([s0, ca])
                if cb < e0: nxt.append([cb, e0])
            ivs = nxt
        starts = []
        for k, (s0, e0) in enumerate(ivs):
            ln = round((e0 - s0) / r * FPS)
            c = dict(take=bt["take"], **{"from": round(s0, 3)}, to=round(e0, 3), rate=r, start=at, len=ln, beat=bi)
            if k > 0:
                c["soft"] = True  # a pause trimmed inside one line: same framing, soft dissolve
            if k == 0 and bt.get("lead"):
                c["lead"] = bt["lead"]
            cuts.append(c)
            starts.append((s0, e0, at))
            at += ln

        def out(t):  # source time -> edit frame (times inside a cut-out snap to the next interval)
            for s0, e0, a0 in starts:
                if t <= e0:
                    return a0 + round((max(t, s0) - s0) / r * FPS)
            s0, e0, a0 = starts[-1]
            return a0 + round((e0 - s0) / r * FPS)

        for j, w in enumerate(bt["script"]):
            ws, we = bt["times"][j]
            words.append(dict(w=w, a=out(ws), b=max(out(ws) + 2, out(we)), key=norm(w) in bt["keys"]))
    total = at + round(end_hold * FPS)
    # merge adjacent sub-cuts of the same take that are contiguous in the source (no visible jump)
    json.dump(dict(name=name, fps=FPS, total=total, cuts=cuts, words=words), open(os.path.join(OUT, f"{name}.json"), "w"), indent=1)
    print(f"{name}: {total} frames = {total / FPS:.2f}s, {len(cuts)} cuts")
    for c in cuts:
        print(f"   t{c['take']} {c['from']:7.2f}-{c['to']:7.2f} -> {c['start']:4d}+{c['len']}")
    return total


if __name__ == "__main__":
    spec = json.load(open(os.path.join(OUT, "drafts.spec.json")))
    for d in spec:
        beats = []
        for b in d["beats"]:
            bt = beat(b["take"], b["text"], b["t0"], b["t1"], b.get("keys"))
            bt["lead"] = b.get("lead", 0)
            bt["rate"] = b.get("rate")
            bt["cutouts"] = b.get("cutouts")
            beats.append(bt)
        build(d["name"], beats, d.get("rate", 1.0), d.get("end_hold", 0.0))
