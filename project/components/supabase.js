// ─────────────────────────────────────────────────────────────
//  ETL Commander · Supabase REST helper (vanilla fetch, žiadna knižnica)
//  Načítaj ako plain <script src="components/supabase.js"> PRED store.jsx
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://clnkarllsszrlobvxtdw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbmthcmxsc3N6cmxvYnZ4dGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTk4MTgsImV4cCI6MjA5Mjg5NTgxOH0.R1eZbSvllLRrxq_SNhhv_0HvYQ8FZ9D5x3KnZhNZhr4';

async function sbFetch(path, options) {
  options = options || {};
  var method = (options.method || 'GET').toUpperCase();
  var headers = {
    'apikey':        SUPABASE_ANON,
    'Authorization': 'Bearer ' + SUPABASE_ANON,
    'Content-Type':  'application/json',
  };
  if (options.prefer)  headers['Prefer']  = options.prefer;
  if (options.headers) Object.assign(headers, options.headers);

  var res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method:  method,
    headers: headers,
    body:    options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    var errBody = await res.json().catch(function() { return {}; });
    throw new Error('[sbFetch ' + method + ' /' + path.split('?')[0] + '] ' + (errBody.message || res.statusText));
  }
  if (res.status === 204) return null;
  var text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── window.etlDB — namespaced API ───────────────────────────

