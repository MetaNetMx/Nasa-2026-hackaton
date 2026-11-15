#!/usr/bin/env python3
"""Delta-Me README figures: 4 figures x 2 themes (dark, light) -> docs/figures/*.png

Run from the repo root:   python3 docs/figures/make_figures.py [--fonts DIR]

Everything is recomputed from the JSON files the app ships with, and the reference
numbers quoted in the README are asserted, so a figure can never drift from the data.
Needs only Python 3, matplotlib and numpy. Space Mono is used if --fonts DIR holds
SpaceMono-Regular.ttf / SpaceMono-Bold.ttf, otherwise DejaVu Sans Mono.
"""
import argparse
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.text
import matplotlib.ticker
from matplotlib import patheffects
import matplotlib.transforms
import numpy as np
from matplotlib import font_manager
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
W_IN, DPI = 8.0, 200  # 1600 px wide

# ---------------------------------------------------------------- themes
# Crew hues: validated with scripts/validate_palette.js --pairs all against each surface.
# Status colours (nominal / caution / warning) are reserved for status and always carry a text label.
THEMES = {
    "dark": dict(
        bg="#141414", text="#EDEDED", muted="#8C8C8C", grid=(0.929, 0.929, 0.929, 0.08),
        axis=(0.929, 0.929, 0.929, 0.28), accent="#FF7A1A", nominal="#3DDC84", caution="#F5D90A",
        warning="#FF3355", iss="#4C8DFF", neutral="#8C8C8C", band=0.30, shade=0.12,
        crew=["#129fe7", "#8851d1", "#cd632d", "#e25bb0"],
    ),
    "light": dict(
        bg="#FFFFFF", text="#111111", muted="#5C5C5C", grid=(0.067, 0.067, 0.067, 0.10),
        axis=(0.067, 0.067, 0.067, 0.35), accent="#C84F00", nominal="#12894A", caution="#9A7400",
        warning="#D4163A", iss="#1F5FD6", neutral="#6B6B6B", band=0.16, shade=0.06,
        crew=["#268bfc", "#763ebd", "#cf6f19", "#d852a6"],
    ),
}
CREW_IDS = ["C001", "C002", "C003", "C004"]
FS_TITLE, FS_SUB, FS_HEAD, FS_TXT, FS_TICK = 15, 9.2, 9.2, 8.8, 8.6  # pt; 8.6 pt = 24 px at 200 dpi
SOURCE_BLOOD = "Data: NASA OSDR OSD-569 · Inspiration4 crew"
SOURCE_ISS = "Data: NASA CDAWeb ISS_DOSANL_TEPC · NOAA SWPC event times"


def setup_fonts(fonts_dir):
    family = "DejaVu Sans Mono"
    if fonts_dir:
        files = [Path(fonts_dir) / n for n in ("SpaceMono-Regular.ttf", "SpaceMono-Bold.ttf")]
        if all(f.exists() for f in files):
            for f in files:
                font_manager.fontManager.addfont(str(f))
            family = "Space Mono"
    plt.rcParams["font.family"] = family
    plt.rcParams["axes.unicode_minus"] = True
    return family


# ---------------------------------------------------------------- data + reference checks
def near(a, b, tol, what):
    assert abs(a - b) <= tol, f"{what}: computed {a}, expected {b} (tol {tol})"


def load_data():
    crew = json.load(open(ROOT / "app/public/data/crew.json"))
    rad = json.load(open(ROOT / "app/public/data/radiation.json"))
    video = json.load(open(ROOT / "video/src/data.json"))
    return crew, rad, video


