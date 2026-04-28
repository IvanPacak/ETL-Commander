// Hardcoded demo data for ETL Commander.

const PIPELINE_RUNS = [
  { id: 'r-2026-04-27-01', date: '27.4.2026', time: '03:14', phase: 'RAW',       result: 'success', duration: '4m 12s', rows: '1,247,832' },
  { id: 'r-2026-04-27-02', date: '27.4.2026', time: '03:18', phase: 'SAVE',      result: 'success', duration: '3m 47s', rows: '23,451 (delta)' },
  { id: 'r-2026-04-27-03', date: '27.4.2026', time: '03:22', phase: 'ANALYTICS', result: 'success', duration: '2m 03s', rows: '187,224' },
  { id: 'r-2026-04-26-01', date: '26.4.2026', time: '03:14', phase: 'RAW',       result: 'success', duration: '4m 08s', rows: '1,243,118' },
  { id: 'r-2026-04-26-02', date: '26.4.2026', time: '03:18', phase: 'SAVE',      result: 'success', duration: '3m 51s', rows: '21,002 (delta)' },
  { id: 'r-2026-04-26-03', date: '26.4.2026', time: '03:22', phase: 'ANALYTICS', result: 'success', duration: '2m 11s', rows: '186,940' },
  { id: 'r-2026-04-25-01', date: '25.4.2026', time: '03:14', phase: 'RAW',       result: 'success', duration: '4m 19s', rows: '1,239,801' },
  { id: 'r-2026-04-25-02', date: '25.4.2026', time: '03:18', phase: 'SAVE',      result: 'failed',  duration: '0m 47s', rows: '— (validation)' },
  { id: 'r-2026-04-25-03', date: '25.4.2026', time: '03:22', phase: 'ANALYTICS', result: 'pending', duration: '—',      rows: '—' },
];

const RUN_HISTORY_7D = [
  { day: 'Po', value: 1198400 },
  { day: 'Ut', value: 1224550 },
  { day: 'St', value: 1241008 },
  { day: 'Št', value: 1239801 },
  { day: 'Pi', value: 1243118 },
  { day: 'So', value: 1245620 },
  { day: 'Ne', value: 1247832 },
];

const PIPELINE_PHASES = [
  {
    id: 'raw',
    name: 'RAW',
    description: 'Surová extrakcia z AS400, ECB, Excel zdrojov',
    duration: '4m 12s',
    status: 'success',
    jobs: [
      { name: 'as400_gl_extract',     status: 'success', duration: '2m 47s', rows: '1,194,233' },
      { name: 'as400_ar_extract',     status: 'success', duration: '0m 51s', rows: '   34,118' },
      { name: 'ecb_fx_fetch',         status: 'success', duration: '0m 04s', rows: '       245' },
      { name: 'sales_excel_load',     status: 'success', duration: '0m 12s', rows: '    19,236' },
    ],
  },
  {
    id: 'save',
    name: 'SAVE',
    description: 'Mapping, dedup, save do analytics & reporting schémy',
    duration: '3m 47s',
    status: 'success',
    jobs: [
      { name: 'apply_mapping_account',   status: 'success', duration: '1m 12s', rows: '12,845' },
      { name: 'apply_numerator_pl_sign', status: 'success', duration: '0m 38s', rows: '12,845' },
      { name: 'save_analytics_delta',    status: 'success', duration: '1m 02s', rows: '23,451' },
      { name: 'save_reporting_delta',    status: 'success', duration: '0m 55s', rows: '14,718' },
    ],
  },
  {
    id: 'analytics',
    name: 'ANALYTICS',
    description: 'Refresh kalkulovaných views a materialized výstupov',
    duration: '2m 03s',
    status: 'success',
    jobs: [
      { name: 'refresh_mv_pl_monthly',     status: 'success', duration: '0m 41s', rows: '187,224' },
      { name: 'refresh_mv_balance_sheet',  status: 'success', duration: '0m 48s', rows: ' 64,118' },
      { name: 'refresh_mv_cost_centers',   status: 'success', duration: '0m 34s', rows: ' 23,902' },
    ],
  },
];

