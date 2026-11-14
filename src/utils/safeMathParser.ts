/**
 * Trusted Mathematical Expression Tokenizer, Parser, and Evaluator
 *
 * Replaces dynamic code execution (new Function / eval) with a deterministic,
 * zero-eval recursive-descent parser restricted strictly to approved numbers,
 * variables, operators, mathematical constants, and allowlisted Math functions.
 */

export interface SafeMathOptions {
  variables?: Record<string, number>;
  angleUnit?: 'deg' | 'rad';
  /** 'postfix' treats `50%` as `0.5` (Calculator); 'modulo' treats `a % b` as remainder (Custom Formulas). */
  percentageMode?: 'postfix' | 'modulo';
  /** '10' treats `log(x)` as base-10 (Calculator); 'e' treats `log(x)` as natural log (JS formulas). */
  logBase?: '10' | 'e';
  /** Allow incomplete trailing operators/parens check helper */
  maxLength?: number;
  maxDepth?: number;
  maxNodes?: number;
}

export interface SafeMathResult {
  success: boolean;
  result: number;
  errorCode?:
    | 'EMPTY'
    | 'TOO_LONG'
    | 'SYNTAX'
    | 'DISALLOWED_SYNTAX'
    | 'PROPERTY_ACCESS'
    | 'UNKNOWN_IDENTIFIER'
    | 'DEPTH_LIMIT'
    | 'COMPUTATION_LIMIT'
    | 'DIV_ZERO'
    | 'MATH_ERROR';
  error?: string;
}

const DEFAULT_MAX_LENGTH = 500;
const DEFAULT_MAX_TOKENS = 200;
const DEFAULT_MAX_DEPTH = 32;
const DEFAULT_MAX_NODES = 1000;
const MAX_FUNCTION_ARGS = 8;

