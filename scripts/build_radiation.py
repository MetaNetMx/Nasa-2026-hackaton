"""Build app/public/data/radiation.json from the ISS TEPC dose record (NASA CDAWeb HAPI).

Window: 2017-09-04 to 2017-09-16, which contains the 2017-09-10 solar particle event.
Dataset: ISS_DOSANL_TEPC (https://data.nasa.gov/dataset/iss-tissue-equivalent-proportional-counter-tepc-dose-analyzer-10-s-data-61b24)
"""
import csv, json, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data/raw/datanasa/tepc_sep2017.csv"
OUT = ROOT / "app/public/data/radiation.json"
URL = ("https://cdaweb.gsfc.nasa.gov/hapi/data?id=ISS_DOSANL_TEPC"
       "&time.min=2017-09-04T00:00:00Z&time.max=2017-09-16T00:00:00Z&format=csv")


def main():
    if not CACHE.exists():
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
        CACHE.write_bytes(urllib.request.urlopen(req, timeout=180).read())
    t0 = datetime(2017, 9, 4, tzinfo=timezone.utc)
    mins, rate, lat, lon, daily = [], [], [], [], {}
    for t, _dose, deq, interval, lo, la, _alt in csv.reader(open(CACHE)):
        ts = datetime.fromisoformat(t.replace("Z", "+00:00"))
        r = float(deq)  # uSv/min, dose equivalent (ICRP-60)
        mins.append(int((ts - t0).total_seconds() // 60))
        rate.append(round(r, 3))
        lat.append(round(float(la), 1))
        lon.append(round(float(lo), 1))
        daily[t[:10]] = daily.get(t[:10], 0.0) + r * float(interval)
    out = {
        "source": {
            "instrument": "ISS Tissue-Equivalent Proportional Counter (TEPC), Dose Analyzer",
            "dataset": "ISS_DOSANL_TEPC via NASA CDAWeb HAPI",
            "url": "https://data.nasa.gov/dataset/iss-tissue-equivalent-proportional-counter-tepc-dose-analyzer-10-s-data-61b24",
            "unit": "µSv/min dose equivalent (ICRP-60)",
            "start": "2017-09-04T00:00:00Z",
        },
        "min": mins, "rate": rate, "lat": lat, "lon": lon,
        "dailyMsv": {k: round(v / 1000, 3) for k, v in sorted(daily.items())},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"wrote {OUT} points={len(rate)} daily={out['dailyMsv']}")


if __name__ == "__main__":
    main()