def compute_blood(crew, video):
    TPS = ["L-92", "L-44", "L-3", "R+1", "R+45", "R+82", "R+194"]
    RET = TPS[3:]
    an = {a["key"]: a for a in crew["analytes"]}
    mcv = an["mcv"]
    sd = mcv["sd"]
    near(sd, 1.0693, 1e-4, "MCV pooled SD")
    series = {}  # cid -> dict(v=[7], z=[7], base)
    for cid in CREW_IDS:
        pts = {p["tp"]: p for p in mcv["crew"][cid]["points"]}
        pre = [pts[t]["v"] for t in TPS[:3]]
        base = sum(pre) / 3
        v = [pts[t]["v"] if t in pts else np.nan for t in TPS]
        z = [(pts[t]["v"] - base) / sd if t in pts else np.nan for t in TPS]
        for t, zz in zip(TPS, z):  # recomputed z must equal the stored (2 dp) z
            if t in pts:
                near(zz, pts[t]["z"], 0.011, f"{cid} {t} z")
        series[cid] = dict(v=np.array(v), z=np.array(z), base=base, pre=pre, pts=pts)
    ref = {"C001": (93.57, 90.1, -3.24), "C002": (95.43, 90.5, -4.61),
           "C003": (91.97, 88.7, -3.06), "C004": (90.03, 87.0, -2.84)}
    for cid, (b, v, z) in ref.items():
        near(series[cid]["base"], b, 0.006, f"{cid} baseline")
        near(series[cid]["v"][3], v, 1e-9, f"{cid} R+1")
        near(series[cid]["z"][3], z, 0.011, f"{cid} R+1 z")
        p = series[cid]["pts"]["R+1"]
        assert (p["lo"], p["hi"]) == (80.0, 100.0), "lab range"
    assert np.isnan(series["C002"]["v"][6]), "C002 should have no R+194 MCV"
    mean_z_r1 = float(np.mean([series[c]["z"][3] for c in CREW_IDS]))
    near(mean_z_r1, -3.44, 0.006, "MCV crew mean z at R+1")

    # single crossings |z|>=3 per return draw, and crew-wide shifts at recovery draws (build_crew.py rules)
    crossings = {t: [0, 0] for t in RET}
    recovery = []
    for a in crew["analytes"]:
        for t in RET:
            zs = []
            for cid in CREW_IDS:
                p = next((q for q in a["crew"][cid]["points"] if q["tp"] == t), None)
                zs.append(p["z"] if p and p.get("z") is not None else None)
            for z in zs:
                if z is not None:
                    crossings[t][0] += 1
                    crossings[t][1] += abs(z) >= 3
            if t != "R+1" and all(z is not None for z in zs):
                recovery.append(abs(sum(zs) / 4))
    expect = {"R+1": (123, 4), "R+45": (122, 6), "R+82": (123, 4), "R+194": (122, 6)}
    for t, (n, c) in expect.items():
        assert crossings[t] == [n, c], f"crossings {t}: {crossings[t]} != {[n, c]}"
    p_single = crew["evidence"]["pSingle"]
    near(p_single, 0.0317, 1e-4, "pSingle")
    chance = [round(n * p_single, 1) for n, _ in expect.values()]
    assert chance == [3.9, 3.9, 3.9, 3.9], chance
    assert len(recovery) == 88, len(recovery)
    near(max(recovery), 2.70, 0.006, "max recovery |mean z|")
    # MCV at R+194 is not among the 88 (C002 has no R+194 draw); the 3 crew measured stayed low
    z194 = [series[c]["z"][6] for c in CREW_IDS if not np.isnan(series[c]["z"][6])]
    assert len(z194) == 3, z194
    mcv_r194 = abs(float(np.mean(z194)))
    near(mcv_r194, 3.98, 0.006, "MCV R+194 |mean z| of the 3 crew measured")
    # cross-check with the values the video uses
    assert sorted(round(x, 3) for x in recovery) == sorted(round(x, 3) for x in video["crewWide"]["null"]), "video null mismatch"
    return dict(TPS=TPS, sd=sd, series=series, mean_z_r1=mean_z_r1, crossings=crossings, chance=3.9,
                recovery=np.array(recovery), recovery_max=max(recovery), r1_mcv=abs(mean_z_r1), mcv_r194=mcv_r194)


def compute_storm(rad):
    m = np.array(rad["min"], float)
    rate = np.array(rad["rate"], float)
    lat = np.array(rad["lat"], float)
    lon = np.array(rad["lon"], float)
    start = datetime.fromisoformat(rad["source"]["start"].replace("Z", "+00:00"))
    saa = (lon > -90) & (lon < 10) & (lat > -50) & (lat < 5)
    ok = (np.abs(lat) >= 40) & ~saa  # useReplay.ts: |lat| >= 40 and outside the SAA box
    base = rate[(m < 6 * 1440) & ok].mean()
    near(base, 0.5481, 5e-4, "quiet baseline")
    cs = np.concatenate([[0], np.cumsum(rate * ok)])
    cc = np.concatenate([[0], np.cumsum(ok)])
    ratio = np.ones(len(m))
    for i in range(len(m)):  # trailing 180 min: samples with min > now-180, up to and including i
        lo = np.searchsorted(m, m[i] - 180, side="right")
        c = cc[i + 1] - cc[lo]
        if c > 3:
            ratio[i] = (cs[i + 1] - cs[lo]) / c / base

    def at(day, hh, mm):
        return (day - 4) * 1440 + hh * 60 + mm

    t_alert = at(10, 16, 45)
    i_warn = int(np.argmax(ratio >= 2.0))
    i_caut = int(np.argmax(ratio >= 1.7))
    i_peak = int(np.argmax(ratio))
    assert i_warn == i_caut and abs(m[i_warn] - at(11, 5, 52)) < 1, "first Caution/Warning"
    near(ratio[i_warn], 2.04, 0.006, "ratio at first Warning")
    pre_max = ratio[m < t_alert].max()
    near(pre_max, 1.504, 0.002, "max ratio before the alert")
    near(ratio[i_peak], 13.26, 0.006, "peak ratio")
    assert abs(m[i_peak] - at(11, 9, 51)) < 1, "peak time"
    daily = rad["dailyMsv"]
    near(daily["2017-09-10"], 0.889, 1e-9, "Sept 10 dose")
    near(daily["2017-09-11"], 1.71, 1e-9, "Sept 11 dose")
    others = [v for k, v in daily.items() if k not in ("2017-09-10", "2017-09-11")]
    assert 0.77 <= min(others) and max(others) <= 1.06, "other days"
    return dict(m=m, ratio=ratio, base=base, start=start, t_alert=t_alert, t_warn=m[i_warn], i_warn=i_warn,
                t_peak=m[i_peak], i_peak=i_peak, peak=ratio[i_peak], pre_max=pre_max, daily=daily,
                t_rise=at(11, 4, 15), at=at)


