// Fallback dáta pre offline režim — len mapping a numerátor pravidlá.
// Všetky ostatné dáta sú reálne (Supabase) alebo empty state.

window.MAPPINGS = [
  { id: 'm1', name: 'Account → Category',      source: 'raw.gl_imports',    target: 'analytics.gl_clean',      keys: ['account_no'] },
  { id: 'm2', name: 'Supplier dedupe',          source: 'raw.suppliers',     target: 'analytics.suppliers',     keys: ['ico','name'] },
  { id: 'm3', name: 'Product → Group',          source: 'raw.products',      target: 'analytics.products',      keys: ['sku'] },
  { id: 'm4', name: 'Cost center → Department', source: 'raw.cost_centers',  target: 'analytics.cost_centers',  keys: ['cc_code'] },
];

const MAPPING_RULES = {
  m1: [
    { src: '343150', op: '=',    tgt: 'DPH výstupná 20%',    prio: 1 },
    { src: '343200', op: '=',    tgt: 'DPH výstupná 10%',    prio: 1 },
    { src: '343*',   op: 'LIKE', tgt: 'DPH (ostatné)',        prio: 2 },
    { src: '504100', op: '=',    tgt: 'Materiál — výroba',   prio: 1 },
    { src: '504200', op: '=',    tgt: 'Materiál — réžia',    prio: 1 },
    { src: '504*',   op: 'LIKE', tgt: 'Materiál (ostatné)',  prio: 2 },
    { src: '518100', op: '=',    tgt: 'Služby — IT',         prio: 1 },
    { src: '518200', op: '=',    tgt: 'Služby — právne',     prio: 1 },
    { src: '518*',   op: 'LIKE', tgt: 'Služby (ostatné)',    prio: 2 },
    { src: '521*',   op: 'LIKE', tgt: 'Mzdy',                prio: 2 },
    { src: '601*',   op: 'LIKE', tgt: 'Tržby — výrobky',     prio: 2 },
    { src: '602*',   op: 'LIKE', tgt: 'Tržby — služby',      prio: 2 },
    { src: '*',      op: 'ELSE', tgt: 'Nezaradené',           prio: 99 },
  ],
  m2: [
    { src: 'TATRA BANKA, A.S.',  op: '=',    tgt: 'Tatra banka, a.s.',      prio: 1 },
    { src: 'TATRABANKA AS',       op: '=',    tgt: 'Tatra banka, a.s.',      prio: 1 },
    { src: 'SPP DISTRIBUCIA*',    op: 'LIKE', tgt: 'SPP distribúcia, a.s.',  prio: 2 },
    { src: 'O2 SLOVAKIA*',        op: 'LIKE', tgt: 'O2 Slovakia, s.r.o.',    prio: 2 },
    { src: 'SLOVAK TELEKOM*',     op: 'LIKE', tgt: 'Slovak Telekom, a.s.',   prio: 2 },
  ],
  m3: [
    { src: 'SKU-A-*', op: 'LIKE', tgt: 'Skupina A — výrobky',    prio: 1 },
    { src: 'SKU-B-*', op: 'LIKE', tgt: 'Skupina B — komponenty', prio: 1 },
    { src: 'SKU-S-*', op: 'LIKE', tgt: 'Skupina S — služby',     prio: 1 },
  ],
  m4: [
    { src: 'CC-100', op: '=', tgt: 'Výroba',         prio: 1 },
    { src: 'CC-200', op: '=', tgt: 'Logistika',      prio: 1 },
    { src: 'CC-300', op: '=', tgt: 'Predaj',         prio: 1 },
    { src: 'CC-400', op: '=', tgt: 'Administratíva', prio: 1 },
    { src: 'CC-500', op: '=', tgt: 'IT',             prio: 1 },
  ],
};

const NUMERATORS = [
  { id: 'n1', name: 'P&L Sign Numerator', status: 'Active', version: 'v1.0', activated: '—', activatedBy: '—' },
  { id: 'n2', name: 'Balance Sheet Sign', status: 'Active', version: 'v1.0', activated: '—', activatedBy: '—' },
  { id: 'n3', name: 'VAT Direction',      status: 'Active', version: 'v1.0', activated: '—', activatedBy: '—' },
];

const NUMERATOR_RULES = {
  n1: [
    { pattern: '5*',     sign: '-1', category: 'Náklady',         severity: '—' },
    { pattern: '6*',     sign: '+1', category: 'Výnosy',          severity: '—' },
    { pattern: '343150', sign: '-1', category: 'DPH výstupná',    severity: 'high' },
    { pattern: '343350', sign: '+1', category: 'DPH vstupná',     severity: 'high' },
    { pattern: '518*',   sign: '-1', category: 'Služby',          severity: '—' },
    { pattern: '521*',   sign: '-1', category: 'Mzdy',            severity: '—' },
    { pattern: '601*',   sign: '+1', category: 'Tržby — výrobky', severity: '—' },
    { pattern: '602*',   sign: '+1', category: 'Tržby — služby',  severity: '—' },
  ],
  n2: [
    { pattern: '0*', sign: '+1', category: 'Aktíva — DM',       severity: '—' },
    { pattern: '1*', sign: '+1', category: 'Aktíva — zásoby',   severity: '—' },
    { pattern: '2*', sign: '+1', category: 'Aktíva — fin.',      severity: '—' },
    { pattern: '3*', sign: '-1', category: 'Pasíva — záväzky',  severity: '—' },
    { pattern: '4*', sign: '-1', category: 'Pasíva — vlast.',   severity: 'high' },
  ],
  n3: [
    { pattern: '343150', sign: 'OUT', category: 'DPH výstup', severity: 'high' },
    { pattern: '343350', sign: 'IN',  category: 'DPH vstup',  severity: 'high' },
  ],
};

Object.assign(window, { MAPPING_RULES, NUMERATORS, NUMERATOR_RULES });
