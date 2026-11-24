import test from 'node:test'
import assert from 'node:assert/strict'
import { formatReceivedAgo } from './receivedAgo.js'

test('formatReceivedAgo handles null/NaN, skew clamping, and all time buckets', () => {
  assert.equal(formatReceivedAgo(null, 1000000), null)
  assert.equal(formatReceivedAgo(undefined, 1000000), null)
  assert.equal(formatReceivedAgo('bad', 1000000), null)

  // Future timestamp (clock skew) clamps to 0 -> "Received just now"
  assert.equal(formatReceivedAgo(1050000, 1000000), 'Received just now')
  assert.equal(formatReceivedAgo(1000000 - 45000, 1000000), 'Received just now')

  // Minutes
  assert.equal(formatReceivedAgo(1000000 - 60000, 1000000), 'Received 1 min ago')
  assert.equal(formatReceivedAgo(1000000 - 15 * 60000, 1000000), 'Received 15 min ago')
  assert.equal(formatReceivedAgo(1000000 - 59 * 60000, 1000000), 'Received 59 min ago')

  // Hours
  assert.equal(formatReceivedAgo(100000000 - 60 * 60000, 100000000), 'Received 1 hr ago')
  assert.equal(formatReceivedAgo(100000000 - 5 * 60 * 60000, 100000000), 'Received 5 hr ago')

  // Days
  assert.equal(formatReceivedAgo(1000000000 - 24 * 60 * 60000, 1000000000), 'Received 1 d ago')
  assert.equal(formatReceivedAgo(1000000000 - 3 * 24 * 60 * 60000, 1000000000), 'Received 3 d ago')
})