# ---------------------------------------------------------------- drawing helpers
class Canvas:
    """A figure with inch-based placement and the shared header/footer."""

    def __init__(self, th, h_in, title, subtitle, source):
        self.th, self.h = th, h_in
        self.fig = plt.figure(figsize=(W_IN, h_in), dpi=DPI, facecolor=th["bg"])
        self.fig.text(0.25 / W_IN, 1 - 0.22 / h_in, title, color=th["text"], fontsize=FS_TITLE, fontweight="bold", va="top", ha="left")
        self.fig.text(0.25 / W_IN, 1 - 0.58 / h_in, subtitle, color=th["muted"], fontsize=FS_SUB, va="top", ha="left")
        self.fig.text(0.25 / W_IN, 0.16 / h_in, source, color=th["muted"], fontsize=FS_TICK, va="bottom", ha="left")

    def axes(self, left, top, width, height):
        """Axes by inches: left edge, distance of the top edge from the figure top, size."""
        ax = self.fig.add_axes([left / W_IN, 1 - (top + height) / self.h, width / W_IN, height / self.h], facecolor=self.th["bg"])
        style(ax, self.th)
        return ax

    def text(self, x, top, s, **kw):
        kw.setdefault("color", self.th["text"])
        kw.setdefault("fontsize", FS_TXT)
        kw.setdefault("va", "top")
        return self.fig.text(x / W_IN, 1 - top / self.h, s, **kw)

    def save(self, name):
        # Space Mono Bold renders w/W with broken contours in matplotlib, so "bold" = Regular + a thin same-colour stroke.
        for t in self.fig.findobj(matplotlib.text.Text):
            if t.get_fontweight() in ("bold", 700):
                t.set_fontweight("normal")
                t.set_path_effects([patheffects.withStroke(linewidth=0.8, foreground=t.get_color())])
        self.fig.savefig(OUT / name, dpi=DPI, facecolor=self.th["bg"])
        plt.close(self.fig)


def style(ax, th):
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    for s in ("left", "bottom"):
        ax.spines[s].set_color(th["axis"])
        ax.spines[s].set_linewidth(0.8)
    ax.tick_params(colors=th["muted"], labelcolor=th["muted"], labelsize=FS_TICK, length=3, width=0.8, color=th["axis"])
    ax.yaxis.grid(True, color=th["grid"][:3], alpha=th["grid"][3], linewidth=0.8)
    ax.set_axisbelow(True)
    ax.xaxis.label.set_color(th["muted"])
    ax.yaxis.label.set_color(th["muted"])


def axlabel(ax, th, x=None, y=None):
    if x:
        ax.set_xlabel(x, color=th["muted"], fontsize=FS_TXT, labelpad=5)
    if y:
        ax.set_ylabel(y, color=th["muted"], fontsize=FS_TXT, labelpad=5)


def fmt(v, nd=1):
    return f"{v:.{nd}f}".replace("-", "−")