const SCHEDULED = [
  { name: 'Denný RAW refresh',          cron: '0 23 * * *',  cronLabel: 'denne 23:00',     last: 'dnes 23:00',      status: 'success', desc: 'Plný refresh RAW vrstvy' },
  { name: 'ECB FX import',              cron: '0 6 * * *',   cronLabel: 'denne 06:00',     last: 'dnes 06:02',      status: 'success', desc: 'Stiahne kurzový lístok ECB' },
  { name: 'Týždenný full ANALYTICS',    cron: '0 2 * * 0',   cronLabel: 'Nedeľa 02:00',    last: 'nedeľa 02:00',    status: 'success', desc: 'Plný rebuild materialized views' },
  { name: 'Mesačný snapshot',           cron: '0 0 1 * *',   cronLabel: '1. v mesiaci',    last: '1.4.2026',        status: 'success', desc: 'Archív do dwh_archive' },
  { name: 'Hourly health check',        cron: '0 * * * *',   cronLabel: 'každú hodinu',    last: 'dnes 09:00',      status: 'success', desc: 'Kontrola DB pripojení' },
];

const IMPORTS = [
  { name: 'ECB exchange rates',     source: 'HTTP',     detail: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
    freq: 'denne 06:00',     last: 'dnes 06:02',     count: '245 záznamov',  status: 'success' },
  { name: 'AS400 GL transactions',  source: 'Database', detail: 'AS400_PROD · GL_TRANS',
    freq: 'každú noc 23:00', last: 'dnes 23:14',     count: '12,845 transakcií', status: 'success' },
  { name: 'AS400 AR ledger',        source: 'Database', detail: 'AS400_PROD · AR_LEDGER',
    freq: 'každú noc 23:00', last: 'dnes 23:18',     count: '34,118 záznamov', status: 'success' },
  { name: 'Sales Excel monthly',    source: 'Excel',    detail: '\\\\fileserver\\sales\\2026\\',
    freq: 'manuálne',        last: '15.3.2026',      count: '19,236 riadkov', status: 'success' },
  { name: 'Cost centers CSV',       source: 'CSV',      detail: '\\\\fileserver\\hr\\cost_centers.csv',
    freq: 'manuálne',        last: '12.3.2026',      count: '247 riadkov',    status: 'success' },
  { name: 'Banka Slovenska FX',     source: 'HTTP',     detail: 'https://nbs.sk/api/fx/daily',
    freq: 'denne 06:30',     last: 'dnes 06:31',     count: '32 záznamov',    status: 'warning' },
  { name: 'Inventory snapshot',     source: 'Database', detail: 'AS400_PROD · INV_SNAP',
    freq: 'denne 22:30',     last: 'dnes 22:31',     count: '8,402 položiek', status: 'success' },
];

window.MAPPINGS = [
  { id: 'm1', name: 'Account → Category',     count: 1247, source: 'raw.gl_imports', target: 'analytics.gl_clean',  keys: ['account_no'] },
  { id: 'm2', name: 'Supplier dedupe',         count: 89,   source: 'raw.suppliers',  target: 'analytics.suppliers', keys: ['ico','name'] },
  { id: 'm3', name: 'Product → Group',         count: 234,  source: 'raw.products',   target: 'analytics.products',  keys: ['sku'] },
  { id: 'm4', name: 'Cost center → Department',count: 45,   source: 'raw.cost_centers', target: 'analytics.cost_centers', keys: ['cc_code'] },
  { id: 'm5', name: 'Customer dedupe',         count: 156,  source: 'raw.customers',  target: 'analytics.customers', keys: ['ico'] },
];

