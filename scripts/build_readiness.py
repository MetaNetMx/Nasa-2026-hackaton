"""Train the readiness model on NASA's Flight Crew Physiological Data for Crew State Monitoring.

Dataset: https://data.nasa.gov/dataset/flight-crew-physiological-data-for-crew-state-monitoring
Files: csm/{subject}.zip -> {subject}/{subject}_{CA,DA,SS}.csv (256 Hz; ECG, R = respiration, GSR, Event).
Experiments: CA = channelized attention, DA = diverted attention, SS = startle/surprise.
Event = 0 marks the unperturbed state; any other value marks the induced state.

Features per 20 s window (5 s step), each z-scored against that subject's own event-0 windows:
  hr   = median heart rate from ECG R-peaks
  resp = breathing rate (dominant 0.1-0.6 Hz frequency of the respiration belt)
  gsr  = mean galvanic skin response
Model: logistic regression (numpy, L2), evaluated leave-one-subject-out.
"""
import csv, json, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CSM = ROOT / "data/raw/datanasa/csm"
OUT = ROOT / "app/public/data/readiness.json"
FS, WIN, STEP = 256, 20, 5
FEATS = ["hr", "resp", "gsr"]


def load(path):
    cache = path.with_suffix(".npy")
    if cache.exists():
        return np.load(cache)
    with open(path) as fh:
        r = csv.reader(fh)
        h = next(r)
        i = h.index("ECG")
        a = np.array([[float(x[1]), float(x[i]), float(x[i + 1]), float(x[i + 2]), float(x[i + 3])] for x in r])
    np.save(cache, a)
    return a


def bandpass(x, lo, hi):
    X = np.fft.rfft(x - x.mean())
    f = np.fft.rfftfreq(len(x), 1 / FS)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def heart_rate(ecg):
    y = bandpass(ecg, 5, 25) ** 2
    y = np.convolve(y, np.ones(25) / 25, "same")
    thr = np.percentile(y, 90)
    peaks, last = [], -1e9
    for i in range(1, len(y) - 1):
        if y[i] > thr and y[i] >= y[i - 1] and y[i] >= y[i + 1] and i - last > FS * 0.35:
            peaks.append(i)
            last = i
    rr = np.diff(peaks) / FS
    rr = rr[(rr > 0.4) & (rr < 1.5)]
    return 60 / np.median(rr) if len(rr) >= 5 else np.nan


def resp_rate(r):
    x = r - r.mean()
    n = len(x)
    X = np.abs(np.fft.rfft(x * np.hanning(n), n * 4))
    f = np.fft.rfftfreq(n * 4, 1 / FS)
    m = (f >= 0.1) & (f <= 0.6)
    return f[m][X[m].argmax()] * 60


def windows(a, exp):
    rows = []
    for s in range(0, len(a) - FS * WIN, FS * STEP):
        w = a[s:s + FS * WIN]
        ev = w[:, 4]
        label = int(np.mean(ev != 0) > 0.5)
        rows.append({"t": round(float(w[0, 0]), 1), "exp": exp, "y": label,
                     "hr": heart_rate(w[:, 1]), "resp": resp_rate(w[:, 2]), "gsr": float(w[:, 3].mean())})
    return rows


def auc(y, p):
    pos, neg = p[y == 1], p[y == 0]
    if len(pos) == 0 or len(neg) == 0:
        return float("nan")
    return float((pos[:, None] > neg[None, :]).mean() + 0.5 * (pos[:, None] == neg[None, :]).mean())


def fit(X, y, l2=0.1, iters=3000, lr=0.1):
    w, b = np.zeros(X.shape[1]), 0.0
    pw = (len(y) - y.sum()) / max(y.sum(), 1)  # balance classes
    sw = np.where(y == 1, pw, 1.0)
    for _ in range(iters):
        p = 1 / (1 + np.exp(-(X @ w + b)))
        g = sw * (p - y)
        w -= lr * (X.T @ g / len(y) + l2 * w)
        b -= lr * g.mean()
    return w, b


def main():
    subjects = {}
    for d in sorted(p for p in CSM.iterdir() if p.is_dir()):
        rows = []
        for exp in ["CA", "DA", "SS"]:
            f = d / f"{d.name}_{exp}.csv"
            if f.exists():
                rows += windows(load(f), exp)
        rows = [r for r in rows if not np.isnan(r["hr"])]
        base = [r for r in rows if r["y"] == 0]
        if len(base) < 5 or len(base) == len(rows):
            print(f"skip subject {d.name}: {len(base)} baseline / {len(rows)} windows")
            continue
        stats = {k: (np.mean([r[k] for r in base]), np.std([r[k] for r in base]) or 1.0) for k in FEATS}
        for r in rows:
            for k in FEATS:
                r["z_" + k] = (r[k] - stats[k][0]) / stats[k][1]
        subjects[d.name] = {"rows": rows, "baseline": {k: [round(v, 2) for v in stats[k]] for k in FEATS}}
        print(f"subject {d.name}: {len(rows)} windows, {sum(r['y'] for r in rows)} induced-state")

    if len(subjects) < 2:
        sys.exit("need at least 2 subjects")

    def XY(names):
        rs = [r for n in names for r in subjects[n]["rows"]]
        return np.array([[r["z_" + k] for k in FEATS] for r in rs]), np.array([r["y"] for r in rs], float)

    names = sorted(subjects)
    loso = {}
    for held in names:
        Xtr, ytr = XY([n for n in names if n != held])
        w, b = fit(Xtr, ytr)
        Xte, yte = XY([held])
        loso[held] = round(auc(yte, 1 / (1 + np.exp(-(Xte @ w + b)))), 3)
    X, y = XY(names)
    w, b = fit(X, y)
    print("LOSO AUC", loso, "weights", dict(zip(FEATS, w.round(3))), "bias", round(b, 3))

    # Effect sizes: mean z in induced vs baseline windows.
    effects = {k: round(float(X[y == 1, i].mean() - X[y == 0, i].mean()), 2) for i, k in enumerate(FEATS)}

    replay_subject = max(names, key=lambda n: loso[n])
    replay = []
    for r in subjects[replay_subject]["rows"]:
        z = np.array([r["z_" + k] for k in FEATS])
        replay.append({"t": r["t"], "exp": r["exp"], "y": r["y"],
                       "hr": round(r["hr"], 1), "resp": round(r["resp"], 1), "gsr": round(r["gsr"], 1),
                       "p": round(float(1 / (1 + np.exp(-(z @ w + b)))), 3)})

    out = {
        "source": {
            "dataset": "NASA Flight Crew Physiological Data for Crew State Monitoring",
            "url": "https://data.nasa.gov/dataset/flight-crew-physiological-data-for-crew-state-monitoring",
            "subjects": names,
            "note": "Pilots in controlled attention experiments (CA, DA, SS), not astronauts. Used as the closest open NASA dataset with labeled crew states.",
        },
        "features": FEATS, "weights": [round(float(v), 4) for v in w], "bias": round(float(b), 4),
        "looAuc": loso, "effects": effects,
        "replaySubject": replay_subject, "replayBaseline": subjects[replay_subject]["baseline"], "replay": replay,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
