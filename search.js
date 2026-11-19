/* Month positions are on a fixed calendar. A null observation breaks a window. */
function trajectory(rows, start, length, field) {
  const window = rows.slice(start, start + length)
  if (window.length !== length || window.some(r => !(r[field] > 0))) return null
  return window.map(r => 100 * (r[field] / window[0][field] - 1))
}

function distance(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0) / a.length)
}

function search(series, start, length) {
  const query = trajectory(series.SHA, start, length, 1)
  if (!query) return []
  const candidates = []
  for (const [station, rows] of Object.entries(series)) {
    if (station === 'SHA') continue
    for (let i = 0; i <= rows.length - length; i++) {
      const area = trajectory(rows, i, length, 1)
      if (area) candidates.push({station, i, area, error: distance(query, area)})
    }
  }
  candidates.sort((a, b) => a.error - b.error)
  // Adjacent starts can represent the same physical event. Keep disjoint windows.
  const unique = []
  for (const c of candidates) {
    if (unique.some(m => m.station === c.station && Math.abs(m.i - c.i) < length)) continue
    unique.push(c)
    if (unique.length === 10) break
  }
  const gauge = trajectory(series.SHA, start, length, 2)
  return unique.map(c => {
    const storage = trajectory(series[c.station], c.i, length, 2)
    return {...c, storage, gaugeError: gauge && storage ? distance(gauge, storage) : null}
  })
}
if (typeof module !== 'undefined') module.exports = {search, trajectory, distance}
