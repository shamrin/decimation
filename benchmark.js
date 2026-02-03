import Decimal from 'decimal.js'
import { math } from './src/decimal.js'

const ITERATIONS = 100000
const WARMUP = 10000

const testData = Array.from({ length: ITERATIONS }, () => ({
  a: new Decimal(Math.random() * 100),
  b: new Decimal(Math.random() * 100),
  c: new Decimal(Math.random() * 10),
  d: new Decimal(Math.random() * 50),
  e: new Decimal(Math.random() * 5 + 1),
  f: new Decimal((Math.random() - 0.5) * 100),
}))

function runBench(name, fn) {
  // 1. Warm-up: Let JIT compile the hot paths
  for (let i = 0; i < WARMUP; i++) {
    const { a, b, c, d, e, f } = testData[i % testData.length]
    fn(a, b, c, d, e, f)
  }

  // 2. Measure
  let totalSum = new Decimal(0)
  const start = performance.now()
  for (let i = 0; i < ITERATIONS; i++) {
    const { a, b, c, d, e, f } = testData[i]
    totalSum = totalSum.add(fn(a, b, c, d, e, f))
  }
  const end = performance.now()

  const time = end - start
  console.log(`${name.padEnd(20)}: ${time.toFixed(2)}ms (Sum: ${totalSum.toFixed(2)})`)
  return time
}

console.log(`Running benchmarks (${ITERATIONS} iterations, ${WARMUP} warmup)...\n`)

const result = runBench('decimation (AST cache)', (a, b, c, d, e, f) => {
  return math`(${a} + ${b}) * ${c} - ${d} / ${e} + abs(${f}) ** ${2}`
})

const baseline = runBench('Baseline (manual)', (a, b, c, d, e, f) => {
  return a.add(b).mul(c).sub(d.div(e)).add(f.abs().pow(2))
})

console.log(
  `Manual Advantage:   ${((1 - baseline / result) * 100).toFixed(2)}% faster than decimation`
)