window.etlDB = {

  mapping: {
    getRulesets: function() {
      return sbFetch(
        'mapping_rulesets?select=id,name,version,status,' +
        'mapping_rules(id,source_value,operator,target_value,priority)&order=created_at.desc'
      );
    },
    saveRule: async function(rulesetId, rule) {
      var res = await sbFetch('mapping_rules', {
        method:  'POST',
        prefer:  'return=representation',
        body: {
          ruleset_id:   rulesetId,
          source_value: rule.src,
          operator:     rule.op,
          target_value: rule.tgt,
          priority:     Number(rule.prio) || 50,
        },
      });
      var row = Array.isArray(res) ? res[0] : res;
      return row ? row.id : null;
    },
    deleteRule: function(ruleId) {
      return sbFetch('mapping_rules?id=eq.' + ruleId, { method: 'DELETE' });
    },
    activateRuleset: async function(rulesetId) {
      await sbFetch('mapping_rulesets?status=eq.active', {
        method: 'PATCH', prefer: 'return=minimal', body: { status: 'draft' },
      }).catch(function() {});
      return sbFetch('mapping_rulesets?id=eq.' + rulesetId, {
        method: 'PATCH', prefer: 'return=minimal', body: { status: 'active' },
      });
    },
  },

  numerator: {
    createRuleset: async function(name) {
      var res = await sbFetch('numerator_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: name, status: 'draft', version: 1 },
      });
      var row = Array.isArray(res) ? res[0] : res;
      return row ? row.id : null;
    },
    getRulesets: function() {
      return sbFetch(
        'numerator_rulesets?select=id,name,version,status,' +
        'numerator_rules(id,account_pattern,operator,sign_value,priority,label)&order=created_at.desc'
      );
    },
    saveRule: async function(rulesetId, rule) {
      var res = await sbFetch('numerator_rules', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          ruleset_id:      rulesetId,
          account_pattern: rule.pattern || rule.src || '',
          operator:        rule.op || 'LIKE',
          sign_value:      rule.sign === '+1' ? 1 : rule.sign === '-1' ? -1 : 0,
          priority:        Number(rule.prio) || 50,
          label:           rule.label || rule.category || '',
        },
      });
      var row = Array.isArray(res) ? res[0] : res;
      return row ? row.id : null;
    },
    activateRuleset: async function(rulesetId) {
      await sbFetch('numerator_rulesets?status=eq.active', {
        method: 'PATCH', prefer: 'return=minimal', body: { status: 'draft' },
      }).catch(function() {});
      return sbFetch('numerator_rulesets?id=eq.' + rulesetId, {
        method: 'PATCH', prefer: 'return=minimal', body: { status: 'active' },
      });
    },
  },

  audit: {
    insert: function(action, detail, user) {
      return sbFetch('action_log', {
        method: 'POST',
        prefer: 'return=minimal',
        body:   { action_type: action, detail: detail, user_name: user || 'demo_user', metadata: {} },
      });
    },
    getLast: function(limit) {
      return sbFetch('action_log?order=ts.desc&limit=' + (limit || 100));
    },
  },

  pipeline: {
    getLast7Days: function() {
      return sbFetch('pipeline_runs?order=started_at.desc&limit=50');
    },
    insert: function(phase, status, rowsProcessed, durationMs) {
      return window.etlDB.pipeline.log(phase, status, rowsProcessed || 0, Math.round((durationMs || 0) / 1000));
    },
    log: function(phase, status, rowsProcessed, durationSeconds, errorMessage) {
      return sbFetch('pipeline_runs', {
        method: 'POST',
        prefer: 'return=minimal',
        body: {
          phase:            phase,
          status:           status,
          rows_processed:   rowsProcessed,
          duration_seconds: durationSeconds,
          error_message:    errorMessage || null,
          finished_at:      new Date().toISOString(),
        },
      });
    },
  },

  file: {
    save: async function(params) {
      var res = await sbFetch('imported_files', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          file_name: params.fileName,
          file_type: params.fileType,
          row_count: params.rowCount,
          col_count: params.colCount,
        },
      });
      var row = Array.isArray(res) ? res[0] : res;
      return row ? row.id : null;
    },
    getAll: function() {
      return sbFetch('imported_files?order=uploaded_at.desc');
    },
    insert: async function(name, rowCount, columns, meta) {
      meta = meta || {};
      var res = await sbFetch('imported_files', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          file_name: name,
          file_type: meta.type || 'manual',
          row_count: rowCount || 0,
          col_count: Array.isArray(columns) ? columns.length : (Number(columns) || 0),
        },
      });
      var row = Array.isArray(res) ? res[0] : res;
      return row ? row.id : null;
    },
  },

  gl: {
    insertBatch: async function(fileId, rows) {
      var mapped = rows.map(function(r) {
        return {
          file_id: fileId,
          jwfcdn: String(r.JWFCDN != null ? r.JWFCDN : (r.jwfcdn != null ? r.jwfcdn : '')),
          jwfnum: String(r.JWFNUM != null ? r.JWFNUM : (r.jwfnum != null ? r.jwfnum : '')),
          jwfdat: String(r.JWFDAT != null ? r.JWFDAT : (r.jwfdat != null ? r.jwfdat : '')),
          jwbtip: String(r.JWBTIP != null ? r.JWBTIP : (r.jwbtip != null ? r.jwbtip : '')),
          accdb:  String(r.ACCDB  != null ? r.ACCDB  : (r.accdb  != null ? r.accdb  : '')),
          acccr:  String(r.ACCCR  != null ? r.ACCCR  : (r.acccr  != null ? r.acccr  : '')),
          amtloc: parseFloat(String(r.AMTLOC != null ? r.AMTLOC : (r.amtloc != null ? r.amtloc : '0')).replace(',', '.')) || 0,
          amteur: parseFloat(String(r.AMTEUR != null ? r.AMTEUR : (r.amteur != null ? r.amteur : '0')).replace(',', '.')) || 0,
          curcd:  String(r.CURCD  != null ? r.CURCD  : (r.curcd  != null ? r.curcd  : '')),
          exrate: parseFloat(String(r.EXRATE != null ? r.EXRATE : (r.exrate != null ? r.exrate : '1')).replace(',', '.')) || 1,
          ccid:   String(r.CCID   != null ? r.CCID   : (r.ccid   != null ? r.ccid   : '')),
          prdid:  String(r.PRDID  != null ? r.PRDID  : (r.prdid  != null ? r.prdid  : '')),
          supid:  String(r.SUPID  != null ? r.SUPID  : (r.supid  != null ? r.supid  : '')),
          jwtxt:  String(r.JWTXT  != null ? r.JWTXT  : (r.jwtxt  != null ? r.jwtxt  : '')),
          yfnmov: String(r.YFNMOV != null ? r.YFNMOV : (r.yfnmov != null ? r.yfnmov : '')),
        };
      });
      var BATCH = 500;
      var inserted = 0;
      for (var i = 0; i < mapped.length; i += BATCH) {
        var batch = mapped.slice(i, i + BATCH);
        await sbFetch('raw_gl_transactions', {
          method: 'POST', prefer: 'return=minimal', body: batch,
        }).catch(function(e) { console.error('[ETL] gl.insertBatch:', e.message); });
        inserted += batch.length;
      }
      return inserted;
    },
    updateCategories: async function(fileId, rowUpdates) {
      var byCategory = {};
      rowUpdates.forEach(function(r) {
        if (!byCategory[r.category]) byCategory[r.category] = [];
        byCategory[r.category].push(r.accdb);
      });
      for (var category in byCategory) {
        var accdbs = [...new Set(byCategory[category])];
        await sbFetch(
          'raw_gl_transactions?file_id=eq.' + fileId +
          '&accdb=in.(' + accdbs.map(function(a) { return '"' + a + '"'; }).join(',') + ')',
          { method: 'PATCH', prefer: 'return=minimal', body: { category: category } }
        ).catch(function(e) { console.error('[ETL] gl.updateCategories:', e.message); });
      }
    },
    updateNumerator: async function(fileId, rowUpdates) {
      var bySign = {};
      rowUpdates.forEach(function(r) {
        var key = String(r.sign_value);
        if (!bySign[key]) bySign[key] = [];
        bySign[key].push(r.accdb);
      });
      for (var sign_value in bySign) {
        var accdbs = [...new Set(bySign[sign_value])];
        await sbFetch(
          'raw_gl_transactions?file_id=eq.' + fileId +
          '&accdb=in.(' + accdbs.map(function(a) { return '"' + a + '"'; }).join(',') + ')',
          { method: 'PATCH', prefer: 'return=minimal', body: { sign_value: parseInt(sign_value) } }
        ).catch(function(e) { console.error('[ETL] gl.updateNumerator:', e.message); });
      }
    },
  },
};

