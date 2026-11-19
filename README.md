# Match Cut · Shasta Lake
A small, offline prototype for a reverse search of satellite-observed landscape changes. Start with a Shasta Lake refill, find a similar shoreline history somewhere else, and check it against independent storage measurements.

## Run
Open `index.html` in a browser, or run `python -m http.server 8000` in this directory and visit http://localhost:8000. All images, observations, and code are included. Run `node --test test.cjs` for the ranking checks.

## Try it
1. Wipe between Landsat images from November 18, 2022 and May 29, 2023. NASA reports Shasta was 31% and 98% full on those dates.
2. Pick a start month and a 4-, 7-, or 10-month window. The two Landsat photographs illustrate the opening story and stay fixed. The search runs on monthly satellite-derived area measurements from 2010–2024.
3. Inspect a match. Monthly area and gauge storage are each expressed as percentage change since the first month of their own window. Expand the observation table to inspect km² and acre-feet.
4. Select **Show most misleading match** to see the largest gauge mismatch among the ten closest disjoint area matches with complete gauge records. Visually similar changes can coincide with different storage histories. Reservoir geometry is one possible explanation. This prototype does not establish cause.

## Method
For every complete candidate window on a different reservoir, compute the root mean square difference between the two normalized area sequences in percentage points. The ten lowest-error nonoverlapping windows are retained greedily, in order of area similarity. Gauge data enter only after ranking. An incomplete area window cannot qualify. Missing storage prevents a gauge score. Area and storage aggregates can represent different days within a month. The two archival Landsat images do not enter the score.

This milestone implements the surface-area baseline. Comparing OlmoEarth against this baseline on held-out reservoirs and providing a satellite filmstrip for every matched date are follow-on experiments.

## Data and reproduction
- Monthly satellite surface area from **Global Water Watch** (Deltares, WWF, WRI), preserved by J. Schellekens. [Archive release](https://doi.org/10.5281/zenodo.24130434), [Donchyts et al., 2022, method paper](https://doi.org/10.1038/s41598-022-17074-6). The area subset is redistributed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Changes include station selection, clipping dates and conversion from square meters to square kilometers. No boundary geometries are redistributed.
- Gauge source: California Department of Water Resources, [CDEC](https://cdec.water.ca.gov/), monthly storage, sensor 15, in acre-feet. A source snapshot is included in `data/cdec-storage.csv`. Station IDs and satellite archive IDs are in `data/stations.json`.
- Images by Lauren Dauphin, NASA Earth Observatory, using USGS Landsat data. [California Reservoir Rebound](https://science.nasa.gov/earth/earth-observatory/california-reservoir-rebound-151422/). NASA's percentages are day-specific and distinct from the monthly observations.
- To rebuild `data/observations.js`, download `gww_reservoir_timeseries.nc` from the archive release above (MD5 `a72a720b6a46b8dd0a786752c2f44165`). In Python 3.10+ install `numpy` and `netCDF4`, then run `python scripts/build.py /path/to/gww_reservoir_timeseries.nc`.

## One result to reproduce
Choose November 2022 and seven months. The second-ranked surface-area match is Don Pedro, October 2015 through April 2016. Shasta's visible area grew about 62%, and Don Pedro's grew about 61%. The corresponding storage increases were about 219% and 112% relative to each window's first month. These figures describe the observed divergence and are not estimates of basin depth.