# ---------------------------------------------------------------- figure 1
def fig1(th, name, B):
    s = B["series"]["C002"]
    c = th["crew"][1]  # C002's identity colour, same as in figure 2
    base, sd = s["base"], B["sd"]
    lo, hi = base - 3 * sd, base + 3 * sd
    r1, z1 = s["v"][3], s["z"][3]
    near(lo, 92.2, 0.03, "C002 own range low")
    near(hi, 98.6, 0.05, "C002 own range high")
    cv = Canvas(th, 5.7, "Normal on Earth, not normal for you",
                "How big one astronaut's red blood cells are (MCV, in fL = a tiny unit of volume)", SOURCE_BLOOD)
    ax = cv.axes(0.3, 0.95, 7.45, 3.75)
    ax.set_xlim(78, 102)
    ax.set_ylim(-3.0, 4.2)
    ax.yaxis.grid(False)
    ax.spines["left"].set_visible(False)
    ax.set_yticks([])
    ax.set_xticks(range(78, 103, 4))
    axlabel(ax, th, x="MCV, mean red-cell size (fL)")
    # wide band: Earth lab range
    ax.add_patch(Rectangle((80, 3.0), 20, 0.8, facecolor=th["neutral"], alpha=th["band"], edgecolor="none"))
    ax.plot([80, 80], [3.0, 3.8], color=th["neutral"], lw=1.6)
    ax.plot([100, 100], [3.0, 3.8], color=th["neutral"], lw=1.6)
    ax.text(90, 3.4, "Earth lab range: 80–100 fL (people in general)", color=th["text"], fontsize=FS_TXT, ha="center", va="center")
    # narrow band: own range
    ax.add_patch(Rectangle((lo, 1.9), hi - lo, 0.8, facecolor=c, alpha=0.30, edgecolor="none"))
    ax.plot([lo, lo], [0.45, 2.7], color=c, lw=1.6)
    ax.plot([hi, hi], [0.45, 2.7], color=c, lw=1.6)
    ax.text(lo - 0.3, 2.45, f"C002's own range: {lo:.1f}–{hi:.1f} fL", color=th["text"], fontsize=FS_TXT, ha="right", va="center")
    ax.text(lo - 0.3, 2.05, "baseline ± 3 SD", color=th["muted"], fontsize=FS_TXT, ha="right", va="center")
    ax.plot([base, base], [1.9, 2.7], color=th["text"], lw=1.3)
    ax.text(base, 1.66, f"baseline {base:.1f}", color=th["text"], fontsize=FS_TXT, ha="center", va="top")
    # dots (the two close pre-flight values are nudged apart vertically so both stay visible)
    ys = [0.9, 0.78, 1.02]
    for xv, yv in zip(s["pre"], ys):
        ax.plot([xv], [yv], "o", ms=11, mfc=th["bg"], mec=c, mew=2.2, ls="none", zorder=5)
    ax.plot([r1], [0.9], "o", ms=15, mfc=c, mec=th["text"], mew=2.0, ls="none", zorder=6)
    ax.text(95.0, 0.3, "3 draws before flight", color=th["text"], fontsize=FS_TXT, ha="center", va="top")
    ax.text(r1 + 1.3, 0.3, f"after landing: {r1:.1f} fL", color=th["text"], fontsize=FS_TXT, ha="right", va="top", fontweight="bold")
    ax.text(78.4, -0.85, "After landing: inside the lab range (80–100 fL),", color=th["text"], fontsize=FS_TXT, fontweight="bold", ha="left", va="top")
    ax.text(78.4, -1.35, f"but far outside C002's own range: {fmt(abs(z1))} SD below baseline.", color=th["text"], fontsize=FS_TXT, fontweight="bold", ha="left", va="top")
    ax.text(78.4, -2.05, "SD = standard deviation = the size of a person's", color=th["muted"], fontsize=FS_TXT, ha="left", va="top")
    ax.text(78.4, -2.5, "normal wobble between tests. Beyond 3 SD is unusual for them.", color=th["muted"], fontsize=FS_TXT, ha="left", va="top")
    cv.save(name)


# ---------------------------------------------------------------- figure 2
def spread(ys, gap):
    """Push label heights apart (sorted, min gap) so direct end-labels do not overlap."""
    order = sorted(range(len(ys)), key=lambda i: ys[i])
    out = list(ys)
    for a, b in zip(order, order[1:]):
        if out[b] - out[a] < gap:
            out[b] = out[a] + gap
    return out


R1_NUDGE = {"C001": -0.2, "C004": 0.2}  # C003 stays on the column