const MAPPING_RULES = {
  m1: [
    { src: '343150', op: '=',    tgt: 'DPH výstupná 20%',     prio: 1 },
    { src: '343200', op: '=',    tgt: 'DPH výstupná 10%',     prio: 1 },
    { src: '343*',   op: 'LIKE', tgt: 'DPH (ostatné)',         prio: 2 },
    { src: '504100', op: '=',    tgt: 'Materiál — výroba',    prio: 1 },
    { src: '504200', op: '=',    tgt: 'Materiál — réžia',     prio: 1 },
    { src: '504*',   op: 'LIKE', tgt: 'Materiál (ostatné)',   prio: 2 },
    { src: '518100', op: '=',    tgt: 'Služby — IT',          prio: 1 },
    { src: '518200', op: '=',    tgt: 'Služby — právne',      prio: 1 },
    { src: '518*',   op: 'LIKE', tgt: 'Služby (ostatné)',     prio: 2 },
    { src: '521*',   op: 'LIKE', tgt: 'Mzdy',                 prio: 2 },
    { src: '601*',   op: 'LIKE', tgt: 'Tržby — výrobky',      prio: 2 },
    { src: '602*',   op: 'LIKE', tgt: 'Tržby — služby',       prio: 2 },
    { src: '*',      op: 'ELSE', tgt: 'Nezaradené',            prio: 99 },
  ],
  m2: [
    { src: 'TATRA BANKA, A.S.',  op: '=',    tgt: 'Tatra banka, a.s.', prio: 1 },
    { src: 'TATRABANKA AS',       op: '=',    tgt: 'Tatra banka, a.s.', prio: 1 },
    { src: 'SPP DISTRIBUCIA*',    op: 'LIKE', tgt: 'SPP distribúcia, a.s.', prio: 2 },
    { src: 'O2 SLOVAKIA*',        op: 'LIKE', tgt: 'O2 Slovakia, s.r.o.', prio: 2 },
    { src: 'SLOVAK TELEKOM*',     op: 'LIKE', tgt: 'Slovak Telekom, a.s.', prio: 2 },
  ],
  m3: [
    { src: 'SKU-A-*', op: 'LIKE', tgt: 'Skupina A — výrobky', prio: 1 },
    { src: 'SKU-B-*', op: 'LIKE', tgt: 'Skupina B — komponenty', prio: 1 },
    { src: 'SKU-S-*', op: 'LIKE', tgt: 'Skupina S — služby', prio: 1 },
  ],
  m4: [
    { src: 'CC-100', op: '=', tgt: 'Výroba',         prio: 1 },
    { src: 'CC-200', op: '=', tgt: 'Logistika',      prio: 1 },
    { src: 'CC-300', op: '=', tgt: 'Predaj',         prio: 1 },
    { src: 'CC-400', op: '=', tgt: 'Administratíva', prio: 1 },
    { src: 'CC-500', op: '=', tgt: 'IT',             prio: 1 },
  ],
  m5: [],
};

const MAPPING_AUDIT = [
  { time: 'dnes 09:14',      user: 'Peter Novák',  action: 'activate',   detail: 'Account → Category v12 → v13' },
  { time: 'dnes 08:42',      user: 'Anna Kováčová',action: 'edit_rule',  detail: 'Pridané pravidlo 518200 = Služby — právne' },
  { time: 'včera 16:11',     user: 'Anna Kováčová',action: 'edit_rule',  detail: 'Zmenená priorita pre 343*' },
  { time: '23.4.2026 11:02', user: 'Peter Novák',  action: 'version',    detail: 'Zverzované ako v12' },
  { time: '21.4.2026 14:30', user: 'Peter Novák',  action: 'preview',    detail: 'Spustený náhľad výsledku (1.2M riadkov)' },
];

const NUMERATORS = [
  { id: 'n1', name: 'P&L Sign Numerator',     status: 'Active',             version: 'v3.2', activated: '12.3.2026', activatedBy: 'Peter Novák' },
  { id: 'n2', name: 'Balance Sheet Sign',     status: 'Active',             version: 'v2.1', activated: '5.2.2026',  activatedBy: 'Peter Novák' },
  { id: 'n3', name: 'Cost Center Group',      status: 'Draft',              version: 'v0.4', activated: '—',          activatedBy: '—' },
  { id: 'n4', name: 'VAT Direction',          status: 'Active',             version: 'v1.5', activated: '18.1.2026', activatedBy: 'Anna Kováčová' },
  { id: 'n5', name: 'Inventory Movement',     status: 'Pending Activation', version: 'v1.1', activated: '—',          activatedBy: '—' },
];

