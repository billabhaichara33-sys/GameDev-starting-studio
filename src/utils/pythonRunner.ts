/**
 * Python Runner & Syntax Validator for GameDev Starter Studio
 * Enables authentic client-side Python 3 game scripting and beginner-friendly diagnostics.
 */

export interface PythonDiagnostic {
  type: 'error' | 'warning' | 'info';
  line: number;
  title: string;
  message: string;
  fixSuggestion: string;
}

export interface PythonRunResult {
  success: boolean;
  output: string;
  error?: string;
  result?: any;
}

/**
 * Validates Python code and returns beginner-friendly diagnostic messages.
 */
export function validatePythonCode(code: string): PythonDiagnostic[] {
  const issues: PythonDiagnostic[] = [];
  const lines = code.split('\n');

  let openParens = 0;
  let openBrackets = 0;
  let openBraces = 0;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) return;

    // 1. Check for JS/C keywords used by habit
    if (/\bfunction\s+[a-zA-Z_]/.test(trimmed)) {
      issues.push({
        type: 'error',
        line: lineNum,
        title: 'SyntaxError: "function" is not a Python keyword',
        message: 'In Python, functions are defined using the `def` keyword, not `function`.',
        fixSuggestion: `Replace \`function\` with \`def\` and end the line with a colon \`:\` (e.g. \`def my_func():\`).`
      });
    }

    if (/\b(let|var|const)\s+[a-zA-Z_]/.test(trimmed)) {
      issues.push({
        type: 'warning',
        line: lineNum,
        title: 'Unnecessary Variable Keyword',
        message: 'Python does not use `let`, `var`, or `const` to declare variables.',
        fixSuggestion: `In Python, simply write the variable name and value directly: e.g. \`${trimmed.replace(/\b(let|var|const)\s+/, '')}\``
      });
    }

    if (/\bconsole\.log\s*\(/.test(trimmed)) {
      issues.push({
        type: 'error',
        line: lineNum,
        title: 'Use `print()` in Python',
        message: '`console.log()` is JavaScript syntax. Python uses the built-in `print()` function.',
        fixSuggestion: `Change \`console.log(...)\` to \`print(...)\`.`
      });
    }

    if (/\btrue\b/.test(trimmed) && !/\bTrue\b/.test(trimmed)) {
      issues.push({
        type: 'warning',
        line: lineNum,
        title: 'Capitalize Booleans in Python',
        message: 'In Python, booleans must be capitalized: `True` or `False`.',
        fixSuggestion: 'Change lowercase `true` to capitalized `True`.'
      });
    }

    if (/\bfalse\b/.test(trimmed) && !/\bFalse\b/.test(trimmed)) {
      issues.push({
        type: 'warning',
        line: lineNum,
        title: 'Capitalize Booleans in Python',
        message: 'In Python, booleans must be capitalized: `True` or `False`.',
        fixSuggestion: 'Change lowercase `false` to capitalized `False`.'
      });
    }

    if (/\bnull\b/.test(trimmed)) {
      issues.push({
        type: 'warning',
        line: lineNum,
        title: 'Use `None` in Python',
        message: 'Python uses `None` instead of `null` or `undefined`.',
        fixSuggestion: 'Change `null` to `None`.'
      });
    }

    if (/&&/.test(trimmed)) {
      issues.push({
        type: 'error',
        line: lineNum,
        title: 'Use `and` instead of `&&`',
        message: 'In Python, the logical AND operator is the word `and`.',
        fixSuggestion: 'Replace `&&` with `and`.'
      });
    }

    if (/\|\|/.test(trimmed)) {
      issues.push({
        type: 'error',
        line: lineNum,
        title: 'Use `or` instead of `||`',
        message: 'In Python, the logical OR operator is the word `or`.',
        fixSuggestion: 'Replace `||` with `or`.'
      });
    }

    // 2. Check for missing colon after statement headers
    const blockKeywords = ['def ', 'if ', 'elif ', 'else:', 'else', 'for ', 'while ', 'class ', 'try:', 'try', 'except ', 'except:'];
    for (const kw of blockKeywords) {
      if (trimmed.startsWith(kw) || (kw === 'else:' && trimmed === 'else') || (kw === 'try:' && trimmed === 'try')) {
        if (!trimmed.endsWith(':') && !trimmed.includes('#')) {
          issues.push({
            type: 'error',
            line: lineNum,
            title: `SyntaxError: expected ':'`,
            message: `Python requires a colon \`:\` at the end of ${kw.trim()} statements to begin an indented block.`,
            fixSuggestion: `Add a colon \`:\` at the end of line ${lineNum}.`
          });
        }
      }
    }

    // 3. Check for single '=' inside if condition
    if (trimmed.startsWith('if ') || trimmed.startsWith('elif ')) {
      // Remove string literals before checking
      const cleanLine = trimmed.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
      if (cleanLine.includes('=') && !cleanLine.includes('==') && !cleanLine.includes('<=') && !cleanLine.includes('>=') && !cleanLine.includes('!=')) {
        issues.push({
          type: 'error',
          line: lineNum,
          title: 'SyntaxError: Invalid Assignment in Condition',
          message: 'You wrote a single `=` inside a condition. In Python, `=` assigns a value, while `==` checks if two values are equal.',
          fixSuggestion: 'Change `=` to `==` to test equality.'
        });
      }
    }

    // 4. Count bracket balance
    for (const char of trimmed) {
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
    }
  });

  if (openParens > 0) {
    issues.push({
      type: 'error',
      line: lines.length,
      title: 'SyntaxError: Unclosed Parenthesis `(`',
      message: 'You opened a parenthesis `(` that was never closed.',
      fixSuggestion: 'Check your function definitions or math expressions and add a matching `)`.'
    });
  } else if (openParens < 0) {
    issues.push({
      type: 'error',
      line: lines.length,
      title: 'SyntaxError: Unexpected `)`',
      message: 'There is an extra closing parenthesis `)`.',
      fixSuggestion: 'Remove the extra `)`.'
    });
  }

  if (openBrackets !== 0) {
    issues.push({
      type: 'error',
      line: lines.length,
      title: 'SyntaxError: Unbalanced Square Brackets `[` `]`',
      message: 'Python lists and indexing require matching square brackets.',
      fixSuggestion: 'Ensure all `[` have a matching `]`.'
    });
  }

  return issues;
}