// ─── etlSeedIfEmpty — additive seed: doplní chýbajúce rulesets ──

window.etlSeedIfEmpty = async function() {
  try {
    var SEED_MAPPINGS = [
      {
        name: 'Account → Category', status: 'active',
        rules: [
          { src: '343150', op: '=',    tgt: 'DPH výstupná 20%',  prio: 1 },
          { src: '343200', op: '=',    tgt: 'DPH výstupná 10%',  prio: 1 },
          { src: '343*',   op: 'LIKE', tgt: 'DPH ostatné',       prio: 2 },
          { src: '504100', op: '=',    tgt: 'Materiál výroba',   prio: 1 },
          { src: '504200', op: '=',    tgt: 'Materiál réžia',    prio: 1 },
          { src: '504*',   op: 'LIKE', tgt: 'Materiál ostatné',  prio: 2 },
          { src: '518100', op: '=',    tgt: 'Služby IT',         prio: 1 },
          { src: '518200', op: '=',    tgt: 'Služby právne',     prio: 1 },
          { src: '518*',   op: 'LIKE', tgt: 'Služby ostatné',    prio: 2 },
          { src: '521*',   op: 'LIKE', tgt: 'Mzdy',              prio: 2 },
          { src: '601*',   op: 'LIKE', tgt: 'Tržby výrobky',     prio: 2 },
          { src: '602*',   op: 'LIKE', tgt: 'Tržby služby',      prio: 2 },
          { src: '*',      op: 'ELSE', tgt: 'Nezaradené',        prio: 99 },
        ],
      },
      {
        name: 'Supplier dedupe', status: 'draft',
        rules: [
          { src: 'TATRA BANKA A.S.',  op: '=',    tgt: 'Tatra banka a.s.',     prio: 1 },
          { src: 'TATRABANKA AS',      op: '=',    tgt: 'Tatra banka a.s.',     prio: 1 },
          { src: 'SPP DISTRIBUCIA*',   op: 'LIKE', tgt: 'SPP distribúcia a.s.', prio: 2 },
          { src: 'O2 SLOVAKIA*',       op: 'LIKE', tgt: 'O2 Slovakia s.r.o.',   prio: 2 },
          { src: 'SLOVAK TELEKOM*',    op: 'LIKE', tgt: 'Slovak Telekom a.s.',  prio: 2 },
        ],
      },
      {
        name: 'Product → Group', status: 'draft',
        rules: [
          { src: 'SKU-A-',  op: 'LIKE', tgt: 'Skupina A výrobky',    prio: 1 },
          { src: 'SKU-B-',  op: 'LIKE', tgt: 'Skupina B komponenty', prio: 1 },
          { src: 'SKU-S-*', op: 'LIKE', tgt: 'Skupina S služby',     prio: 1 },
        ],
      },
      {
        name: 'Cost center → Department', status: 'draft',
        rules: [
          { src: 'CC-100', op: '=', tgt: 'Výroba',         prio: 1 },
          { src: 'CC-200', op: '=', tgt: 'Logistika',      prio: 1 },
          { src: 'CC-300', op: '=', tgt: 'Predaj',         prio: 1 },
          { src: 'CC-400', op: '=', tgt: 'Administratíva', prio: 1 },
          { src: 'CC-500', op: '=', tgt: 'IT',             prio: 1 },
        ],
      },
    ];

    var existingMR = await sbFetch('mapping_rulesets?select=id,name&limit=20');
    var existingMRNames = (existingMR || []).map(function(r) { return r.name; });
    for (var i = 0; i < SEED_MAPPINGS.length; i++) {
      var sm = SEED_MAPPINGS[i];
      if (existingMRNames.indexOf(sm.name) !== -1) continue;
      var rsRes = await sbFetch('mapping_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: sm.name, status: sm.status, version: 1 },
      }).catch(function() { return null; });
      var rsId = rsRes && (Array.isArray(rsRes) ? rsRes[0] && rsRes[0].id : rsRes.id);
      if (!rsId) continue;
      for (var j = 0; j < sm.rules.length; j++) {
        await window.etlDB.mapping.saveRule(rsId, sm.rules[j]).catch(function() {});
      }
      console.log('[ETL Seed] Created mapping "' + sm.name + '"');
    }

    var SEED_NUMERATORS = [
      {
        name: 'P&L Sign Numerator', status: 'active',
        rules: [
          { pattern: '5*',     op: 'LIKE', sign: '-1', prio: 2, label: 'Náklady' },
          { pattern: '6*',     op: 'LIKE', sign: '+1', prio: 2, label: 'Výnosy' },
          { pattern: '343150', op: '=',    sign: '-1', prio: 1, label: 'DPH výstupná high' },
          { pattern: '343350', op: '=',    sign: '+1', prio: 1, label: 'DPH vstupná high' },
          { pattern: '518*',   op: 'LIKE', sign: '-1', prio: 2, label: 'Služby' },
          { pattern: '521*',   op: 'LIKE', sign: '-1', prio: 2, label: 'Mzdy' },
          { pattern: '601*',   op: 'LIKE', sign: '+1', prio: 2, label: 'Tržby výrobky' },
          { pattern: '602*',   op: 'LIKE', sign: '+1', prio: 2, label: 'Tržby služby' },
        ],
      },
      {
        name: 'Balance Sheet Sign', status: 'active',
        rules: [
          { pattern: '0*', op: 'LIKE', sign: '+1', prio: 2, label: 'Aktíva DM' },
          { pattern: '1*', op: 'LIKE', sign: '+1', prio: 2, label: 'Aktíva zásoby' },
          { pattern: '2*', op: 'LIKE', sign: '+1', prio: 2, label: 'Aktíva fin' },
          { pattern: '3*', op: 'LIKE', sign: '-1', prio: 2, label: 'Pasíva záväzky' },
          { pattern: '4*', op: 'LIKE', sign: '-1', prio: 2, label: 'Pasíva vlastné high' },
        ],
      },
      {
        name: 'VAT Direction', status: 'active',
        rules: [
          { pattern: '343150', op: '=', sign: 'OUT', prio: 1, label: 'DPH výstup high' },
          { pattern: '343350', op: '=', sign: 'IN',  prio: 1, label: 'DPH vstup high' },
        ],
      },
    ];

    var existingNR = await sbFetch('numerator_rulesets?select=id,name&limit=20');
    var existingNRNames = (existingNR || []).map(function(r) { return r.name; });
    for (var i = 0; i < SEED_NUMERATORS.length; i++) {
      var sn = SEED_NUMERATORS[i];
      if (existingNRNames.indexOf(sn.name) !== -1) continue;
      var rsRes = await sbFetch('numerator_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: sn.name, status: sn.status, version: 1 },
      }).catch(function() { return null; });
      var rsId = rsRes && (Array.isArray(rsRes) ? rsRes[0] && rsRes[0].id : rsRes.id);
      if (!rsId) continue;
      for (var j = 0; j < sn.rules.length; j++) {
        var nr = sn.rules[j];
        await sbFetch('numerator_rules', {
          method: 'POST', prefer: 'return=minimal',
          body: {
            ruleset_id:      rsId,
            account_pattern: nr.pattern,
            operator:        nr.op,
            sign_value:      nr.sign === '+1' ? 1 : nr.sign === '-1' ? -1 : 0,
            priority:        nr.prio,
            label:           nr.label,
          },
        }).catch(function() {});
      }
      console.log('[ETL Seed] Created numerator "' + sn.name + '"');
    }

    console.log('[ETL Seed] Done ✓');
  } catch (e) {
    console.warn('[ETL Seed] Failed:', e.message);
  }
};