const FORBIDDEN_CHARS_RE = /[;{}[\]`'"\\=<>|&?:~$@#]/;

const BLOCKED_IDENTIFIERS = new Set([
  'window',
  'globalThis',
  'self',
  'top',
  'parent',
  'frames',
  'document',
  'eval',
  'Function',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'import',
  'require',
  'process',
  'constructor',
  '__proto__',
  'prototype',
  'this',
  'super',
  'new',
  'delete',
  'typeof',
  'void',
  'await',
  'async',
  'yield',
  'return',
  'throw',
  'try',
  'catch',
  'while',
  'for',
  'do',
  'if',
  'else',
  'switch',
  'class',
  'let',
  'const',
  'var',
  'Infinity',
  'NaN',
  'undefined',
  'null',
  'true',
  'false',
  'alert',
  'confirm',
  'prompt',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
]);

type TokenType =
  | 'NUMBER'
  | 'IDENT'
  | 'MATH_MEMBER'
  | 'OP'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'BANG';

interface Token {
  type: TokenType;
  value: string;
  numValue?: number;
}

const ALLOWED_MATH_CONSTANTS: Record<string, number> = {
  PI: Math.PI,
  E: Math.E,
};

const ALLOWED_FUNCTIONS = new Set([
  'sqrt',
  'cbrt',
  'pow',
  'abs',
  'round',
  'ceil',
  'floor',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'log',
  'ln',
  'log10',
  'exp',
  'min',
  'max',
]);

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

function tokenize(expr: string, maxLength: number): { tokens?: Token[]; error?: SafeMathResult } {
  if (expr.length > maxLength) {
    return {
      error: {
        success: false,
        result: 0,
        errorCode: 'TOO_LONG',
        error: `Expression exceeds maximum length of ${maxLength} characters`,
      },
    };
  }

  if (FORBIDDEN_CHARS_RE.test(expr)) {
    return {
      error: {
        success: false,
        result: 0,
        errorCode: 'DISALLOWED_SYNTAX',
        error: 'Illegal character or syntax in expression',
      },
    };
  }

  const tokens: Token[] = [];
  let i = 0;
  const len = expr.length;

  while (i < len) {
    const ch = expr[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Unicode mathematical symbols
    if (ch === '×') {
      tokens.push({ type: 'OP', value: '*' });
      i++;
      continue;
    }
    if (ch === '÷') {
      tokens.push({ type: 'OP', value: '/' });
      i++;
      continue;
    }
    if (ch === 'π') {
      tokens.push({ type: 'IDENT', value: 'PI' });
      i++;
      continue;
    }
    if (ch === '√') {
      tokens.push({ type: 'IDENT', value: 'sqrt' });
      i++;
      continue;
    }
    if (ch === '∛') {
      tokens.push({ type: 'IDENT', value: 'cbrt' });
      i++;
      continue;
    }

    // Numbers: integer, decimal, or scientific notation (e.g. 12, .5, 1.25e-3)
    if (/\d/.test(ch) || (ch === '.' && i + 1 < len && /\d/.test(expr[i + 1]))) {
      const rest = expr.slice(i);
      const match = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
      if (!match) {
        return {
          error: {
            success: false,
            result: 0,
            errorCode: 'SYNTAX',
            error: 'Invalid numeric literal',
          },
        };
      }
      const rawNum = match[0];
      const numVal = Number(rawNum);
      if (!Number.isFinite(numVal)) {
        return {
          error: {
            success: false,
            result: 0,
            errorCode: 'MATH_ERROR',
            error: 'Numeric literal overflow',
          },
        };
      }
      tokens.push({ type: 'NUMBER', value: rawNum, numValue: numVal });
      i += rawNum.length;
      continue;
    }

    // Reject standalone or trailing property-access dot (not part of a number)
    if (ch === '.') {
      return {
        error: {
          success: false,
          result: 0,
          errorCode: 'PROPERTY_ACCESS',
          error: 'Property access is not allowed',
        },
      };
    }

    // Identifiers & explicit Math.<member> tokens ONLY
    if (/[A-Za-z_]/.test(ch)) {
      const rest = expr.slice(i);
      const idMatch = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!idMatch) {
        return {
          error: {
            success: false,
            result: 0,
            errorCode: 'SYNTAX',
            error: 'Invalid identifier',
          },
        };
      }
      const ident = idMatch[0];
      i += ident.length;

      if (BLOCKED_IDENTIFIERS.has(ident)) {
        return {
          error: {
            success: false,
            result: 0,
            errorCode: 'DISALLOWED_SYNTAX',
            error: `Disallowed identifier: ${ident}`,
          },
        };
      }

      // Check for dot right after identifier (with optional spaces skipped only? No, JS dot can follow spaces)
      let lookahead = i;
      while (lookahead < len && /\s/.test(expr[lookahead])) lookahead++;

      if (lookahead < len && expr[lookahead] === '.') {
        if (ident !== 'Math') {
          return {
            error: {
              success: false,
              result: 0,
              errorCode: 'PROPERTY_ACCESS',
              error: `Property access on "${ident}" is not allowed`,
            },
          };
        }

        // Consume Math.<member>
        let mIdx = lookahead + 1;
        while (mIdx < len && /\s/.test(expr[mIdx])) mIdx++;
        const memberMatch = expr.slice(mIdx).match(/^[A-Za-z_][A-Za-z0-9_]*/);
        if (!memberMatch) {
          return {
            error: {
              success: false,
              result: 0,
              errorCode: 'PROPERTY_ACCESS',
              error: 'Invalid Math member access',
            },
          };
        }
        const member = memberMatch[0];
        i = mIdx + member.length;

        // Disallow further chaining like Math.sin.constructor
        let afterMember = i;
        while (afterMember < len && /\s/.test(expr[afterMember])) afterMember++;
        if (afterMember < len && expr[afterMember] === '.') {
          return {
            error: {
              success: false,
              result: 0,
              errorCode: 'PROPERTY_ACCESS',
              error: 'Nested property access is not allowed',
            },
          };
        }

        if (
          !Object.prototype.hasOwnProperty.call(ALLOWED_MATH_CONSTANTS, member) &&
          !ALLOWED_FUNCTIONS.has(member)
        ) {
          return {
            error: {
              success: false,
              result: 0,
              errorCode: 'DISALLOWED_SYNTAX',
              error: `Disallowed Math property: Math.${member}`,
            },
          };
        }

        tokens.push({ type: 'MATH_MEMBER', value: member });
      } else {
        if (ident === 'Math') {
          return {
            error: {
              success: false,
              result: 0,
              errorCode: 'DISALLOWED_SYNTAX',
              error: 'Bare Math object reference is not allowed',
            },
          };
        }
        tokens.push({ type: 'IDENT', value: ident });
      }
      continue;
    }

    // Operators
    if (ch === '*' && i + 1 < len && expr[i + 1] === '*') {
      tokens.push({ type: 'OP', value: '**' });
      i += 2;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^' || ch === '%') {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }
    if (ch === '!') {
      tokens.push({ type: 'BANG', value: '!' });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    return {
      error: {
        success: false,
        result: 0,
        errorCode: 'DISALLOWED_SYNTAX',
        error: `Unexpected character: ${ch}`,
      },
    };
  }

  if (tokens.length > DEFAULT_MAX_TOKENS) {
    return {
      error: {
        success: false,
        result: 0,
        errorCode: 'TOO_LONG',
        error: `Expression exceeds maximum token limit (${DEFAULT_MAX_TOKENS})`,
      },
    };
  }

  return { tokens };
}

class EvalAbortError extends Error {
  constructor(
    public readonly errorCode: NonNullable<SafeMathResult['errorCode']>,
    message: string
  ) {
    super(message);
  }
}

export function evaluateSafeMath(
  expression: string,
  options: SafeMathOptions = {}
): SafeMathResult {
  if (typeof expression !== 'string') {
    return { success: false, result: 0, errorCode: 'SYNTAX', error: 'Expression must be a string' };
  }

  const trimmed = expression.trim();
  if (!trimmed) {
    return { success: false, result: 0, errorCode: 'EMPTY', error: 'Empty expression' };
  }

  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const variables = options.variables ?? {};
  const angleUnit = options.angleUnit ?? 'rad';
  const percentageMode = options.percentageMode ?? 'modulo';
  const logBase = options.logBase ?? 'e';

  const tokenized = tokenize(trimmed, maxLength);
  if (tokenized.error) return tokenized.error;
  const tokens = tokenized.tokens!;

  if (tokens.length === 0) {
    return { success: false, result: 0, errorCode: 'EMPTY', error: 'Empty expression' };
  }

  let pos = 0;
  let depth = 0;
  let nodeCount = 0;

  const tickNode = () => {
    nodeCount++;
    if (nodeCount > maxNodes) {
      throw new EvalAbortError('COMPUTATION_LIMIT', 'Expression evaluation exceeded node limit');
    }
  };

  const enterDepth = () => {
    depth++;
    if (depth > maxDepth) {
      throw new EvalAbortError('DEPTH_LIMIT', `Expression nesting exceeds maximum depth (${maxDepth})`);
    }
  };

  const leaveDepth = () => {
    depth--;
  };

  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token => tokens[pos++];

  const invokeMathFunction = (name: string, args: number[], explicitMathPrefix: boolean): number => {
    const normalizeFn = explicitMathPrefix ? name : name.toLowerCase();

    // Exact arity checks
    if (normalizeFn === 'pow') {
      if (args.length !== 2) {
        throw new EvalAbortError('SYNTAX', `Function "${name}" requires exactly 2 arguments`);
      }
      const val = Math.pow(args[0], args[1]);
      if (!Number.isFinite(val)) throw new EvalAbortError('MATH_ERROR', 'Math error in pow()');
      return val;
    }

    if (normalizeFn === 'min' || normalizeFn === 'max') {
      if (args.length < 1 || args.length > MAX_FUNCTION_ARGS) {
        throw new EvalAbortError('SYNTAX', `Function "${name}" expects 1 to ${MAX_FUNCTION_ARGS} arguments`);
      }
      return normalizeFn === 'min' ? Math.min(...args) : Math.max(...args);
    }

    if (args.length !== 1) {
      throw new EvalAbortError('SYNTAX', `Function "${name}" requires exactly 1 argument`);
    }

    const x = args[0];
    let out: number;

    switch (normalizeFn) {
      case 'sqrt':
        out = Math.sqrt(x);
        break;
      case 'cbrt':
        out = Math.cbrt(x);
        break;
      case 'abs':
        out = Math.abs(x);
        break;
      case 'round':
        out = Math.round(x);
        break;
      case 'ceil':
        out = Math.ceil(x);
        break;
      case 'floor':
        out = Math.floor(x);
        break;
      case 'exp':
        out = Math.exp(x);
        break;
      case 'ln':
        out = Math.log(x);
        break;
      case 'log10':
        out = Math.log10(x);
        break;
      case 'log':
        out = !explicitMathPrefix && logBase === '10' ? Math.log10(x) : Math.log(x);
        break;
      case 'sin':
        out = angleUnit === 'deg' ? Math.sin((Math.PI / 180) * x) : Math.sin(x);
        break;
      case 'cos':
        out = angleUnit === 'deg' ? Math.cos((Math.PI / 180) * x) : Math.cos(x);
        break;
      case 'tan':
        out = angleUnit === 'deg' ? Math.tan((Math.PI / 180) * x) : Math.tan(x);
        break;
      case 'asin':
        out = angleUnit === 'deg' ? (180 / Math.PI) * Math.asin(x) : Math.asin(x);
        break;
      case 'acos':
        out = angleUnit === 'deg' ? (180 / Math.PI) * Math.acos(x) : Math.acos(x);
        break;
      case 'atan':
        out = angleUnit === 'deg' ? (180 / Math.PI) * Math.atan(x) : Math.atan(x);
        break;
      default:
        throw new EvalAbortError('UNKNOWN_IDENTIFIER', `Function "${name}" is not allowed`);
    }

    if (!Number.isFinite(out)) {
      throw new EvalAbortError('MATH_ERROR', `Math error in ${name}()`);
    }
    return out;
  };

  // Grammar:
  // Expression     -> Additive
  // Additive       -> Multiplicative (('+' | '-') Multiplicative)*
  // Multiplicative -> Unary (('*' | '/' | '%'[modulo]) Unary)*
  // Unary          -> ('+' | '-') Unary | Power
  // Power          -> Postfix (('**' | '^') Unary)?
  // Postfix        -> Primary ('!' | '%'[postfix])*
  // Primary        -> NUMBER | '(' Expression ')' | IDENT('(' Args ')')? | MATH_MEMBER('(' Args ')')?

  const parseExpression = (): number => parseAdditive();

  const parseAdditive = (): number => {
    let left = parseMultiplicative();
    while (peek()?.type === 'OP' && (peek()!.value === '+' || peek()!.value === '-')) {
      tickNode();
      const op = consume().value;
      const right = parseMultiplicative();
      left = op === '+' ? left + right : left - right;
      if (!Number.isFinite(left)) {
        throw new EvalAbortError('MATH_ERROR', 'Arithmetic overflow');
      }
    }
    return left;
  };

  const parseMultiplicative = (): number => {
    let left = parseUnary();
    while (
      peek()?.type === 'OP' &&
      (peek()!.value === '*' ||
        peek()!.value === '/' ||
        (percentageMode === 'modulo' && peek()!.value === '%'))
    ) {
      tickNode();
      const op = consume().value;
      const right = parseUnary();
      if (op === '*') {
        left = left * right;
      } else if (op === '/') {
        if (right === 0) {
          throw new EvalAbortError('DIV_ZERO', 'Cannot divide by zero');
        }
        left = left / right;
      } else {
        if (right === 0) {
          throw new EvalAbortError('DIV_ZERO', 'Cannot divide by zero');
        }
        left = left % right;
      }
      if (!Number.isFinite(left)) {
        throw new EvalAbortError('MATH_ERROR', 'Arithmetic overflow');
      }
    }
    return left;
  };

  const parseUnary = (): number => {
    const tok = peek();
    if (tok?.type === 'OP' && (tok.value === '+' || tok.value === '-')) {
      tickNode();
      enterDepth();
      consume();
      const val = parseUnary();
      leaveDepth();
      return tok.value === '-' ? -val : val;
    }
    return parsePower();
  };

  const parsePower = (): number => {
    const base = parsePostfix();
    const tok = peek();
    if (tok?.type === 'OP' && (tok.value === '^' || tok.value === '**')) {
      tickNode();
      enterDepth();
      consume();
      const exponent = parseUnary();
      leaveDepth();
      const val = Math.pow(base, exponent);
      if (!Number.isFinite(val)) {
        throw new EvalAbortError('MATH_ERROR', 'Math error in exponentiation');
      }
      return val;
    }
    return base;
  };

  const parsePostfix = (): number => {
    let val = parsePrimary();
    while (true) {
      const tok = peek();
      if (tok?.type === 'BANG') {
        tickNode();
        consume();
        const fact = factorial(val);
        if (!Number.isFinite(fact)) {
          throw new EvalAbortError('MATH_ERROR', 'Invalid factorial operand');
        }
        val = fact;
      } else if (percentageMode === 'postfix' && tok?.type === 'OP' && tok.value === '%') {
        tickNode();
        consume();
        val = val / 100;
      } else {
        break;
      }
    }
    return val;
  };

  const parseArgsList = (): number[] => {
    const args: number[] = [];
    if (peek()?.type === 'RPAREN') {
      consume();
      return args;
    }
    while (true) {
      if (args.length >= MAX_FUNCTION_ARGS) {
        throw new EvalAbortError('SYNTAX', `Too many function arguments (max ${MAX_FUNCTION_ARGS})`);
      }
      args.push(parseExpression());
      if (peek()?.type === 'COMMA') {
        consume();
        continue;
      }
      if (peek()?.type === 'RPAREN') {
        consume();
        return args;
      }
      throw new EvalAbortError('SYNTAX', 'Expected "," or ")" in function call');
    }
  };

  const parsePrimary = (): number => {
    tickNode();
    const tok = peek();
    if (!tok) {
      throw new EvalAbortError('SYNTAX', 'Unexpected end of expression');
    }

    if (tok.type === 'NUMBER') {
      consume();
      return tok.numValue!;
    }

    if (tok.type === 'LPAREN') {
      enterDepth();
      consume();
      const val = parseExpression();
      if (peek()?.type !== 'RPAREN') {
        throw new EvalAbortError('SYNTAX', 'Missing closing parenthesis ")"');
      }
      consume();
      leaveDepth();
      return val;
    }

    if (tok.type === 'MATH_MEMBER') {
      consume();
      const member = tok.value;
      if (peek()?.type === 'LPAREN') {
        if (!ALLOWED_FUNCTIONS.has(member)) {
          throw new EvalAbortError('UNKNOWN_IDENTIFIER', `Math.${member} is not a function`);
        }
        enterDepth();
        consume();
        const args = parseArgsList();
        leaveDepth();
        return invokeMathFunction(member, args, true);
      }
      if (Object.prototype.hasOwnProperty.call(ALLOWED_MATH_CONSTANTS, member)) {
        return ALLOWED_MATH_CONSTANTS[member];
      }
      throw new EvalAbortError('DISALLOWED_SYNTAX', `Math.${member} must be called as a function`);
    }

    if (tok.type === 'IDENT') {
      consume();
      const ident = tok.value;

      // Function call
      if (peek()?.type === 'LPAREN') {
        const lower = ident.toLowerCase();
        if (!ALLOWED_FUNCTIONS.has(lower)) {
          throw new EvalAbortError('UNKNOWN_IDENTIFIER', `Function "${ident}" is not allowed`);
        }
        enterDepth();
        consume();
        const args = parseArgsList();
        leaveDepth();
        return invokeMathFunction(lower, args, false);
      }

      // Variable lookup (safe own-property check)
      if (Object.prototype.hasOwnProperty.call(variables, ident)) {
        const v = variables[ident];
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          throw new EvalAbortError('MATH_ERROR', `Invalid numeric value for variable "${ident}"`);
        }
        return v;
      }

      // Approved mathematical constants
      if (ident === 'PI' || ident.toLowerCase() === 'pi') return Math.PI;
      if (ident === 'E' || ident === 'e') return Math.E;

      throw new EvalAbortError('UNKNOWN_IDENTIFIER', `Unknown or disallowed identifier: "${ident}"`);
    }

    throw new EvalAbortError('SYNTAX', `Unexpected token: "${tok.value}"`);
  };

  try {
    const result = parseExpression();
    if (pos < tokens.length) {
      return {
        success: false,
        result: 0,
        errorCode: 'SYNTAX',
        error: `Unexpected trailing token: "${tokens[pos].value}"`,
      };
    }
    if (!Number.isFinite(result)) {
      return {
        success: false,
        result: 0,
        errorCode: 'MATH_ERROR',
        error: 'Math error: result is NaN or infinite',
      };
    }
    return { success: true, result };
  } catch (err: any) {
    if (err instanceof EvalAbortError) {
      return {
        success: false,
        result: 0,
        errorCode: err.errorCode,
        error: err.message,
      };
    }
    return {
      success: false,
      result: 0,
      errorCode: 'SYNTAX',
      error: err?.message || 'Formula evaluation failed',
    };
  }
}
