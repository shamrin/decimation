/** @import {Operator, Token, ASTNode, DecimalConstructor, DecimalInstance, DecimalValue} from './types' */

// Operator precedence (higher number = higher precedence)
/** @type {Readonly<Record<Operator, number>>} */
export const PRECEDENCE = {
  '<': 1,
  '<=': 1,
  '==': 1,
  '>': 1,
  '>=': 1,
  '!=': 1,
  '+': 2,
  '-': 2,
  '*': 3,
  '/': 3,
  '**': 4,
}

// Right-associative operators
export const RIGHT_ASSOC = new Set(['**'])

// Comparison operators (only allowed in 'is' mode)
export const COMPARISON_OPS = new Set(['<', '<=', '==', '>', '>=', '!='])

/**
 * Tokenizes a template string array into tokens
 * @param {TemplateStringsArray} template
 * @returns {Token[]}
 */
export function tokenize(template) {
  /** @type {Token[]} */
  const tokens = []

  for (let i = 0; i < template.length; i++) {
    const str = template[i]

    // Tokenize the string part
    for (let j = 0; j < str.length; j++) {
      const char = str[j]

      if (char === ' ' || char === '\t' || char === '\n') {
        continue // Skip whitespace
      } else if (char === '(') {
        tokens.push({ type: 'LPAREN' })
      } else if (char === ')') {
        tokens.push({ type: 'RPAREN' })
      } else if (char === ',') {
        tokens.push({ type: 'COMMA' })
      } else if (char === '*' && str[j + 1] === '*') {
        tokens.push({ type: 'OPERATOR', value: '**' })
        j++ // Skip next char
      } else if (char === '=' && str[j + 1] === '=') {
        tokens.push({ type: 'OPERATOR', value: '==' })
        j++ // Skip next char
      } else if (char === '!' && str[j + 1] === '=') {
        tokens.push({ type: 'OPERATOR', value: '!=' })
        j++ // Skip next char
      } else if (char === '<' && str[j + 1] === '=') {
        tokens.push({ type: 'OPERATOR', value: '<=' })
        j++ // Skip next char
      } else if (char === '>' && str[j + 1] === '=') {
        tokens.push({ type: 'OPERATOR', value: '>=' })
        j++ // Skip next char
      } else if (char === '<') {
        tokens.push({ type: 'OPERATOR', value: '<' })
      } else if (char === '>') {
        tokens.push({ type: 'OPERATOR', value: '>' })
      } else if (char === '+' || char === '-' || char === '*' || char === '/') {
        tokens.push({ type: 'OPERATOR', value: char })
      } else if (char >= '0' && char <= '9') {
        let num = char
        while (
          j + 1 < str.length &&
          ((str[j + 1] >= '0' && str[j + 1] <= '9') || str[j + 1] === '.')
        ) {
          j++
          num += str[j]
        }
        tokens.push({ type: 'NUMBER', value: num })
      } else if (char >= 'a' && char <= 'z') {
        let name = char
        while (j + 1 < str.length && str[j + 1] >= 'a' && str[j + 1] <= 'z') {
          j++
          name += str[j]
        }
        tokens.push({ type: 'FUNCTION', value: name })
      } else {
        throw new Error(`Unexpected character: ${char}`)
      }
    }

    // Add VALUE token for interpolated value (except after last string)
    if (i < template.length - 1) {
      tokens.push({ type: 'VALUE', value: i })
    }
  }

  tokens.push({ type: 'EOF' })
  return tokens
}

/**
 * Pre-process values: convert to Decimal, keep arrays as-is
 * @param {Array<DecimalValue | DecimalInstance | DecimalInstance[]>} values - Raw values from template
 * @param {DecimalConstructor} DecimalConstructor - Decimal constructor
 * @returns {Array<DecimalInstance | DecimalInstance[]>} Processed values
 */
export function preprocessValues(values, DecimalConstructor) {
  return values.map(val =>
    val instanceof DecimalConstructor ? val : Array.isArray(val) ? val : new DecimalConstructor(val)
  )
}

/**
 * AST parser that builds an abstract syntax tree
 */
