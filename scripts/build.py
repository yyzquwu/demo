"""Build the offline browser fixture from a local GWW NetCDF and CDEC CSV."""
import argparse
import csv
import json
from pathlib import Path

from netCDF4 import Dataset, num2date
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def build(archive):
    stations = json.loads((ROOT / "data/stations.json").read_text())
    gauge = {}
    with (ROOT / "data/cdec-storage.csv").open() as stream:
        for row in csv.DictReader(stream):
            date = row["DATE TIME"]
            try:
                value = float(row["VALUE"])
            except ValueError:
                continue
            if row["UNITS"] == "AF" and value > 0:
                gauge[row["STATION_ID"], date[:4] + "-" + date[4:6]] = value

    series = {}
    with Dataset(archive) as ds:
        ids = {int(v): i for i, v in enumerate(ds["reservoir"][:])}
        time = ds["time"]
        dates = [d.strftime("%Y-%m") for d in num2date(time[:], time.units)]
        for station, meta in stations.items():
            values = ds["surface_water_area_monthly"][ids[meta["gww_id"]], :]
            rows = []
            for date, area in zip(dates, values, strict=True):
                if "2010-01" <= date <= "2024-12":
                    km2 = None if np.ma.is_masked(area) or not np.isfinite(area) or area <= 0 else round(float(area) / 1e6, 4)
                    rows.append([date, km2, gauge.get((station, date))])
            if len(rows) != 180 or len({r[0] for r in rows}) != 180:
                raise ValueError(f"Broken monthly calendar for {station}")
            series[station] = rows
    payload = {"names": {s: m["name"] for s, m in stations.items()}, "series": series}
    (ROOT / "data/observations.js").write_text("const ARCHIVE = " + json.dumps(payload, separators=(",", ":"), allow_nan=False) + ";\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    build(parser.parse_args().archive)