const NUMERATOR_RULES = {
  n1: [
    { pattern: '5*',     sign: '-1', category: 'Náklady',          severity: '—' },
    { pattern: '6*',     sign: '+1', category: 'Výnosy',           severity: '—' },
    { pattern: '343150', sign: '-1', category: 'DPH výstupná',     severity: 'high' },
    { pattern: '343350', sign: '+1', category: 'DPH vstupná',      severity: 'high' },
    { pattern: '518*',   sign: '-1', category: 'Služby',           severity: '—' },
    { pattern: '521*',   sign: '-1', category: 'Mzdy',             severity: '—' },
    { pattern: '601*',   sign: '+1', category: 'Tržby — výrobky',  severity: '—' },
    { pattern: '602*',   sign: '+1', category: 'Tržby — služby',   severity: '—' },
  ],
  n2: [
    { pattern: '0*',     sign: '+1', category: 'Aktíva — DM',      severity: '—' },
    { pattern: '1*',     sign: '+1', category: 'Aktíva — zásoby',  severity: '—' },
    { pattern: '2*',     sign: '+1', category: 'Aktíva — fin.',    severity: '—' },
    { pattern: '3*',     sign: '-1', category: 'Pasíva — záväzky', severity: '—' },
    { pattern: '4*',     sign: '-1', category: 'Pasíva — vlast.',  severity: 'high' },
  ],
  n3: [],
  n4: [
    { pattern: '343150', sign: 'OUT', category: 'DPH výstup', severity: 'high' },
    { pattern: '343350', sign: 'IN',  category: 'DPH vstup',  severity: 'high' },
  ],
  n5: [
    { pattern: '112*', sign: '+1', category: 'Príjem',  severity: '—' },
    { pattern: '113*', sign: '-1', category: 'Výdaj',   severity: '—' },
  ],
};

const NUMERATOR_AUDIT = {
  n1: [
    { v: 'v3.2', date: '12.3.2026', user: 'Peter Novák',  changes: '123 zmien' },
    { v: 'v3.1', date: '1.2.2026',  user: 'Anna Kováčová', changes: '45 zmien' },
    { v: 'v3.0', date: '15.12.2025',user: 'Peter Novák',  changes: '78 zmien' },
    { v: 'v2.4', date: '3.10.2025', user: 'Peter Novák',  changes: '12 zmien' },
  ],
};

const SCHEMAS = [
  { name: 'analytics',   tables: 12, last: 'dnes 03:18',     mode: 'DELTA', status: 'success' },
  { name: 'reporting',   tables: 8,  last: 'dnes 03:20',     mode: 'DELTA', status: 'success' },
  { name: 'dwh_archive', tables: 4,  last: 'nedeľa 02:00',   mode: 'FULL',  status: 'success' },
  { name: 'staging',     tables: 6,  last: 'dnes 03:14',     mode: 'HASH',  status: 'success' },
];

const SCHEMA_COLUMNS = {
  analytics: [
    { name: 'transaction_id',  type: 'BIGINT',         pk: true,  nn: true },
    { name: 'period_yyyymm',   type: 'INT',            pk: false, nn: true },
    { name: 'account_no',      type: 'VARCHAR(10)',    pk: false, nn: true },
    { name: 'account_category',type: 'VARCHAR(64)',    pk: false, nn: false },
    { name: 'cost_center',     type: 'VARCHAR(8)',     pk: false, nn: false },
    { name: 'amount',          type: 'NUMERIC(18,2)',  pk: false, nn: true },
    { name: 'currency',        type: 'CHAR(3)',        pk: false, nn: true },
    { name: 'amount_eur',      type: 'NUMERIC(18,2)',  pk: false, nn: true },
    { name: 'sign',            type: 'INT',            pk: false, nn: true },
    { name: 'source_system',   type: 'VARCHAR(16)',    pk: false, nn: true },
    { name: 'imported_at',     type: 'TIMESTAMP',      pk: false, nn: true },
  ],
};