def fig2(th, name, B):
    TPS = B["TPS"]
    x = np.arange(7)
    cv = Canvas(th, 6.9, "Same blood, two questions",
                "Red-cell size (MCV) of the four Inspiration4 crew, 3 draws before and 4 after flight", SOURCE_BLOOD)
    L = cv.axes(0.82, 2.4, 3.15, 2.75)
    R = cv.axes(4.72, 2.4, 3.15, 2.75)
    for ax in (L, R):
        ax.set_xlim(-0.5, 7.05)
        ax.set_xticks(x)
        ax.set_xticklabels(TPS)
        ax.axvline(2.5, color=th["axis"], lw=1.0)
        axlabel(ax, th, x="Blood draw")
    L.set_ylim(78, 102)
    L.set_yticks(range(80, 101, 5))
    R.set_ylim(-6, 3)
    R.set_yticks(range(-6, 4, 1))
    # bands
    L.axhspan(80, 100, facecolor=th["neutral"], alpha=th["band"], edgecolor="none")
    L.text(-0.3, 80.5, "lab range 80–100", color=th["text"], fontsize=FS_TXT, va="bottom", ha="left")
    R.axhspan(-3, 3, facecolor=th["neutral"], alpha=th["band"], edgecolor="none")
    R.text(-0.3, -2.9, "within ±3 SD", color=th["text"], fontsize=FS_TXT, va="top", ha="left")
    R.axhline(0, color=th["axis"], lw=1.0)
    for ax, ytxt in ((L, 101.4), (R, 2.9)):
        ax.text(2.5, ytxt, "flight", color=th["muted"], fontsize=FS_TXT, ha="center", va="top",
                bbox=dict(facecolor=th["bg"], edgecolor="none", pad=1.5))
    axlabel(L, th, y="MCV (fL)")
    axlabel(R, th, y="MCV vs own baseline (SD)")
    ends = {}
    for k, cid in enumerate(CREW_IDS):
        col = th["crew"][k]
        sr = B["series"][cid]
        last = int(np.max(np.where(~np.isnan(sr["v"]))))
        ends[cid] = (last, sr["v"][last], sr["z"][last])
        for ax, y in ((L, sr["v"]), (R, sr["z"])):
            ax.plot(x, y, "-", color=col, lw=1.6, solid_capstyle="round", zorder=3)  # NaN = gap
            xm = x.astype(float)
            if ax is R and cid in R1_NUDGE:
                xm[3] += R1_NUDGE[cid]  # markers only: separates the three R+1 dots that sit within 0.4 SD
            ax.plot(xm, y, "o", color=col, ms=7, mec=th["bg"], mew=1.5, ls="none", zorder=4)
    # direct end labels in both panels; C002 (no R+194 draw) is labelled above its last point
    full = [c for c in CREW_IDS if ends[c][0] == 6]
    for ax, idx, gap in ((L, 1, 1.5), (R, 2, 0.5)):
        ly = spread([ends[c][idx] for c in full], gap)
        for c, yy in zip(full, ly):
            ax.text(6.22, yy, c, color=th["text"], fontsize=FS_TXT, va="center", ha="left")
        ax.text(5, ends["C002"][idx] + (-0.9 if idx == 1 else 0.3), "C002", color=th["text"], fontsize=FS_TXT, va="top" if idx == 1 else "bottom", ha="center")
    # headings
    cv.text(0.3, 1.35, "MCV in fL", fontweight="bold", fontsize=FS_HEAD)
    cv.text(4.26, 1.35, "How far from own usual (SD)", fontweight="bold", fontsize=FS_HEAD)
    cv.text(0.3, 1.62, "Earth lab range: all normal", color=th["text"], fontsize=FS_TXT)
    cv.text(4.26, 1.62, "Own baseline: all four dropped the", color=th["text"], fontsize=FS_TXT)
    cv.text(4.26, 1.82, "day after landing (mean −3.4 SD)", color=th["text"], fontsize=FS_TXT)
    cv.text(4.26, 2.04, "SD = normal wobble between tests", color=th["muted"], fontsize=FS_TXT)
    # R+1 crew mean: small side marker so the four individual dots stay visible
    mz = B["mean_z_r1"]
    R.plot([3.5], [mz], marker="<", ms=8, color=th["text"], ls="none", zorder=6)
    R.annotate(f"R+1 mean\n{fmt(mz)} SD\n(−2.8 to −4.6)", xy=(3.42, mz), xytext=(-0.3, -5.0), color=th["text"], fontsize=FS_TXT,
               ha="left", va="center", linespacing=1.3,
               arrowprops=dict(arrowstyle="-", color=th["text"], lw=1.0, shrinkA=4, shrinkB=2))
    # legend
    handles = [Line2D([0], [0], color=th["crew"][k], lw=1.8, marker="o", ms=7, mec=th["bg"], label=cid) for k, cid in enumerate(CREW_IDS)]
    leg = cv.fig.legend(handles=handles, loc="upper left", bbox_to_anchor=(0.32 / W_IN, 1 - 0.92 / cv.h), ncol=4, frameon=False,
                        handlelength=2.0, columnspacing=1.8, prop=dict(size=FS_TXT))
    for t in leg.get_texts():
        t.set_color(th["text"])
    cv.text(7.75, 0.98, "gap in a line = no data", color=th["muted"], fontsize=FS_TXT, ha="right")
    cv.text(0.3, 5.9, "L-92 = 92 days before launch; R+45 = 45 days after return.", color=th["muted"], fontsize=FS_TXT)
    cv.text(0.3, 6.12, "Equal spacing, not time scale. C002 has no R+194 draw. R+1 dots nudged sideways.", color=th["muted"], fontsize=FS_TXT)
    cv.text(0.3, 6.34, "One value beyond ±3 SD is only a Caution until confirmed (next figure).", color=th["muted"], fontsize=FS_TXT)
    cv.save(name)


# ---------------------------------------------------------------- figure 3
def swarm(vals, w_in, lo, hi, d_in):
    """Deterministic beeswarm: x from the value, y offset (inches) so markers do not overlap."""
    placed, ys = [], []
    for v in vals:
        px = (v - lo) / (hi - lo) * w_in
        k = 0
        while True:
            cand = 0 if k == 0 else (math.ceil(k / 2) * d_in * (1 if k % 2 else -1))
            if all((px - qx) ** 2 + (cand - qy) ** 2 >= d_in ** 2 for qx, qy in placed):
                break
            k += 1
        placed.append((px, cand))
        ys.append(cand)
    return np.array(ys)


