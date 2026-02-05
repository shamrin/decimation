<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://placehold.co/600x400/151b23/ffffff?text=Dark+Mode+Active">
  <source media="(prefers-color-scheme: light)" srcset="https://placehold.co/600x400/ffffff/111827?text=Light+Mode+Active">
  <img alt="Themed Screenshot Placeholder" src="https://placehold.co/600x400/ffffff/111827?text=Light+Mode+Active">
</picture>

# decimation

Natural math notation library for JavaScript decimals, using tagged templates:

```js
import { math } from 'decimation/decimal.js'

math`${a} + ${b} * 2` // a.add(b.mul(2))
```

## Motivation

JavaScript decimal libraries require hard to follow method chaining. For example:

<!-- prettier-ignore-start -->
```js
function compoundInterest(principal, rate, n, t) {
  return principal.mul(
    new Decimal(1).add(
      new Decimal(rate).div(n)
    ).pow(
      new Decimal(n).mul(t)
    )
  )
}
```
<!-- prettier-ignore-end -->

Same example in `decimation`:

```js
function compoundInterest(principal, rate, n, t) {
  return math`${principal} * (1 + ${rate} / ${n}) ** (${n} * ${t})`
}
```

Decimal requires methods like `.gt()` to compare, and `sum()` is [not ergonomic][dsum]:

<!-- prettier-ignore-start -->
```js
const isOver = Decimal.sum(0, ...items)
  .mul(new Decimal(1).add(taxRate))
  .gt(budget)
```
<!-- prettier-ignore-end -->

Same example in `decimation`:

```js
const isOver = is`sum(${items}) * (1 + ${taxRate}) > ${budget}`
```

## Install

```console
npm install decimation
```

## Import

For [decimal.js][]:

```js
import { is, math } from 'decimation/decimal.js'
```

For [Prisma Decimal][]:

```js
import { is, math } from 'decimation/prisma'
```

For a custom library:

```js
import { create } from 'decimation'
import { MyDecimal } from './my-decimal.js'
const { math, is } = create(MyDecimal)
```

## Usage

```js
// Same as a.add(b.mul(c))
const total = math`${a} + ${b} * ${c}`

// Same as a.add(b.mul(2)).gt(c.sub(20))
if (is`${a} + ${b} * 2 > ${c} - 20`) { ... }
```

## Features

- **Operator overload**: Standard math operators mapping to Decimal methods. E.g., `+` to `.add()`, `*` to `.mul()`.
- **Automatic casting**: Literals, strings and numbers are automatically cast to the `Decimal`.
- **Type safety**: `math` returns `Decimal`; `is` returns `boolean`.
- **Low overhead**: Templates are parsed once into an Abstract Syntax Tree and cached to `WeakMap`. Even inside loops:
  ```js
  const subtotals = items.map(item =>
    // parsed only once, because string literal does not change
    math`sum(${item.prices}) * (1 + ${tax})`.toDecimalPlaces(2)
  )
  ```

## Reference

[Tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates):

- `math` evaluates an expression and returns a `Decimal`.
- `is` evaluates an expression and returns a boolean. Requires top-level comparison operator.

Function:

- `create(D)` returns `{ math, is }` bound to any Decimal.js-compatible constructor. For example:
  ```js
  import { create } from 'decimation'
  import MyDecimal from './my-decimal.js'
  const { math, is } = create(MyDecimal)
  ```

Operators available within templates, from highest to lowest precedence:
| Operator | Associativity |
| -------------------------------- | ------------- |
| `**` | Right |
| `*`, `/` | Left |
| `+`, `-` | Left |
| `==`, `!=`, `<`, `>`, `<=`, `>=` | Left |

Functions available within templates:

- `abs(x)`: absolute value
- `ceil(x)`: round up to the nearest integer
- `floor(x)`: round down to the nearest integer
- `round(x)`: round to the nearest integer
- `clamp(x, min, max)`: restrict `x` between `min` and `max`
- `sum(array)`: sum of all elements in `array`

## Development

```bash
npm install

# test and lint
npm test
npm run typecheck
npm run lint
npm run format:check

# publish
npm publish
```

## Roadmap

* Expression and argument types linter
* Refactoring tool

[decimal.js]: https://www.npmjs.com/package/decimal.js
[Prisma Decimal]: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types#working-with-decimal
[dsum]: https://github.com/MikeMcl/decimal.js/issues/207
