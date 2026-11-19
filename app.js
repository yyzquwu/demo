const $ = id => document.getElementById(id)
const series = ARCHIVE.series
const names = ARCHIVE.names
let hits = []
const start = () => Number($('start').value)
const windowMonths = () => Number($('months').value)
const fixed = n => n.toFixed(1)
function chart(label, a, b) {
  if (!a || !b) return '<div class="chart"><h4>' + label + '</h4><p>Incomplete gauge record in this window.</p></div>'
  const lo = Math.min(0, ...a, ...b), hi = Math.max(1, ...a, ...b)
  const y = v => 93 - 79 * (v - lo) / (hi - lo)
  const points = arr => arr.map((v, i) => (12 + 576 * i / (arr.length - 1)) + ',' + y(v)).join(' ')
  return '<div class="chart"><h4>' + label + '</h4><small>Change from first month · range ' + fixed(lo) + '% to ' + fixed(hi) + '%</small><svg role="img" aria-label="' + label + ' trend comparison" viewBox="0 0 600 105" preserveAspectRatio="none"><path d="M12 ' + y(0) + ' H588" stroke="#a5b6ac"/>' + [a,b].map((s,i) => '<polyline fill="none" stroke="' + ['#096963','#ac491f'][i] + '" stroke-width="3" vector-effect="non-scaling-stroke" points="' + points(s) + '"/>').join('') + '</svg><small>Final changes · Shasta ' + fixed(a.at(-1)) + '% / match ' + fixed(b.at(-1)) + '%</small></div>'
}
function show(index) {
  const c = hits[index]
  if (!c) return
  const rows = series[c.station], n = windowMonths(), i = start()
  $('result').value = index
  $('rank').textContent = 'AREA MATCH ' + (index + 1) + ' / ' + hits.length
  $('title').textContent = 'Shasta × ' + names[c.station]
  $('details').textContent = 'Shasta ' + series.SHA[i][0] + ' to ' + series.SHA[i+n-1][0] + ' · ' + names[c.station] + ' ' + rows[c.i][0] + ' to ' + rows[c.i+n-1][0] + '. Area mismatch ' + fixed(c.error) + ' percentage points RMS. ' + (c.gaugeError === null ? 'Storage comparison unavailable.' : 'Storage mismatch ' + fixed(c.gaugeError) + ' points RMS.')
  $('values').replaceChildren(...series.SHA.slice(i, i+n).map((row, offset) => {
    const tr = document.createElement('tr')
    for (const value of [...row, ...rows[c.i+offset]]) {
      const td = tr.insertCell()
      td.textContent = typeof value === 'number' ? value.toLocaleString('en-US', {maximumFractionDigits:2}) : value ?? 'Missing'
    }
    return tr
  }))
  $('charts').innerHTML = chart('Satellite surface area',trajectory(series.SHA,i,n,1),c.area) + chart('Gauge storage',trajectory(series.SHA,i,n,2),c.storage)
}
function rank() {
  hits = search(series,start(),windowMonths())
  $('result').replaceChildren(...hits.map((h,i) => new Option((i+1) + ' · ' + names[h.station] + ' · ' + series[h.station][h.i][0], i)))
  $('worst').disabled = !hits.some(h => h.gaugeError !== null)
  if (hits.length) show(0)
  else { $('title').textContent = 'No complete candidate windows'; $('charts').replaceChildren(); $('values').replaceChildren(); $('details').textContent = ''; $('rank').textContent = '' }
}
function windows() {
  const preferred = $('start').value || String(series.SHA.findIndex(r => r[0] === '2022-11'))
  $('start').replaceChildren(...series.SHA.flatMap((r,i) => trajectory(series.SHA,i,windowMonths(),1) ? [new Option(r[0],i)] : []))
  if ([...$('start').options].some(o => o.value === preferred)) $('start').value = preferred
  rank()
}
$('wipe').oninput = e => { const x=e.target.value; $('before').style.clipPath='inset(0 '+(100-x)+'% 0 0)'; $('divider').style.left=x+'%' }
$('worst').onclick = () => {
  const comparable = hits.filter(h => h.gaugeError !== null)
  const worst = comparable.reduce((max,h) => h.gaugeError > max.gaugeError ? h : max)
  show(hits.indexOf(worst))
  $('rank').textContent += ' · LARGEST GAUGE MISMATCH AMONG THESE MATCHES'
}
$('result').onchange = () => show(Number($('result').value))
$('start').onchange = rank
$('months').onchange = windows
windows()
