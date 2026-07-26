import test from 'node:test'
import assert from 'node:assert/strict'

import {
  floatingDateKey,
  formatFloatingDateTime,
  parseFloatingDateTime,
  toDateTimeLocal,
} from './utils.js'

test('deadline parsing ignores an offset without shifting the written time', () => {
  const deadline = parseFloatingDateTime('2026-07-01T17:00:00+08:00')

  assert.equal(deadline.toISOString(), '2026-07-01T17:00:00.000Z')
  assert.equal(floatingDateKey('2026-07-01T17:00:00-05:00'), '2026-07-01')
})

test('deadline controls and display preserve the same wall-clock fields', () => {
  const source = '2026-07-01T17:00:00+08:00'

  assert.equal(toDateTimeLocal(source), '2026-07-01T17:00')
  assert.match(formatFloatingDateTime(source), /1 Jul 2026, 05:00 pm/i)
})

test('invalid floating deadlines are rejected by frontend helpers', () => {
  assert.equal(parseFloatingDateTime('2026-02-30T17:00:00'), null)
  assert.equal(toDateTimeLocal('not-a-deadline'), '')
})