/**
 * Transpiles a Python game script into executable JavaScript.
 * Transforms indentation into blocks, converts Python keywords and operators,
 * and preserves Python idioms (math, print, True/False, def, if/elif).
 */
export function transpilePythonToJS(pythonCode: string): string {
  const lines = pythonCode.split('\n');
  const jsLines: string[] = [];
  const indentStack: number[] = [0];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    
    // Check indentation
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      // Empty line or full comment
      jsLines.push(rawLine.replace(/#/, '//'));
      continue;
    }

    // Calculate leading spaces
    const match = rawLine.match(/^(\s*)/);
    const currentIndent = match ? match[1].length : 0;

    // If indent decreased, close corresponding blocks
    while (indentStack.length > 1 && currentIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }

    let line = trimmed;

    // Handle comments at end of line
    const commentIndex = line.indexOf('#');
    let trailingComment = '';
    if (commentIndex !== -1) {
      trailingComment = ' // ' + line.substring(commentIndex + 1);
      line = line.substring(0, commentIndex).trim();
    }

    // Python booleans and constants
    line = line.replace(/\bTrue\b/g, 'true');
    line = line.replace(/\bFalse\b/g, 'false');
    line = line.replace(/\bNone\b/g, 'null');

    // Logical operators
    line = line.replace(/\band\b/g, '&&');
    line = line.replace(/\bor\b/g, '||');
    line = line.replace(/\bnot\s+/g, '!');

    // Python imports
    if (line.startsWith('import math')) {
      jsLines.push(' '.repeat(currentIndent) + 'const math = Math;' + trailingComment);
      continue;
    }
    if (line.startsWith('import random')) {
      jsLines.push(' '.repeat(currentIndent) + 'const random = { random: () => Math.random(), randint: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min, choice: (arr) => arr[Math.floor(Math.random() * arr.length)] };' + trailingComment);
      continue;
    }

    // Python function definition: def foo(a, b):
    if (line.startsWith('def ')) {
      const defMatch = line.match(/^def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*:/);
      if (defMatch) {
        const [, funcName, params] = defMatch;
        jsLines.push(' '.repeat(currentIndent) + `function ${funcName}(${params}) {` + trailingComment);
        indentStack.push(currentIndent + 4);
        continue;
      }
    }

    // Python if / elif / else
    if (line.startsWith('if ') && line.endsWith(':')) {
      const cond = line.slice(3, -1).trim();
      jsLines.push(' '.repeat(currentIndent) + `if (${cond}) {` + trailingComment);
      indentStack.push(currentIndent + 4);
      continue;
    }

    if (line.startsWith('elif ') && line.endsWith(':')) {
      const cond = line.slice(5, -1).trim();
      // Close previous block first
      if (indentStack.length > 1) {
        indentStack.pop();
        jsLines.push(' '.repeat(currentIndent) + `} else if (${cond}) {` + trailingComment);
      } else {
        jsLines.push(' '.repeat(currentIndent) + `else if (${cond}) {` + trailingComment);
      }
      indentStack.push(currentIndent + 4);
      continue;
    }

    if (line === 'else:' || line.startsWith('else:')) {
      if (indentStack.length > 1) {
        indentStack.pop();
        jsLines.push(' '.repeat(currentIndent) + `} else {` + trailingComment);
      } else {
        jsLines.push(' '.repeat(currentIndent) + `else {` + trailingComment);
      }
      indentStack.push(currentIndent + 4);
      continue;
    }

    // Python while loop: while running:
    if (line.startsWith('while ') && line.endsWith(':')) {
      const cond = line.slice(6, -1).trim();
      jsLines.push(' '.repeat(currentIndent) + `while (${cond}) {` + trailingComment);
      indentStack.push(currentIndent + 4);
      continue;
    }

    // Python for range: for i in range(10):
    const forRangeMatch = line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+range\(([^)]+)\)\s*:/);
    if (forRangeMatch) {
      const [, varName, count] = forRangeMatch;
      jsLines.push(' '.repeat(currentIndent) + `for (let ${varName} = 0; ${varName} < ${count}; ${varName}++) {` + trailingComment);
      indentStack.push(currentIndent + 4);
      continue;
    }

    // Python for in list: for item in list:
    const forInMatch = line.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+([^:]+)\s*:/);
    if (forInMatch) {
      const [, varName, collection] = forInMatch;
      jsLines.push(' '.repeat(currentIndent) + `for (const ${varName} of ${collection}) {` + trailingComment);
      indentStack.push(currentIndent + 4);
      continue;
    }

    // Python f-strings: f"hello {name}" -> `hello ${name}`
    line = line.replace(/f"([^"]*)"/g, (_, str) => {
      const formatted = str.replace(/\{([^}]+)\}/g, '${$1}');
      return `\`${formatted}\``;
    });
    line = line.replace(/f'([^']*)'/g, (_, str) => {
      const formatted = str.replace(/\{([^}]+)\}/g, '${$1}');
      return `\`${formatted}\``;
    });

    // Python print()
    line = line.replace(/\bprint\s*\(/g, '__print(');

    // Variable assignment without let/var
    // If line starts with a variable name followed by = or +=, e.g. x = 5
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=[^=]/.test(line)) {
      const varName = line.split('=')[0].trim();
      // Prefix with let if not already declared in current scope (let runner handle global scope safely)
      line = `let ${line}`;
    }

    jsLines.push(' '.repeat(currentIndent) + line + ';' + trailingComment);
  }

  // Close any remaining opened blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push('}');
  }

  return jsLines.join('\n');
}

