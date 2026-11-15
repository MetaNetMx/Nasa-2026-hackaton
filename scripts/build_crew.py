"""Build app/public/data/crew.json from the Inspiration4 OSDR blood panels.

Sources (open, no login):
  OSD-575 LSDS-8 Comprehensive Metabolic Panel (TRANSFORMED csv)
  OSD-569 LSDS-7 Complete Blood Count (TRANSFORMED csv)

Method: each crew member's three pre-flight draws (L-92, L-44, L-3) form their
personal baseline. Spread is the within-person SD pooled across the 4 crew
members (3 samples each are too few for a per-person SD). A value is scored
against both the lab's population range and the personal baseline.
"""
import csv, json, math, re, statistics as st, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/osdr"
OUT = ROOT / "app/public/data/crew.json"

FILES = {
    "CMP": RAW / "LSDS-8_Comprehensive_Metabolic_Panel_CMP_TRANSFORMED.csv",
    "CBC": RAW / "LSDS-7_Complete_Blood_Count_CBC_TRANSFORMED.csv",
}

# key -> (label, unit, region, panel)
ANALYTES = {
    "red_blood_cell_count": ("Red blood cells", "M/µL", "blood"),
    "hemoglobin": ("Hemoglobin", "g/dL", "blood"),
    "hematocrit": ("Hematocrit", "%", "blood"),
    "mcv": ("MCV (red cell size)", "fL", "blood"),
    "mch": ("MCH", "pg", "blood"),
    "mchc": ("MCHC", "g/dL", "blood"),
    "rdw": ("RDW (red cell size spread)", "%", "blood"),
    "platelet_count": ("Platelets", "K/µL", "blood"),
    "mpv": ("MPV (platelet size)", "fL", "blood"),
    "white_blood_cell_count": ("White blood cells", "K/µL", "immune"),
    "absolute_neutrophils": ("Neutrophils", "cells/µL", "immune"),
    "absolute_lymphocytes": ("Lymphocytes", "cells/µL", "immune"),
    "absolute_monocytes": ("Monocytes", "cells/µL", "immune"),
    "absolute_eosinophils": ("Eosinophils", "cells/µL", "immune"),
    "absolute_basophils": ("Basophils", "cells/µL", "immune"),
    "creatinine": ("Creatinine", "mg/dL", "kidney"),
    "urea_nitrogen_bun": ("Urea nitrogen (BUN)", "mg/dL", "kidney"),
    "bun_to_creatinine_ratio": ("BUN/creatinine ratio", "", "kidney"),
    "egfr_non_african_american": ("eGFR", "mL/min/1.73m²", "kidney"),
    "sodium": ("Sodium", "mmol/L", "kidney"),
    "potassium": ("Potassium", "mmol/L", "kidney"),
    "chloride": ("Chloride", "mmol/L", "kidney"),
    "carbon_dioxide": ("Bicarbonate (CO₂)", "mmol/L", "kidney"),
    "alt": ("ALT", "U/L", "liver"),
    "ast": ("AST", "U/L", "liver"),
    "total_bilirubin": ("Bilirubin", "mg/dL", "liver"),
    "albumin": ("Albumin", "g/dL", "liver"),
    "total_protein": ("Total protein", "g/dL", "liver"),
    "globulin": ("Globulin", "g/dL", "liver"),
    "glucose": ("Glucose", "mg/dL", "metabolic"),
    "calcium": ("Calcium", "mg/dL", "bone"),
    "alkaline_phosphatase": ("Alkaline phosphatase", "U/L", "bone"),
}

SAMPLE = re.compile(r"(C\d+)_[\w-]+?_([LR][+-]\d+)")


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def load(path):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    cols = list(rows[0].keys())
    out = {}
    for r in rows:
        crew, tp = SAMPLE.match(r["Sample Name"]).groups()
        out.setdefault(crew, {})[tp] = r
    return cols, out


def find_col(cols, key, kind):
    """kind: value | min | max. Column names in OSDR are slightly inconsistent."""
    for c in cols:
        if not c.startswith(key + "_"):
            continue
        rest = c[len(key) + 1:]
        if kind == "value" and rest.startswith("value"):
            return c
        if kind == "min" and rest.startswith("range_min"):
            return c
        if kind == "max" and (rest.startswith("range_max") or rest.startswith("max")):
            return c
    return None


def day(tp):
    return int(tp[1:]) if tp[0] == "R" else -int(tp[2:]) if tp[1] == "-" else int(tp[1:])


