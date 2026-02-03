import { test, describe } from 'node:test'
import assert from 'node:assert'
import { math, is } from '../src/decimal.js'

describe(`math template tag`, () => {
  test('basic addition', () => {
    const result = math`${1} + ${2}`
    assert.strictEqual(result.toString(), '3')
  })

  test('basic subtraction', () => {
    const result = math`${5} - ${3}`
    assert.strictEqual(result.toString(), '2')
  })

  test('basic multiplication', () => {
    const result = math`${4} * ${3}`
    assert.strictEqual(result.toString(), '12')
  })

  test('basic division', () => {
    const result = math`${10} / ${2}`
    assert.strictEqual(result.toString(), '5')
  })

  test('operator precedence: multiplication before addition', () => {
    const result = math`${2} + ${3} * ${4}`
    assert.strictEqual(result.toString(), '14')
  })

  test('operator precedence: division before subtraction', () => {
    const result = math`${10} - ${6} / ${2}`
    assert.strictEqual(result.toString(), '7')
  })

  test('parentheses override precedence', () => {
    const result = math`(${2} + ${3}) * ${4}`
    assert.strictEqual(result.toString(), '20')
  })

  test('nested parentheses', () => {
    const result = math`((${2} + ${3}) * ${4}) / ${5}`
    assert.strictEqual(result.toString(), '4')
  })

  test('complex expression', () => {
    const result = math`${1} + ${2} * ${3} - ${4} / ${2}`
    assert.strictEqual(result.toString(), '5')
  })

  test('left-to-right for same precedence', () => {
    const result = math`${10} / ${2} * ${3}`
    assert.strictEqual(result.toString(), '15')
  })

  test('works with Decimal values', () => {
    const a = math`${1}`
    const b = math`${2}`
    const result = math`${a} + ${b}`
    assert.strictEqual(result.toString(), '3')
  })

  test('exponentiation operator **', () => {
    const result = math`${2} ** ${3}`
    assert.strictEqual(result.toString(), '8')
  })

  test('exponentiation has higher precedence than multiplication', () => {
    const result = math`${2} * ${3} ** ${2}`
    assert.strictEqual(result.toString(), '18')
  })

  test('exponentiation is right-associative', () => {
    const result = math`${2} ** ${3} ** ${2}`
    assert.strictEqual(result.toString(), '512')
  })

  test('comparison operators throw error in math', () => {
    assert.throws(
      () => math`${1} < ${2}`,
      /Comparison operator '<' can only be used in 'is' template/
    )
  })

  test('function: abs()', () => {
    const result = math`abs(${-5})`
    assert.strictEqual(result.toString(), '5')
  })

  test('function: ceil()', () => {
    const result = math`ceil(${3.2})`
    assert.strictEqual(result.toString(), '4')
  })

  test('function: floor()', () => {
    const result = math`floor(${3.9})`
    assert.strictEqual(result.toString(), '3')
  })

  test('function: round()', () => {
    const result = math`round(${3.6})`
    assert.strictEqual(result.toString(), '4')
  })

  test('function: clamp()', () => {
    const result = math`clamp(${15}, ${0}, ${10})`
    assert.strictEqual(result.toString(), '10')
  })

  test('function in expression', () => {
    const result = math`${2} + abs(${-3})`
    assert.strictEqual(result.toString(), '5')
  })

  test('nested functions', () => {
    const result = math`abs(floor(${-3.7}))`
    assert.strictEqual(result.toString(), '4')
  })

  test('complex expression with all features', () => {
    const result = math`(${2} + ${3}) * abs(${-2}) ** ${2} - floor(${7.8}) / ${2}`
    assert.strictEqual(result.toString(), '16.5')
  })

  test('function: sum() with array', () => {
    const result = math`sum(${[1, 2, 3, 4, 5]})`
    assert.strictEqual(result.toString(), '15')
  })

  test('function: sum() with Decimal array', () => {
    const a = math`${1}`
    const b = math`${2}`
    const c = math`${3}`
    const result = math`sum(${[a, b, c]})`
    assert.strictEqual(result.toString(), '6')
  })

  test('function: sum() with empty array', () => {
    const result = math`sum(${[]})`
    assert.strictEqual(result.toString(), '0')
  })

  test('function: sum() in expression', () => {
    const result = math`${10} + sum(${[1, 2, 3]})`
    assert.strictEqual(result.toString(), '16')
  })
})