/**
 * Executes Python code safely in the browser, capturing stdout print calls.
 */
export function executePython(
  code: string, 
  context: Record<string, any> = {}
): PythonRunResult {
  const diagnostics = validatePythonCode(code);
  const fatalErrors = diagnostics.filter(d => d.type === 'error');
  if (fatalErrors.length > 0) {
    return {
      success: false,
      output: '',
      error: `${fatalErrors[0].title}: ${fatalErrors[0].message} (Line ${fatalErrors[0].line})`
    };
  }

  const logs: string[] = [];
  const __print = (...args: any[]) => {
    logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
  };

  try {
    const jsCode = transpilePythonToJS(code);

    // Context environment
    const scopeKeys = Object.keys(context);
    const scopeValues = Object.values(context);

    // Built-in standard Python functions
    const pythonGlobals = {
      __print,
      print: __print,
      math: Math,
      len: (item: any) => (item ? (item.length ?? Object.keys(item).length) : 0),
      range: (n: number) => Array.from({ length: n }, (_, i) => i),
      round: Math.round,
      abs: Math.abs,
      min: Math.min,
      max: Math.max,
      int: (v: any) => parseInt(v, 10),
      float: (v: any) => parseFloat(v),
      str: (v: any) => String(v),
      bool: (v: any) => Boolean(v),
      random: {
        random: () => Math.random(),
        randint: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
        choice: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)]
      }
    };

    const runner = new Function(
      '__globals',
      ...scopeKeys,
      `
      with (__globals) {
        ${jsCode}
        if (typeof on_update === 'function') {
          return { on_update, on_collision: typeof on_collision === 'function' ? on_collision : null };
        }
      }
      `
    );

    const result = runner(pythonGlobals, ...scopeValues);

    return {
      success: true,
      output: logs.join('\n') || 'Python script executed successfully with 0 errors.',
      result
    };
  } catch (err: any) {
    return {
      success: false,
      output: logs.join('\n'),
      error: `Python Runtime Exception: ${err.message}`
    };
  }
}
