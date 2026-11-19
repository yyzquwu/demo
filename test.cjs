const test = require('node:test')
const assert = require('node:assert/strict')
const { search, trajectory } = require('./search')
const rows = (a, b) => a.map((x,i) => [i, x, b[i]])
test('ranking compares areas only and excludes the query lake', () => {
  const series = {SHA: rows([1,2,3],[5,6,7]), A: rows([2,4,6],[2,9,20]), B: rows([1,2,4],[5,6,7])}
  const hits = search(series,0,3)
  assert.deepEqual(hits.map(h => h.station), ['A','B'])
  assert.equal(hits[0].error, 0)
  assert.ok(hits[0].gaugeError > hits[1].gaugeError)
})
test('gaps invalidate area windows and preserve missing gauge evaluations', () => {
  const s = {SHA: rows([2,3,4],[1,2,3]), A: rows([4,6,8],[1,null,2])}
  assert.equal(search(s,0,3)[0].gaugeError,null)
  assert.equal(trajectory(s.A,1,3,1),null)
  s.A[1][1] = null
  assert.deepEqual(search(s,0,3),[])
})
test('Shasta refill retrieves real area analogues with independent gauge disagreement', () => {
  const fs = require('node:fs'), vm = require('node:vm')
  const data = vm.runInNewContext(fs.readFileSync(__dirname + '/data/observations.js','utf8') + '; ARCHIVE')
  const i = data.series.SHA.findIndex(row => row[0] === '2022-11')
  const hits = search(data.series, i, 7)
  assert.equal(hits.length, 10)
  assert.equal(hits[0].station, 'FOL')
  const match = hits.find(h => h.station === 'DNP')
  assert.equal(data.series.DNP[match.i][0], '2015-10')
  assert.ok(match.error < 6 && match.gaugeError > 80)
  for (const rows of Object.values(data.series)) assert.equal(rows.length, 180)
})
