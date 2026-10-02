/**
 * Calculator — script.js
 * Features:
 *   • All arithmetic operations: +, −, ×, ÷
 *   • Chained operations, live expression display
 *   • Percent, sign toggle, decimal point
 *   • AC (all-clear) & smart backspace
 *   • Division-by-zero & overflow error handling
 *   • Full keyboard support
 *   • Active-operator visual highlight
 */

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  current:       '0',      // what the user is building right now
  previous:      '',       // left-hand operand
  operator:      null,     // pending operator symbol
  shouldReplace: false,    // next digit press replaces display
  justEvaluated: false,    // result just computed — track for chaining
};

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const resultEl     = document.getElementById('result');
const expressionEl = document.getElementById('expression');
const opButtons    = document.querySelectorAll('.btn-op');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a number for display: strip trailing zeros, limit decimals */
function fmt(n) {
  if (!isFinite(n)) return 'Error';
  // Use toPrecision to cap significant digits, then parseFloat to strip zeros
  let s = parseFloat(n.toPrecision(12)).toString();
  // Handle very large / very small: show in exponential if needed
  if (s.length > 14) s = parseFloat(n.toPrecision(9)).toExponential();
  return s;
}

/** Render the display (result + expression rows) */
function render() {
  const val = state.current;
  resultEl.textContent = val;

  // Adjust font size based on length
  resultEl.classList.remove('small', 'x-small', 'error');
  if (val === 'Error') {
    resultEl.classList.add('error');
  } else if (val.length >= 12) {
    resultEl.classList.add('x-small');
  } else if (val.length >= 9) {
    resultEl.classList.add('small');
  }

  // Pop animation
  resultEl.classList.remove('pop');
  void resultEl.offsetWidth; // reflow
  resultEl.classList.add('pop');

  // Highlight active operator button
  opButtons.forEach(btn => {
    btn.classList.toggle(
      'active',
      state.operator && btn.dataset.value === state.operator && !state.justEvaluated
    );
  });
}

/** Perform the arithmetic */
function calculate(a, op, b) {
  const x = parseFloat(a);
  const y = parseFloat(b);
  switch (op) {
    case '+': return x + y;
    case '−': return x - y;
    case '×': return x * y;
    case '÷':
      if (y === 0) return Infinity; // handled as Error
      return x / y;
    default: return b;
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function actionDigit(d) {
  if (state.current === 'Error') { actionClear(); }

  if (state.shouldReplace) {
    state.current = d;
    state.shouldReplace = false;
  } else {
    // Prevent leading zeros like "007"
    if (state.current === '0' && d !== '.') {
      state.current = d;
    } else if (state.current.length < 15) {
      state.current += d;
    }
  }
  state.justEvaluated = false;
  updateExpression();
  render();
}

function actionDecimal() {
  if (state.current === 'Error') { actionClear(); }
  if (state.shouldReplace) {
    state.current = '0.';
    state.shouldReplace = false;
    updateExpression();
    render();
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
    updateExpression();
    render();
  }
}

function actionOperator(op) {
  if (state.current === 'Error') { actionClear(); return; }

  // If there's a pending operation and the user hasn't just pressed =,
  // compute the intermediate result first (chaining)
  if (state.operator && !state.shouldReplace && !state.justEvaluated) {
    const result = calculate(state.previous, state.operator, state.current);
    state.previous = fmt(result);
    state.current  = fmt(result);
    if (!isFinite(result)) { state.current = 'Error'; render(); return; }
  } else {
    state.previous = state.current;
  }

  state.operator      = op;
  state.shouldReplace = true;
  state.justEvaluated = false;

  expressionEl.textContent = `${state.previous} ${op}`;
  render();
}

function actionEquals() {
  if (state.current === 'Error') return;
  if (!state.operator || !state.previous) return;

  const expr    = `${state.previous} ${state.operator} ${state.current}`;
  const result  = calculate(state.previous, state.operator, state.current);
  const display = isFinite(result) ? fmt(result) : 'Error';

  expressionEl.textContent = `${expr} =`;
  state.current       = display;
  state.previous      = '';
  state.operator      = null;
  state.shouldReplace = true;
  state.justEvaluated = true;

  render();
}

function actionClear() {
  state.current       = '0';
  state.previous      = '';
  state.operator      = null;
  state.shouldReplace = false;
  state.justEvaluated = false;
  expressionEl.textContent = '';
  render();
}

function actionSign() {
  if (state.current === 'Error' || state.current === '0') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1)
    : '-' + state.current;
  render();
}

function actionPercent() {
  if (state.current === 'Error') return;
  const n = parseFloat(state.current) / 100;
  state.current = fmt(n);
  render();
}

function actionBackspace() {
  if (state.current === 'Error') { actionClear(); return; }
  if (state.shouldReplace || state.justEvaluated) return; // can't backspace after =
  if (state.current.length > 1) {
    state.current = state.current.slice(0, -1);
  } else {
    state.current = '0';
  }
  render();
}

function updateExpression() {
  if (state.operator) {
    expressionEl.textContent = `${state.previous} ${state.operator} ${state.current}`;
  }
}

// ─── Button click handler ─────────────────────────────────────────────────────

document.querySelector('.buttons').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const { action, value } = btn.dataset;

  switch (action) {
    case 'digit':    actionDigit(value);    break;
    case 'decimal':  actionDecimal();       break;
    case 'operator': actionOperator(value); break;
    case 'equals':   actionEquals();        break;
    case 'clear':    actionClear();         break;
    case 'sign':     actionSign();          break;
    case 'percent':  actionPercent();       break;
  }
});