def main():
    crew_ids = set()
    analytes = []
    for panel, path in FILES.items():
        cols, data = load(path)
        crew_ids |= set(data)
        for key, (label, unit, region) in ANALYTES.items():
            vc = find_col(cols, key, "value")
            if not vc:
                continue
            mnc, mxc = find_col(cols, key, "min"), find_col(cols, key, "max")
            series, devs, nper = {}, [], 0
            for crew, tps in sorted(data.items()):
                pts = []
                for tp, r in tps.items():
                    v = num(r[vc])
                    if v is None:
                        continue
                    pts.append({"tp": tp, "day": day(tp), "v": v,
                                "lo": num(r.get(mnc)) if mnc else None,
                                "hi": num(r.get(mxc)) if mxc else None})
                pts.sort(key=lambda p: p["day"])
                pre = [p["v"] for p in pts if p["day"] < 0]
                if len(pre) >= 2:
                    m = st.mean(pre)
                    devs += [x - m for x in pre]
                    nper += 1
                series[crew] = {"points": pts, "baseline": st.mean(pre) if pre else None}
            if nper < 2:
                continue
            dof = len(devs) - nper
            sd = (sum(d * d for d in devs) / dof) ** 0.5 if dof > 0 else 0.0
            if sd == 0:
                continue
            for s in series.values():
                for p in s["points"]:
                    p["z"] = round((p["v"] - s["baseline"]) / sd, 2) if s["baseline"] is not None else None
            analytes.append({"key": key, "label": label, "unit": unit, "region": region,
                             "panel": panel, "sd": round(sd, 4), "crew": series})

    # Honest statistics. With 3 pre-flight draws per person the SD is itself estimated (pooled, ~8 degrees of
    # freedom), so a single |z| >= 3 is far less rare than a normal table says. Use a t-based prediction tail.
    dof_pooled = 2 * len(crew_ids)
    p_single = t_tail(3 / math.sqrt(1 + 1 / 3), dof_pooled)
    post = ["R+1", "R+45", "R+82", "R+194"]

    def z_at(s, tp):
        p = next((q for q in s["points"] if q["tp"] == tp), None)
        return p["z"] if p and p["z"] is not None else None

    # Confirmation rules: a crew-wide shift (all crew, same direction, |mean z| >= 3) or the same person beyond 3 SD
    # on two consecutive return draws. A single unconfirmed crossing is a Caution ("repeat the draw").
    crew_wide, recovery_null = [], []
    for a in analytes:
        for tp in post:
            zs = [z_at(s, tp) for s in a["crew"].values()]
            if any(z is None for z in zs) or len(zs) < 3:
                continue
            mz = sum(zs) / len(zs)
            same = all(z < 0 for z in zs) or all(z > 0 for z in zs)
            if tp != "R+1":
                recovery_null.append(abs(mz))
            if same and abs(mz) >= 3:
                crew_wide.append({"key": a["key"], "label": a["label"], "tp": tp, "meanZ": round(mz, 2)})
                for s in a["crew"].values():
                    for q in s["points"]:
                        if q["tp"] == tp:
                            q["confirm"] = "crew"
        for s in a["crew"].values():
            prev = None
            for tp in post:
                q = next((x for x in s["points"] if x["tp"] == tp), None)
                if not q or q["z"] is None:
                    prev = None
                    continue
                if prev is not None and abs(q["z"]) >= 3 and abs(prev) >= 3 and (q["z"] > 0) == (prev > 0) and "confirm" not in q:
                    q["confirm"] = "repeat"
                prev = q["z"]

    crossings = {}
    for tp in post:
        n = c = 0
        for a in analytes:
            for s in a["crew"].values():
                z = z_at(s, tp)
                if z is not None:
                    n += 1
                    c += abs(z) >= 3
        crossings[tp] = {"checks": n, "beyond3": c, "expectedByChance": round(n * p_single, 1)}

    # Summary for the day-after-landing headline (R+1).
    hidden, outside, checks = [], 0, 0
    for a in analytes:
        for crew, s in a["crew"].items():
            for p in s["points"]:
                if p["tp"] != "R+1" or p["z"] is None:
                    continue
                checks += 1
                in_range = p["lo"] is not None and p["hi"] is not None and p["lo"] <= p["v"] <= p["hi"]
                if p["lo"] is not None and not in_range:
                    outside += 1
                if in_range and abs(p["z"]) >= 3:
                    hidden.append({"crew": crew, "key": a["key"], "label": a["label"], "v": p["v"], "z": p["z"]})

    out = {
        "source": {
            "mission": "SpaceX Inspiration4 (3-day orbital flight, Sept 2021), 4 civilian crew",
            "datasets": [
                {"id": "OSD-575", "name": "Comprehensive Metabolic Panel", "url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-575"},
                {"id": "OSD-569", "name": "Complete Blood Count", "url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-569"},
            ],
            "timepoints": "Pre-flight L-92, L-44, L-3; return R+1, R+45, R+82, R+194 (days)",
            "method": (f"Personal baseline = mean of the 3 pre-flight draws; SD = within-person SD pooled across the {len(crew_ids)} crew "
                       f"({dof_pooled} degrees of freedom). Because that SD is estimated from few draws, a single value beyond 3 SD happens "
                       f"by chance about {p_single * 100:.1f}% of the time (about {checks * p_single:.0f} of {checks} checks), so a single "
                       f"crossing is only a Caution: repeat the draw. Warning needs confirmation: the same shift in the whole crew "
                       f"(|mean z| >= 3, same direction) or the same person beyond 3 SD on two consecutive return draws."),
        },
        "crewIds": sorted(crew_ids),
        "analytes": analytes,
        "summary": {"checksR1": checks, "outsidePopulationR1": outside, "hiddenR1": hidden},
        "evidence": {
            "pSingle": round(p_single, 4), "crossings": crossings, "crewWide": crew_wide,
            "recoveryNullMaxMeanZ": round(max(recovery_null), 2) if recovery_null else None, "recoveryNullN": len(recovery_null),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT} | analytes={len(analytes)} checksR1={checks} outside={outside} hidden(|z|>=3)={len(hidden)}")
    for h in sorted(hidden, key=lambda h: -abs(h["z"])):
        print("  ", h)
    print("  p_single", round(p_single, 4), "crossings", crossings)
    print("  crew-wide", crew_wide, "| recovery null max |mean z|", round(max(recovery_null), 2), "n", len(recovery_null))


def t_tail(t: float, df: int) -> float:
    """Two-sided tail P(|T| >= t) for Student's t, by numeric integration (no SciPy needed)."""
    c = math.gamma((df + 1) / 2) / (math.sqrt(df * math.pi) * math.gamma(df / 2))
    n, hi = 40000, 80.0
    h = (hi - t) / n
    return 2 * h * sum(c * (1 + (t + (i + 0.5) * h) ** 2 / df) ** (-(df + 1) / 2) for i in range(n))


if __name__ == "__main__":
    sys.exit(main())
