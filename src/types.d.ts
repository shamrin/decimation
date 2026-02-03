export type Operator = '<' | '<=' | '==' | '>' | '>=' | '!=' | '+' | '-' | '*' | '/' | '**'

export type DecimalValue = string | number | bigint

export type Token =
  | { type: 'VALUE'; value: number }
  | { type: 'NUMBER'; value: string }
  | { type: 'OPERATOR'; value: Operator }
  | { type: 'FUNCTION'; value: string }
  | { type: 'LPAREN' | 'RPAREN' | 'COMMA' | 'EOF'; value?: undefined }

export type ASTNode =
  | { type: 'value'; index: number }
  | { type: 'number'; value: string }
  | { type: 'unary'; op: '+' | '-'; operand: ASTNode }
  | { type: 'binary'; op: Operator; left: ASTNode; right: ASTNode }
  | { type: 'function'; name: string; args: ASTNode[] }

export interface DecimalInstance {
  add(x: DecimalValue | DecimalInstance): DecimalInstance
  sub(x: DecimalValue | DecimalInstance): DecimalInstance
  mul(x: DecimalValue | DecimalInstance): DecimalInstance
  div(x: DecimalValue | DecimalInstance): DecimalInstance
  pow(x: DecimalValue | DecimalInstance): DecimalInstance
  lt(x: DecimalValue | DecimalInstance): boolean
  lte(x: DecimalValue | DecimalInstance): boolean
  eq(x: DecimalValue | DecimalInstance): boolean
  gt(x: DecimalValue | DecimalInstance): boolean
  gte(x: DecimalValue | DecimalInstance): boolean
  abs(): DecimalInstance
  neg(): DecimalInstance
  ceil(): DecimalInstance
  floor(): DecimalInstance
  round(): DecimalInstance
  clamp(min: DecimalValue | DecimalInstance, max: DecimalValue | DecimalInstance): DecimalInstance
  toFixed(n: number): string
}

export interface DecimalConstructor {
  new (value: DecimalValue | DecimalInstance | any): DecimalInstance
  sum(...values: Array<DecimalValue | DecimalInstance | any>): DecimalInstance
}