const LINEAGE_NODES = [
  // Sources
  { id: 'as400_gl',     label: 'AS400 · GL_TRANS',     type: 'SOURCE', col: 0, row: 0, status: 'production' },
  { id: 'as400_ar',     label: 'AS400 · AR_LEDGER',    type: 'SOURCE', col: 0, row: 1, status: 'production' },
  { id: 'ecb',          label: 'ECB FX feed',          type: 'SOURCE', col: 0, row: 2, status: 'production' },
  { id: 'sales_xlsx',   label: 'Sales Excel',          type: 'SOURCE', col: 0, row: 3, status: 'production' },
  // Raw
  { id: 'raw_gl',       label: 'raw.gl_imports',       type: 'TABLE',  col: 1, row: 0, status: 'production' },
  { id: 'raw_ar',       label: 'raw.ar_imports',       type: 'TABLE',  col: 1, row: 1, status: 'production' },
  { id: 'raw_fx',       label: 'raw.fx_rates',         type: 'TABLE',  col: 1, row: 2, status: 'production' },
  { id: 'raw_sales',    label: 'raw.sales_imports',    type: 'TABLE',  col: 1, row: 3, status: 'production' },
  // Mapped
  { id: 'an_gl',        label: 'analytics.gl_clean',   type: 'TABLE',  col: 2, row: 0, status: 'production' },
  { id: 'an_ar',        label: 'analytics.ar_clean',   type: 'TABLE',  col: 2, row: 1, status: 'production' },
  { id: 'an_sales',     label: 'analytics.sales_clean',type: 'TABLE',  col: 2, row: 3, status: 'production' },
  // Mart
  { id: 'mv_pl',        label: 'mv_pl_monthly',        type: 'MAT_VIEW', col: 3, row: 0, status: 'production' },
  { id: 'mv_bs',        label: 'mv_balance_sheet',     type: 'MAT_VIEW', col: 3, row: 1, status: 'production' },
  { id: 'mv_rev',       label: 'mv_revenue_product',   type: 'MAT_VIEW', col: 3, row: 3, status: 'draft' },
  // Reports
  { id: 'rep_pl',       label: 'reporting.pl_report',  type: 'VIEW',   col: 4, row: 0, status: 'production' },
  { id: 'rep_bs',       label: 'reporting.bs_report',  type: 'VIEW',   col: 4, row: 1, status: 'production' },
  { id: 'rep_rev',      label: 'reporting.rev_report', type: 'VIEW',   col: 4, row: 3, status: 'draft' },
];
const LINEAGE_LINKS = [
  ['as400_gl','raw_gl'], ['as400_ar','raw_ar'], ['ecb','raw_fx'], ['sales_xlsx','raw_sales'],
  ['raw_gl','an_gl'], ['raw_fx','an_gl'],
  ['raw_ar','an_ar'], ['raw_fx','an_ar'],
  ['raw_sales','an_sales'], ['raw_fx','an_sales'],
  ['an_gl','mv_pl'], ['an_gl','mv_bs'], ['an_ar','mv_bs'],
  ['an_sales','mv_rev'],
  ['mv_pl','rep_pl'], ['mv_bs','rep_bs'], ['mv_rev','rep_rev'],
];