// ─── Keyboard support ────────────────────────────────────────────────────────

const KEY_MAP = {
  '0': () => actionDigit('0'),
  '1': () => actionDigit('1'),
  '2': () => actionDigit('2'),
  '3': () => actionDigit('3'),
  '4': () => actionDigit('4'),
  '5': () => actionDigit('5'),
  '6': () => actionDigit('6'),
  '7': () => actionDigit('7'),
  '8': () => actionDigit('8'),
  '9': () => actionDigit('9'),
  '.': () => actionDecimal(),
  ',': () => actionDecimal(),
  '+': () => actionOperator('+'),
  '-': () => actionOperator('−'),
  '*': () => actionOperator('×'),
  '/': () => actionOperator('÷'),
  'Enter':     () => actionEquals(),
  '=':         () => actionEquals(),
  'Backspace':  () => actionBackspace(),
  'Escape':    () => actionClear(),
  'Delete':    () => actionClear(),
  '%':         () => actionPercent(),
  'F9':        () => actionSign(),
  'n':         () => actionSign(),
};

document.addEventListener('keydown', e => {
  // Ignore modifier combos (Ctrl+R reload etc.)
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  const handler = KEY_MAP[e.key];
  if (handler) {
    e.preventDefault();
    handler();

    // Briefly highlight the matching button for visual feedback
    highlightKey(e.key);
  }
});

function highlightKey(key) {
  let btn = null;
  const opMap = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  if ('0123456789'.includes(key)) {
    btn = document.querySelector(`.btn[data-action="digit"][data-value="${key}"]`);
  } else if (opMap[key]) {
    btn = document.querySelector(`.btn[data-value="${opMap[key]}"]`);
  } else if (key === '.' || key === ',') {
    btn = document.querySelector('.btn[data-action="decimal"]');
  } else if (key === 'Enter' || key === '=') {
    btn = document.querySelector('.btn[data-action="equals"]');
  } else if (key === 'Escape' || key === 'Delete') {
    btn = document.querySelector('.btn[data-action="clear"]');
  } else if (key === '%') {
    btn = document.querySelector('.btn[data-action="percent"]');
  } else if (key === 'F9' || key === 'n') {
    btn = document.querySelector('.btn[data-action="sign"]');
  }

  if (btn) {
    btn.classList.add('key-active');
    setTimeout(() => btn.classList.remove('key-active'), 150);
  }
}

// Add key-active style dynamically
const style = document.createElement('style');
style.textContent = `.key-active { filter: brightness(1.4); transform: scale(0.94); }`;
document.head.appendChild(style);

// ─── Init ─────────────────────────────────────────────────────────────────────
render();