def fig3(th, name, B):
    cv = Canvas(th, 5.8, "Why one odd value is not enough",
                "SD = size of a person's normal wobble between tests. Beyond 3 SD = unusual for them.", SOURCE_BLOOD)
    L = cv.axes(0.85, 2.15, 2.95, 2.45)
    R = cv.axes(4.7, 2.15, 3.05, 2.45)
    # left: single crossings
    tps = ["R+1", "R+45", "R+82", "R+194"]
    cnt = [B["crossings"][t][1] for t in tps]
    xs = np.arange(4)
    L.bar(xs, cnt, width=0.5, color=th["neutral"], zorder=3)
    L.set_xlim(-0.6, 3.6)
    L.set_ylim(0, 8)
    L.set_yticks(range(0, 9, 2))
    L.set_xticks(xs)
    L.set_xticklabels(tps)
    L.axhline(B["chance"], color=th["text"], lw=1.5, ls=(0, (4, 2)), zorder=4,
              path_effects=[patheffects.withStroke(linewidth=3.2, foreground=th["bg"])])
    for xx, cc in zip(xs, cnt):
        L.text(xx, cc + 0.2, str(cc), color=th["text"], fontsize=FS_TXT, ha="center", va="bottom", fontweight="bold")
    L.plot([-0.5, -0.2], [7.35, 7.35], color=th["text"], lw=1.5, ls=(0, (2, 1.5)))
    L.text(-0.1, 7.35, "expected by luck alone: 3.9", color=th["text"], fontsize=FS_TXT, ha="left", va="center")
    axlabel(L, th, x="Return draw", y="Odd values per draw (count)")
    # right: strip plot
    rec = np.sort(B["recovery"])
    lo_, hi_ = 0, 4
    ys = swarm(rec, 3.05, lo_, hi_, 0.095)
    R.set_xlim(lo_, 4.2)
    R.set_ylim(-1.2, 1.2)
    R.set_yticks([])
    R.spines["left"].set_visible(False)
    R.yaxis.grid(False)
    R.set_xticks(range(0, 5))
    R.axvline(3, color=th["text"], lw=1.3, zorder=2)
    R.plot(rec, ys / (2.45 / 2.4), "o", ms=6, color=th["neutral"], mec=th["bg"], mew=0.8, ls="none", zorder=3, alpha=0.95)
    R.plot([B["r1_mcv"]], [0], "o", ms=12, mfc=th["text"], mec=th["bg"], mew=2, ls="none", zorder=5)
    # MCV at R+194: only 3 crew measured, so it is not one of the 88; hollow = incomplete
    R.plot([B["mcv_r194"]], [0], "o", ms=12, mfc=th["bg"], mec=th["text"], mew=2, ls="none", zorder=5)
    R.text(2.94, 1.12, "app alarm level: 3", color=th["text"], fontsize=FS_TXT, ha="right", va="top")
    R.annotate(f"R+1 MCV\n{B['r1_mcv']:.2f}", xy=(B["r1_mcv"], 0.12), xytext=(3.1, 0.62), color=th["text"], fontsize=FS_TXT,
               fontweight="bold", ha="left", va="center", linespacing=1.3,
               arrowprops=dict(arrowstyle="-", color=th["text"], lw=1.0, shrinkA=2, shrinkB=6))
    R.annotate(f"R+194 MCV\n{B['mcv_r194']:.2f}\n(3 crew)", xy=(B["mcv_r194"], -0.12), xytext=(3.1, -0.72), color=th["text"],
               fontsize=FS_TXT, ha="left", va="center", linespacing=1.3,
               arrowprops=dict(arrowstyle="-", color=th["text"], lw=1.0, shrinkA=2, shrinkB=6))
    imax = int(np.argmax(rec))
    R.annotate(f"largest of\nthe 88: {B['recovery_max']:.2f}", xy=(rec[imax], ys[imax] / (2.45 / 2.4)), xytext=(2.85, 0.62),
               color=th["text"], fontsize=FS_TXT, ha="right", va="center", linespacing=1.3,
               arrowprops=dict(arrowstyle="-", color=th["text"], lw=1.0, shrinkA=2, shrinkB=4))
    axlabel(R, th, x="Average shift of the crew\n(in SD, direction ignored)")
    for left, lines in ((0.3, ("Odd values happen by luck", "Count beyond 3 SD per return draw,", "out of about 123 measurements each.", "So the app asks for a repeat draw.")),
                        (4.12, ("Crew-wide shifts this big are rare", "Grey: each marker at R+45, R+82, R+194,", "averaged over all 4 crew. None of 88", "reach 3. Height = spacing only."))):
        cv.text(left, 1.2, lines[0], fontweight="bold", fontsize=FS_HEAD)
        for j, ln in enumerate(lines[1:]):
            cv.text(left, 1.44 + 0.21 * j, ln, fontsize=FS_TXT)
    cv.text(4.12, 5.22, "Hollow: MCV at R+194 is not one of the 88", color=th["muted"], fontsize=FS_TXT)
    cv.text(4.12, 5.43, "(C002 had no draw). Red-cell size stayed low.", color=th["muted"], fontsize=FS_TXT)
    cv.save(name)