const GOVERNANCE = [
  { obj: 'analytics.gl_clean',         cat: 'Master',     status: 'Production', owner: 'Peter Novák',  lastMod: 'dnes 03:18' },
  { obj: 'analytics.ar_clean',         cat: 'Master',     status: 'Production', owner: 'Peter Novák',  lastMod: 'dnes 03:18' },
  { obj: 'analytics.sales_clean',      cat: 'Master',     status: 'Production', owner: 'Anna Kováčová', lastMod: 'dnes 03:18' },
  { obj: 'analytics.suppliers',        cat: 'Master',     status: 'Production', owner: 'Anna Kováčová', lastMod: '23.4.2026' },
  { obj: 'raw.gl_imports',             cat: 'Raw',        status: 'Production', owner: 'System',       lastMod: 'dnes 03:14' },
  { obj: 'raw.ar_imports',             cat: 'Raw',        status: 'Production', owner: 'System',       lastMod: 'dnes 03:14' },
  { obj: 'raw.fx_rates',               cat: 'Raw',        status: 'Production', owner: 'System',       lastMod: 'dnes 06:02' },
  { obj: 'raw.sales_imports',          cat: 'Raw',        status: 'Production', owner: 'System',       lastMod: '15.3.2026' },
  { obj: 'etl_map.account_category',   cat: 'Mapping',    status: 'Production', owner: 'Anna Kováčová', lastMod: 'dnes 09:14' },
  { obj: 'etl_map.supplier_dedupe',    cat: 'Mapping',    status: 'Production', owner: 'Anna Kováčová', lastMod: '20.4.2026' },
  { obj: 'etl_num.pl_sign',            cat: 'Numerator',  status: 'Production', owner: 'Peter Novák',  lastMod: '12.3.2026' },
  { obj: 'etl_num.bs_sign',            cat: 'Numerator',  status: 'Production', owner: 'Peter Novák',  lastMod: '5.2.2026' },
  { obj: 'etl_num.cc_group',           cat: 'Numerator',  status: 'Draft',      owner: 'Peter Novák',  lastMod: 'včera 16:11' },
  { obj: 'mv_pl_monthly',              cat: 'Mat. View',  status: 'Production', owner: 'Peter Novák',  lastMod: 'dnes 03:22' },
  { obj: 'mv_balance_sheet',           cat: 'Mat. View',  status: 'Production', owner: 'Peter Novák',  lastMod: 'dnes 03:22' },
  { obj: 'mv_revenue_product',         cat: 'Mat. View',  status: 'Draft',      owner: 'Anna Kováčová', lastMod: 'včera 11:02' },
  { obj: 'reporting.pl_report',        cat: 'View',       status: 'Production', owner: 'Peter Novák',  lastMod: '12.3.2026' },
  { obj: 'reporting.bs_report',        cat: 'View',       status: 'Production', owner: 'Peter Novák',  lastMod: '5.2.2026' },
  { obj: 'reporting.rev_report',       cat: 'View',       status: 'Review',     owner: 'Anna Kováčová', lastMod: 'včera 14:50' },
  { obj: 'reporting.legacy_pl_2023',   cat: 'View',       status: 'Deprecated', owner: 'System',       lastMod: '15.1.2024' },
];

const PIVOT_LIST = [
  { id: 'p1', name: 'P&L by month',                rows: ['Department','Cost Center'], cols: ['Month'], values: ['SUM(amount_eur)'], filters: ['Year = 2026'] },
  { id: 'p2', name: 'Costs by department',         rows: ['Department'],                cols: ['Quarter'], values: ['SUM(amount_eur)'], filters: ['Account category LIKE Náklady*'] },
  { id: 'p3', name: 'Revenue by product category', rows: ['Product Group','Product'],   cols: ['Month'], values: ['SUM(amount_eur)','COUNT(*)'], filters: ['Year = 2026'] },
  { id: 'p4', name: 'Supplier top 50',             rows: ['Supplier'],                  cols: [], values: ['SUM(amount_eur)'], filters: ['Year = 2026'] },
  { id: 'p5', name: 'DPH summary',                 rows: ['VAT direction'],             cols: ['Month'], values: ['SUM(amount_eur)'], filters: ['Account LIKE 343*'] },
];