// ─── etlDB.files — plural alias ───────────────────────────────
window.etlDB.files = window.etlDB.file;

// ─── etlResetDatabase — vymaže všetky záznamy a znovu seeduje ─
window.etlResetDatabase = async function() {
  var ZERO = '00000000-0000-0000-0000-000000000000';
  var tables = [
    'raw_gl_transactions', 'imported_files', 'pipeline_runs',
    'mapping_rules', 'mapping_rulesets',
    'numerator_rules', 'numerator_rulesets',
    'action_log',
  ];
  for (var i = 0; i < tables.length; i++) {
    await sbFetch(tables[i] + '?id=neq.' + ZERO, { method: 'DELETE' })
      .catch(function() {});
  }
  await window.etlSeedIfEmpty();
  console.log('[ETL Reset] Database reset complete ✓');
};

// ─── Backward-compat aliases (používané v store.jsx a iných miestach) ─────

window.supabaseClient         = { ready: true };
window.dbSaveImportedFile     = function(p)                         { return window.etlDB.file.save(p); };
window.dbListImportedFiles    = function()                          { return sbFetch('imported_files?order=uploaded_at.desc'); };
window.dbInsertGlTransactions = function(fileId, rows)              { return window.etlDB.gl.insertBatch(fileId, rows); };
window.dbUpdateGlCategory     = function(fileId, upd)               { return window.etlDB.gl.updateCategories(fileId, upd); };
window.dbUpdateGlNumerator    = function(fileId, upd)               { return window.etlDB.gl.updateNumerator(fileId, upd); };
window.dbLoadAllMappingRulesets = function()                        { return window.etlDB.mapping.getRulesets(); };
window.dbSaveMappingRule      = function(rulesetId, rule)           { return window.etlDB.mapping.saveRule(rulesetId, rule); };
window.dbLoadMappingRules     = function(name) {
  return sbFetch('mapping_rulesets?name=eq.' + encodeURIComponent(name) +
    '&status=eq.active&select=id,name,version,status,mapping_rules(source_value,operator,target_value,priority)&limit=1'
  ).then(function(r) { return r && r[0]; });
};
window.dbLoadNumeratorRules   = function(name) {
  return sbFetch('numerator_rulesets?name=eq.' + encodeURIComponent(name) +
    '&status=eq.active&select=id,name,version,status,numerator_rules(account_pattern,operator,sign_value,priority,label)&limit=1'
  ).then(function(r) { return r && r[0]; });
};
window.dbAddAuditEntry        = function(action, detail, user)      { return window.etlDB.audit.insert(action, detail, user); };
window.dbLoadAuditLog         = function(limit)                     { return window.etlDB.audit.getLast(limit); };
window.dbLogPipelineRun       = function(phase, status, rows, dur, err) { return window.etlDB.pipeline.log(phase, status, rows, dur, err); };
window.dbLoadPipelineRuns     = function(limit)                     { return sbFetch('pipeline_runs?order=started_at.desc&limit=' + (limit || 20)); };
window.dbLoadGlSummary        = function()                          { return sbFetch('gl_summary'); };

console.log('[ETL Commander] Supabase REST helper initialized ✓', SUPABASE_URL);