class ASTParser {
  /**
   * @param {Token[]} tokens
   * @param {string} mode
   */
  constructor(tokens, mode) {
    this.tokens = tokens
    this.pos = 0
    this.mode = mode // 'math' or 'is'
    this.hasTopLevelComparison = false
  }

  current() {
    return this.tokens[this.pos]
  }

  advance() {
    this.pos++
  }

  /**
   * Parse primary expression and return AST node
   * @returns {ASTNode}
   */
  parsePrimary() {
    const token = this.current()

    if (token.type === 'VALUE') {
      const index = token.value
      this.advance()
      return { type: 'value', index }
    } else if (token.type === 'NUMBER') {
      const value = token.value
      this.advance()
      return { type: 'number', value }
    } else if (token.type === 'FUNCTION') {
      const funcName = token.value
      this.advance() // consume function name

      if (this.current().type !== 'LPAREN') {
        throw new Error(`Expected '(' after function name '${funcName}'`)
      }
      this.advance() // consume '('

      // Parse function arguments
      const args = []
      while (this.current().type !== 'RPAREN') {
        args.push(this.parseExpression(0, false))

        if (this.current().type === 'COMMA') {
          this.advance() // consume ','
        } else if (this.current().type !== 'RPAREN') {
          throw new Error('Expected comma or closing parenthesis in function call')
        }
      }

      this.advance() // consume ')'

      // Validate function at parse time
      const validFunctions = ['abs', 'ceil', 'floor', 'round', 'clamp', 'sum']
      if (!validFunctions.includes(funcName)) {
        throw new Error(`Unknown function: ${funcName}`)
      }

      // Validate argument counts
      if (funcName === 'clamp' && args.length !== 3) {
        throw new Error('clamp() requires 3 arguments: clamp(value, min, max)')
      } else if (funcName !== 'clamp' && args.length !== 1) {
        throw new Error(`${funcName}() requires 1 argument`)
      }

      return { type: 'function', name: funcName, args }
    } else if (token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
      // Handle unary + and -
      const op = token.value
      this.advance() // consume operator
      const operand = this.parsePrimary()
      return { type: 'unary', op, operand }
    } else if (token.type === 'LPAREN') {
      this.advance() // consume '('
      const expr = this.parseExpression(0, false)
      if (this.current().type !== 'RPAREN') {
        throw new Error('Expected closing parenthesis')
      }
      this.advance() // consume ')'
      return expr
    } else {
      throw new Error(`Unexpected token: ${token.type}`)
    }
  }

  /**
   * Parse expression with precedence climbing and return AST node
   * https://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing
   * @param {number} minPrec - Minimum precedence level
   * @param {boolean} isTopLevel - Whether this is the top-level expression
   * @returns {ASTNode}
   */
  parseExpression(minPrec, isTopLevel = true) {
    let left = this.parsePrimary()

    while (true) {
      const token = this.current()
      if (token.type !== 'OPERATOR') break

      const op = token.value
      const prec = PRECEDENCE[op]

      if (prec < minPrec) {
        break
      }

      // Check if comparison operator is used in math mode
      if (COMPARISON_OPS.has(op) && this.mode === 'math') {
        throw new Error(`Comparison operator '${op}' can only be used in 'is' template, not 'math'`)
      }

      // In 'is' mode, enforce comparison restrictions
      if (COMPARISON_OPS.has(op) && this.mode === 'is') {
        if (!isTopLevel) {
          throw new Error(
            `Comparison operator '${op}' can only be used at the top level of 'is' template, not in nested expressions`
          )
        }
        if (this.hasTopLevelComparison) {
          throw new Error(
            `Chained comparisons are not supported. Use multiple 'is' templates: is\`\${a} < \${b}\` && is\`\${b} < \${c}\``
          )
        }
        this.hasTopLevelComparison = true
      }

      this.advance() // consume operator

      const nextMinPrec = RIGHT_ASSOC.has(op) ? prec : prec + 1
      const right = this.parseExpression(nextMinPrec, isTopLevel)

      left = { type: 'binary', op, left, right }
    }

    return left
  }
}