// Pivot preview rows for "P&L by month"
const PIVOT_PREVIEW = {
  rowsHeader: ['Department','Cost center'],
  colsHeader: ['Jan','Feb','Mar','Apr','Q1+Apr'],
  rows: [
    { rowVals: ['Výroba',         'CC-100'], cells: [ -421530.20, -398214.55, -442118.18, -415980.06, -1677843.00 ] },
    { rowVals: ['Logistika',      'CC-200'], cells: [  -88412.10,  -91205.40,  -97311.85,  -89004.22,  -365933.57 ] },
    { rowVals: ['Predaj',         'CC-300'], cells: [   24818.40,   29112.50,   31207.10,   28903.75,   114041.75 ] },
    { rowVals: ['Administratíva', 'CC-400'], cells: [  -52118.30,  -51008.20,  -54912.45,  -53217.16,  -211256.11 ] },
    { rowVals: ['IT',             'CC-500'], cells: [  -34221.00,  -36118.50,  -38221.10,  -37016.55,  -145577.15 ] },
    { rowVals: ['(Tržby — výrobky)','—'],     cells: [  812440.30,  791118.20,  844512.05,  823016.40,  3271086.95 ] },
    { rowVals: ['(Tržby — služby)','—'],      cells: [  118420.55,  124302.10,  131204.60,  129812.18,   503739.43 ] },
  ],
  totals: [359397.65, 367986.15, 374359.27, 386514.34, 1488257.30],
};

const USERS = [
  { name: 'Peter Novák',       role: 'Admin',  last: 'dnes 08:14',    email: 'peter.novak@firma.sk' },
  { name: 'Anna Kováčová',     role: 'Editor', last: 'dnes 09:30',    email: 'anna.kovacova@firma.sk' },
  { name: 'Ján Horváth',       role: 'Viewer', last: 'včera 16:45',   email: 'jan.horvath@firma.sk' },
  { name: 'Mária Tomanová',    role: 'Editor', last: 'včera 11:20',   email: 'maria.tomanova@firma.sk' },
  { name: 'Lukáš Krajčí',      role: 'Viewer', last: '23.4.2026',     email: 'lukas.krajci@firma.sk' },
  { name: 'service_etl',       role: 'System', last: 'dnes 03:14',    email: '— (servisný)' },
];

const ACTION_CODES = [
  { code: 'pipeline.run',         admin: true,  editor: true,  viewer: false },
  { code: 'pipeline.schedule',    admin: true,  editor: false, viewer: false },
  { code: 'mapping.edit',         admin: true,  editor: true,  viewer: false },
  { code: 'mapping.activate',     admin: true,  editor: false, viewer: false },
  { code: 'numerator.edit',       admin: true,  editor: true,  viewer: false },
  { code: 'numerator.activate',   admin: true,  editor: false, viewer: false },
  { code: 'save.run',             admin: true,  editor: true,  viewer: false },
  { code: 'governance.read',      admin: true,  editor: true,  viewer: true },
  { code: 'audit.read',           admin: true,  editor: true,  viewer: true },
  { code: 'admin.users',          admin: true,  editor: false, viewer: false },
  { code: 'sql.deploy',           admin: true,  editor: false, viewer: false },
  { code: 'pivot.export',         admin: true,  editor: true,  viewer: true },
];

const AUDIT = [
  { time: 'dnes 09:14', user: 'Peter Novák',  action: 'mapping.activate',  obj: 'account_category',      detail: 'v12 → v13' },
  { time: 'dnes 08:42', user: 'Anna Kováčová',action: 'mapping.edit',      obj: 'account_category',      detail: '+1 rule (518200)' },
  { time: 'dnes 08:14', user: 'Peter Novák',  action: 'login',             obj: 'session',                detail: 'IP 10.4.1.18' },
  { time: 'dnes 03:22', user: 'service_etl',  action: 'pipeline.run',      obj: 'ANALYTICS phase',        detail: '187,224 rows' },
  { time: 'dnes 03:18', user: 'service_etl',  action: 'pipeline.run',      obj: 'SAVE phase',             detail: '23,451 delta' },
  { time: 'dnes 03:14', user: 'service_etl',  action: 'pipeline.run',      obj: 'RAW phase',              detail: '1,247,832 rows' },
  { time: 'včera 16:45', user: 'Ján Horváth', action: 'pivot.export',      obj: 'P&L by month',           detail: 'Excel (PL_apr2026.xlsx)' },
  { time: 'včera 16:11', user: 'Anna Kováčová',action: 'numerator.draft',  obj: 'cost_center_group',      detail: 'rule edit' },
  { time: 'včera 14:50', user: 'Anna Kováčová',action: 'view.edit',        obj: 'reporting.rev_report',   detail: 'WHERE clause' },
  { time: 'včera 11:02', user: 'Anna Kováčová',action: 'matview.refresh',  obj: 'mv_revenue_product',     detail: 'manual refresh' },
  { time: '23.4.2026 11:02', user: 'Peter Novák',action: 'mapping.version',obj: 'account_category',       detail: 'created v12' },
  { time: '21.4.2026 09:30', user: 'Mária Tomanová',action: 'pivot.save',  obj: 'Costs by department',    detail: 'created' },
];

