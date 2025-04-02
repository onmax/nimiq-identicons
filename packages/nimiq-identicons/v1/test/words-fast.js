const crypto = require('node:crypto')
const EventEmitter = require('node:events')
const { name, chaosHash } = require('../')

const TAG = 'words-iterator-fast'

let totalIterations
if (process.env.ITERATIONS) {
  totalIterations = Number.parseInt(process.env.ITERATIONS)
}
else {
  totalIterations = 50000
}

const events = new EventEmitter()

function toBase32(buf) {
  const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVXY'
  let shift = 3; let carry = 0; let byte; let symbol; let i; let res = ''

  for (i = 0; i < buf.length; i++) {
    byte = buf[i]
    symbol = carry | (byte >> shift)
    res += alphabet[symbol & 0x1F]

    if (shift > 5) {
      shift -= 5
      symbol = byte >> shift
      res += alphabet[symbol & 0x1F]
    }

    shift = 5 - shift
    carry = byte << shift
    shift = 8 - shift
  }

  if (shift !== 3) {
    res += alphabet[carry & 0x1F]
  }

  while (res.length % 8 !== 0 && alphabet.length === 33) {
    res += alphabet[32]
  }

  return res
}

function _ibanCheck(str) {
  const num = str.split('').map((c) => {
    const code = c.toUpperCase().charCodeAt(0)
    return code >= 48 && code <= 57 ? c : (code - 55).toString()
  }).join('')
  let tmp = ''

  for (let i = 0; i < Math.ceil(num.length / 6); i++) {
    tmp = (Number.parseInt(tmp + num.substr(i * 6, 6)) % 97).toString()
  }

  return Number.parseInt(tmp)
}

function newAddress() {
  const base32 = toBase32(crypto.randomBytes(20))
  // eslint-disable-next-line prefer-template
  const check = ('00' + (98 - _ibanCheck(base32 + 'NQ00'))).slice(-2)
  let res = `NQ${check}${base32}`
  res = res.replace(/.{4}/g, '$& ').trim()
  return res
}

function* iterString(count) {
  for (let i = 0; i < count; i++)
    yield newAddress()
}

const stats = {
  countByIterations: new Int32Array(101),
  fails: [],
}

let i = 0

function printResults() {
  console.info(TAG, `Done, ${i} Iterations.`)
  console.info(TAG, 'Iterations:')
  for (const i in stats.countByIterations) {
    const x = stats.countByIterations[i]
    if (x == 0)
      continue
    console.info(TAG, ` - ${i}: ${x}`)
  }
}

process.on('SIGINT', () => {
  console.log('Interrupted')
  printResults()
  process.exit(0)
})

async function iterate() {
  for (const preImage of iterString(totalIterations)) {
    let res
    try {
      res = name(preImage)
    }
    catch (e) {
      const hash = chaosHash(preImage)
      console.error(TAG, `EXCEPTION for pre-image ${preImage}`)
      console.error(TAG, `   Hash: ${hash}`)
      console.error(TAG, `   Accent: ${hash[11]}`)
      console.error(e)
      continue
    }
    stats.countByIterations[res[2]]++
    if (res[2] == 100) {
      stats.fails.push(({
        preImage,
        result: res,
      }))
    }

    if (i % 8192 == 0) {
      console.log(TAG, `${i} of ${totalIterations} (${(i / totalIterations * 100).toFixed(2)} %)`)
      // Yield to scheduler
      await new Promise(resolve => setTimeout(resolve))
    }

    i++
  }
  events.emit('done')
}

iterate()

events.on('done', () => printResults())