describe(`is template tag`, () => {
  test('comparison operator: <', () => {
    assert.strictEqual(is`${1} < ${2}`, true)
    assert.strictEqual(is`${2} < ${1}`, false)
  })

  test('comparison operator: <=', () => {
    assert.strictEqual(is`${1} <= ${2}`, true)
    assert.strictEqual(is`${2} <= ${2}`, true)
    assert.strictEqual(is`${3} <= ${2}`, false)
  })

  test('comparison operator: ==', () => {
    assert.strictEqual(is`${2} == ${2}`, true)
    assert.strictEqual(is`${2} == ${3}`, false)
  })

  test('comparison operator: >', () => {
    assert.strictEqual(is`${2} > ${1}`, true)
    assert.strictEqual(is`${1} > ${2}`, false)
  })

  test('comparison operator: >=', () => {
    assert.strictEqual(is`${2} >= ${1}`, true)
    assert.strictEqual(is`${2} >= ${2}`, true)
    assert.strictEqual(is`${1} >= ${2}`, false)
  })

  test('comparison operator: !=', () => {
    assert.strictEqual(is`${2} != ${3}`, true)
    assert.strictEqual(is`${2} != ${2}`, false)
  })

  test('comparison with math expression', () => {
    assert.strictEqual(is`${2} + ${3} > ${4}`, true)
    assert.strictEqual(is`${2} * ${3} == ${6}`, true)
  })

  test('comparison with functions', () => {
    assert.strictEqual(is`abs(${-5}) > ${3}`, true)
    assert.strictEqual(is`floor(${3.7}) == ${3}`, true)
  })

  test('arithmetic operators work in is', () => {
    assert.strictEqual(is`${2} + ${2} == ${4}`, true)
    assert.strictEqual(is`${10} - ${3} > ${5}`, true)
  })

  test('parentheses for grouping arithmetic are allowed', () => {
    assert.strictEqual(is`(${2} + ${3}) * ${2} == ${10}`, true)
  })

  test('comparison in nested expression throws error', () => {
    assert.throws(() => is`(${1} < ${2}) == ${1}`, /can only be used at the top level/)
  })

  test('missing comparison throws error', () => {
    assert.throws(() => is`${1} + ${2}`, /'is' template requires a comparison operator/)
  })

  test('chained comparisons throw error', () => {
    assert.throws(() => is`${1} < ${2} < ${3}`, /Chained comparisons are not supported/)
  })

  test('sum() function works in is template', () => {
    assert.strictEqual(is`sum(${[1, 2, 3]}) > ${5}`, true)
    assert.strictEqual(is`sum(${[1, 2, 3]}) == ${6}`, true)
  })

  test('unary -', () => {
    assert.strictEqual(math`-10`.toString(), '-10')
    assert.strictEqual(math`-${10}`.toString(), '-10')
    assert.strictEqual(math`-${-10}`.toString(), '10')
  })

  test('unary +', () => {
    assert.strictEqual(math`+10`.toString(), '10')
    assert.strictEqual(math`+${10}`.toString(), '10')
  })

  test('1 + 2.5', () => {
    assert.strictEqual(math`1+2.5`.toString(), '3.5')
  })

  test('formula with a constant', () => {
    const principal = 1
    const rate = 2
    const n = 3
    const t = 4
    assert.strictEqual(
      math`${principal} * (1 + ${rate} / ${n}) ** (${n} * ${t})`.toFixed(2),
      '459.39'
    )
  })
})