const SQL_OBJECTS = [
  { name: 'analytics.gl_clean',          type: 'VIEW',         version: 'v18', deps: 4,  modBy: 'Peter Novák',  modAt: '12.3.2026' },
  { name: 'analytics.ar_clean',          type: 'VIEW',         version: 'v9',  deps: 3,  modBy: 'Peter Novák',  modAt: '5.2.2026' },
  { name: 'mv_pl_monthly',               type: 'MAT. VIEW',    version: 'v22', deps: 1,  modBy: 'Peter Novák',  modAt: '12.3.2026' },
  { name: 'mv_balance_sheet',            type: 'MAT. VIEW',    version: 'v14', deps: 2,  modBy: 'Peter Novák',  modAt: '5.2.2026' },
  { name: 'mv_revenue_product',          type: 'MAT. VIEW',    version: 'v3',  deps: 1,  modBy: 'Anna Kováčová', modAt: 'včera 11:02' },
  { name: 'fn_apply_pl_sign',            type: 'FUNCTION',     version: 'v7',  deps: 1,  modBy: 'Peter Novák',  modAt: '12.3.2026' },
  { name: 'fn_eur_convert',              type: 'FUNCTION',     version: 'v4',  deps: 1,  modBy: 'Peter Novák',  modAt: '15.12.2025' },
  { name: 'sp_save_analytics_delta',     type: 'PROCEDURE',    version: 'v11', deps: 3,  modBy: 'Peter Novák',  modAt: '12.3.2026' },
  { name: 'sp_save_reporting_delta',     type: 'PROCEDURE',    version: 'v8',  deps: 2,  modBy: 'Peter Novák',  modAt: '5.2.2026' },
  { name: 'sp_run_pipeline_phase',       type: 'PROCEDURE',    version: 'v15', deps: 8,  modBy: 'Peter Novák',  modAt: '12.3.2026' },
];

const CONNECTION_PROFILES = [
  { name: 'PROD_AS400',  host: 'prod-as400.lan',    port: 446,  db: 'GL_PROD',     driver: 'IBM i Access', status: 'connected', last: 'dnes 23:14' },
  { name: 'PROD_PG16',   host: 'prod-pg.lan',       port: 5432, db: 'etl_warehouse', driver: 'PostgreSQL 16', status: 'connected', last: 'dnes 03:22' },
  { name: 'STAGE_PG16',  host: 'stage-pg.lan',      port: 5432, db: 'etl_warehouse', driver: 'PostgreSQL 16', status: 'connected', last: 'dnes 09:00' },
  { name: 'FILESERVER',  host: '\\\\fileserver\\',  port: 445,  db: '—',           driver: 'SMB',          status: 'connected', last: 'dnes 06:30' },
];

Object.assign(window, {
  PIPELINE_RUNS, RUN_HISTORY_7D, PIPELINE_PHASES, SCHEDULED, IMPORTS,
  MAPPING_RULES, MAPPING_AUDIT,
  NUMERATORS, NUMERATOR_RULES, NUMERATOR_AUDIT,
  SCHEMAS, SCHEMA_COLUMNS,
  LINEAGE_NODES, LINEAGE_LINKS,
  GOVERNANCE,
  PIVOT_LIST, PIVOT_PREVIEW,
  USERS, ACTION_CODES, AUDIT, SQL_OBJECTS, CONNECTION_PROFILES,
});