/**
 * Interprets an AST node
 * @param {ASTNode} node - AST node
 * @param {Array<DecimalInstance | DecimalInstance[]>} values - Pre-processed values array
 * @param {DecimalConstructor} Decimal - Decimal constructor
 * @returns {DecimalInstance | DecimalInstance[] | boolean}
 */
function interpret(node, values, Decimal) {
  if (node.type === 'value') {
    return values[node.index]
  } else if (node.type === 'number') {
    return new Decimal(node.value)
  } else if (node.type === 'unary') {
    const operand = interpret(node.operand, values, Decimal)
    assert(operand instanceof Decimal, 'Unary operation operand must be a Decimal instance')
    switch (node.op) {
      case '-':
        return operand.neg()
      case '+':
        return operand
    }
  } else if (node.type === 'binary') {
    const left = interpret(node.left, values, Decimal)
    const right = interpret(node.right, values, Decimal)
    assert(
      left instanceof Decimal && right instanceof Decimal,
      'Binary operation operands must be Decimal instances'
    )

    switch (node.op) {
      case '+':
        return left.add(right)
      case '-':
        return left.sub(right)
      case '*':
        return left.mul(right)
      case '/':
        return left.div(right)
      case '**':
        return left.pow(right)
      case '<':
        return left.lt(right)
      case '<=':
        return left.lte(right)
      case '==':
        return left.eq(right)
      case '>':
        return left.gt(right)
      case '>=':
        return left.gte(right)
      case '!=':
        return !left.eq(right)
    }
  } else if (node.type === 'function') {
    const args = /** @type {DecimalInstance[]} */ (
      node.args.map(arg => interpret(arg, values, Decimal))
    )

    switch (node.name) {
      case 'abs':
        return args[0].abs()
      case 'ceil':
        return args[0].ceil()
      case 'floor':
        return args[0].floor()
      case 'round':
        return args[0].round()
      case 'clamp':
        return args[0].clamp(args[1], args[2])
      case 'sum': {
        const arr = args[0]
        assert(Array.isArray(arr), 'sum() requires an array argument')
        return Decimal.sum(0, ...arr)
      }
      default:
        throw new Error(`Unknown function: ${node.name}`)
    }
  }

  throw new Error(`Unknown node type`)
}

/**
 * Creates math and is functions that cache AST
 * @param {DecimalConstructor} DecimalConstructor
 */
export function create(DecimalConstructor) {
  const mathCache = new WeakMap()
  const isCache = new WeakMap()

  return {
    /**
     * @param {TemplateStringsArray} template
     * @param {...(DecimalValue | DecimalInstance | DecimalInstance[])} values
     * @returns {DecimalInstance}
     */
    math(template, ...values) {
      let ast = mathCache.get(template)

      if (!ast) {
        const tokens = tokenize(template)
        const parser = new ASTParser(tokens, 'math')
        ast = parser.parseExpression(0, true)

        if (parser.current().type !== 'EOF') {
          throw new Error('Unexpected tokens after expression')
        }

        mathCache.set(template, ast)
      }

      const processedValues = preprocessValues(values, DecimalConstructor)
      return /** @type {DecimalInstance} */ (interpret(ast, processedValues, DecimalConstructor))
    },

    /**
     * @param {TemplateStringsArray} template
     * @param {...(DecimalValue | DecimalInstance | DecimalInstance[])} values
     * @returns {boolean}
     */
    is(template, ...values) {
      let ast = isCache.get(template)

      if (!ast) {
        const tokens = tokenize(template)
        const parser = new ASTParser(tokens, 'is')
        ast = parser.parseExpression(0, true)

        if (parser.current().type !== 'EOF') {
          throw new Error('Unexpected tokens after expression')
        }

        if (!parser.hasTopLevelComparison) {
          throw new Error(
            `'is' template requires a comparison operator (<, <=, ==, >, >=, !=) at the top level`
          )
        }

        isCache.set(template, ast)
      }

      const processedValues = preprocessValues(values, DecimalConstructor)
      return /** @type {boolean} */ (interpret(ast, processedValues, DecimalConstructor))
    },
  }
}

/**
 * @param {any} condition
 * @param {string} [message]
 * @returns {asserts condition}
 */
export function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}