# ---------------------------------------------------------------- figure 4
def fig4(th, name, S):
    m, ratio = S["m"], S["ratio"]
    d = m / 1440.0  # days since Sept 4 00:00 UTC
    H = 10.6
    cv = Canvas(th, H, "The September 2017 solar storm, on the ISS radiation meter",
                "How much more radiation the ISS received than on a quiet day (1x = normal)", SOURCE_ISS)
    ticks = [0.5, 1, 2, 5, 10, 20]
    LEFT, WID = 0.85, 5.95

    def ratio_axes(ax, yl):
        ax.set_yscale("log")
        ax.set_ylim(*yl)
        ax.set_yticks(ticks)
        ax.set_yticklabels([f"{t:g}x" for t in ticks])
        ax.minorticks_off()
        ax.yaxis.set_minor_locator(matplotlib.ticker.NullLocator())
        for v, lab, col, va, ls in ((1.7, "Caution 1.7x", th["caution"], "top", (0, (4, 2))), (2.0, "Warning 2.0x", th["warning"], "bottom", "-")):
            ax.axhline(v, color=col, lw=1.4, ls=ls, zorder=2)
            ax.text(1.015, v, lab, transform=matplotlib.transforms.blended_transform_factory(ax.transAxes, ax.transData),
                    color=th["text"], fontsize=FS_TXT, ha="left", va=va)
        axlabel(ax, th, y="Dose-rate ratio (x quiet baseline)")

    def lead(ax, xy, xytext, label, ha, **kw):
        ax.annotate(label, xy=xy, xytext=xytext, color=th["text"], fontsize=FS_TXT, ha=ha, va="center",
                    arrowprops=dict(arrowstyle="-", color=th["muted"], lw=0.9, shrinkA=3, shrinkB=5), **kw)

    # ---- top: whole period
    cv.text(0.3, 0.92, "Whole record, 4–15 September (UTC)", fontweight="bold", fontsize=FS_HEAD)
    A = cv.axes(LEFT, 1.25, WID, 2.35)
    A.set_xlim(0, 12)
    ratio_axes(A, (0.4, 40))
    A.axvspan(0, 6, facecolor=th["neutral"], alpha=th["shade"], edgecolor="none")
    A.plot(d, ratio, color=th["iss"], lw=1.2, zorder=3)
    A.set_xticks(np.arange(0, 13))
    A.set_xticklabels([])
    A.xaxis.grid(True, color=th["grid"][:3], alpha=th["grid"][3], linewidth=0.8)
    A.text(0.12, 38, "Quiet baseline, Sept 4–9 (= 1.0x)", color=th["text"], fontsize=FS_TXT, va="top", ha="left")
    A.text(0.12, 17, "Daily wobble = orbit over high vs low latitudes", color=th["text"], fontsize=FS_TXT, va="center", ha="left")
    z0, z1 = S["at"](10, 12, 0) / 1440, S["at"](11, 12, 0) / 1440
    A.axvspan(z0, z1, facecolor=th["text"], alpha=0.10, edgecolor="none", zorder=1)
    A.text(z1 + 0.12, 30, "zoom: last panel", color=th["muted"], fontsize=FS_TXT, va="center", ha="left")
    # pre-alert maximum and the post-storm tail
    pre = m < S["t_alert"]
    ip = int(np.argmax(np.where(pre, ratio, 0)))
    lead(A, (d[ip], ratio[ip]), (0.12, 3.0), "Sept 4 to S1 alert: max %.2fx,\nno false alarm" % S["pre_max"], "left")
    tail = d > 8
    it = int(np.argmax(np.where(tail, ratio, 0)))
    A.text(d[it] + 0.18, ratio[it] * 1.45, f"storm tail, Sept 12: {ratio[it]:.1f}x", color=th["text"], fontsize=FS_TXT, va="center", ha="left")
    ia = int(np.argmin(np.abs(m - S["t_alert"])))
    lead(A, (S["t_alert"] / 1440, ratio[ia]), (6.4, 5.4), "NOAA S1 alert 16:45", "right")
    lead(A, (S["t_warn"] / 1440, ratio[S["i_warn"]]), (6.95, 9.8), "first Warning 05:52", "right")
    for tt, col in ((S["t_alert"], th["text"]), (S["t_warn"], th["warning"]), (S["t_peak"], th["text"])):
        i = int(np.argmin(np.abs(m - tt)))
        A.plot([tt / 1440], [ratio[i]], "o", ms=8, mfc=col, mec=th["bg"], mew=1.6, ls="none", zorder=6)
    A.text(S["t_peak"] / 1440 + 0.16, 13.3, f"peak {S['peak']:.1f}x", color=th["text"], fontsize=FS_TXT, va="center", ha="left")

    # ---- middle: daily dose, shared time axis
    cv.text(0.3, 3.82, "Dose per day (mSv = millisievert, a unit of radiation dose)", fontweight="bold", fontsize=FS_HEAD)
    B_ = cv.axes(LEFT, 4.12, WID, 1.45)
    B_.set_xlim(0, 12)
    B_.set_ylim(0, 2.0)
    B_.set_yticks([0, 0.5, 1.0, 1.5, 2.0])
    B_.set_yticklabels(["0", "0.5", "1.0", "1.5", "2.0"])
    days = sorted(S["daily"])
    for k, key in enumerate(days):
        hl = key == "2017-09-11"
        B_.bar(k + 0.5, S["daily"][key], width=0.38, color=th["accent"] if hl else th["neutral"], zorder=3)
    B_.text(7.5, S["daily"]["2017-09-11"] + 0.05, "1.71", color=th["text"], fontsize=FS_TXT, fontweight="bold", ha="center", va="bottom")
    for j, ln in enumerate(("Storm day: about 2x a", "normal day (0.77–1.06),", "as the peak lasted hours")):
        B_.text(8.1, 1.82 - 0.27 * j, ln, color=th["text"], fontsize=FS_TXT, ha="left", va="center",
                bbox=dict(facecolor=th["bg"], edgecolor="none", pad=1.0), zorder=5)
    B_.set_xticks(np.arange(0, 13))
    B_.set_xticklabels([])
    B_.set_xticks(np.arange(12) + 0.5, minor=True)
    B_.set_xticklabels([str(4 + k) for k in range(12)], minor=True)
    B_.tick_params(axis="x", which="minor", length=0, labelsize=FS_TICK, labelcolor=th["muted"])
    B_.tick_params(axis="x", which="major", length=3)
    B_.xaxis.grid(True, color=th["grid"][:3], alpha=th["grid"][3], linewidth=0.8)
    axlabel(B_, th, x="Day of September 2017 (UTC)", y="Dose (mSv per day)")

    # ---- bottom: zoom
    cv.text(0.3, 6.52, "Zoom (shaded in the top panel): 10 Sept 12:00 to 11 Sept 12:00 UTC", fontweight="bold", fontsize=FS_HEAD)
    Z = cv.axes(LEFT, 6.85, WID, 2.6)
    sel = (d >= z0) & (d <= z1)
    Z.set_xlim(0, 24)
    hrs = (d - z0) * 24
    ratio_axes(Z, (0.4, 80))
    Z.plot(hrs[sel], ratio[sel], color=th["iss"], lw=1.5, zorder=3)
    tk = np.arange(0, 25, 3)
    Z.set_xticks(tk)
    Z.set_xticklabels(["12:00\nSep 10" if t == 0 else ("00:00\nSep 11" if t == 12 else f"{(12 + t) % 24:02d}:00") for t in tk])
    Z.xaxis.grid(True, color=th["grid"][:3], alpha=th["grid"][3], linewidth=0.8)
    axlabel(Z, th, x="Time (UTC)")

    def hx(tmin):
        return (tmin / 1440.0 - z0) * 24

    def mark(tmin, label, ytxt, ha, dot_col, dx, fw="normal"):
        i = int(np.argmin(np.abs(m - tmin)))
        x = hx(tmin)
        Z.plot([x, x], [ratio[i], ytxt], color=th["muted"], lw=0.9, zorder=2)
        Z.plot([x], [ratio[i]], "o", ms=8.5, mfc=dot_col, mec=th["bg"], mew=1.6, ls="none", zorder=6)
        if label:
            Z.text(x + dx, ytxt, label, color=th["text"], fontsize=FS_TXT, fontweight=fw, ha=ha, va="center")

    mark(S["t_alert"], "NOAA S1 alert 16:45", 4.0, "left", th["text"], 0.2)
    mark(S["t_rise"], "ISS dose rises 04:15", 5.2, "right", th["text"], -0.2)
    mark(S["t_warn"], "first Warning 05:52 (2.0x)", 9.5, "right", th["warning"], -0.2, "bold")
    mark(S["t_peak"], "", 16.0, "left", th["text"], 0)
    Z.text(23.9, 19.5, f"peak {S['peak']:.1f}x 09:51", color=th["text"], fontsize=FS_TXT, fontweight="bold", ha="right", va="center")
    for j, ln in enumerate(("Earth's magnetic field shields the ISS:", "its dose rose only on high-latitude passes.",
                            "The detector warned 97 min after that rise.", "Sept 10: X8.2 flare 16:06, protons 16:25;",
                            "NOAA S1 = official solar radiation alert.")):
        Z.text(0.2, 66 / (1.45 ** j), ln, color=th["text"] if j < 3 else th["muted"], fontsize=FS_TXT, ha="left", va="center")
    cv.save(name)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fonts", help="directory holding SpaceMono-Regular.ttf and SpaceMono-Bold.ttf")
    args = ap.parse_args()
    fam = setup_fonts(args.fonts)
    crew, rad, video = load_data()
    B = compute_blood(crew, video)
    S = compute_storm(rad)
    print(f"font: {fam}")
    print(f"MCV mean z at R+1 {B['mean_z_r1']:.3f}; recovery max {B['recovery_max']:.3f} (n={len(B['recovery'])})")
    print(f"crossings { {t: v[1] for t, v in B['crossings'].items()} } of { {t: v[0] for t, v in B['crossings'].items()} }")
    print(f"storm: baseline {S['base']:.4f}, pre-alert max {S['pre_max']:.3f}, peak {S['peak']:.2f}, "
          f"first warning at minute {S['t_warn']:.0f} (ratio {S['ratio'][S['i_warn']]:.2f})")
    for tname, th in THEMES.items():
        fig1(th, f"fig1-own-range-{tname}.png", B)
        fig2(th, f"fig2-mcv-two-questions-{tname}.png", B)
        fig3(th, f"fig3-confirmation-{tname}.png", B)
        fig4(th, f"fig4-storm-{tname}.png", S)
    print("all reference numbers matched; wrote 8 PNGs to", OUT)


if __name__ == "__main__":
    main()
