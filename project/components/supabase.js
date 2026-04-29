// ─────────────────────────────────────────────────────────────
//  ETL Commander · Supabase REST helper (vanilla fetch, žiadna knižnica)
//  Načítaj ako plain <script src="components/supabase.js"> PRED store.jsx
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://clnkarllsszrlobvxtdw.supabase.co';
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbmthcmxsc3N6cmxvYnZ4dGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTk4MTgsImV4cCI6MjA5Mjg5NTgxOH0.R1eZbSvllLRrxq_SNhhv_0HvYQ8FZ9D5x3KnZhNZhr4';

function sbFetch(path, options) {
  options = options || {};
  var method  = (options.method || 'GET').toUpperCase();
  var token   = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('etl_token')) || ANON_KEY;
  var headers = {
    'apikey':        ANON_KEY,
    'Authorization': 'Bearer ' + token,
    'Content-Type':  'application/json',
  };
  if (options.prefer)  headers['Prefer']  = options.prefer;
  if (options.headers) Object.assign(headers, options.headers);

  return fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method:  method,
    headers: headers,
    body:    options.body !== undefined ? JSON.stringify(options.body) : undefined,
  }).then(function(res) {
    if (!res.ok) {
      return res.json().catch(function() { return {}; }).then(function(errBody) {
        throw new Error('[sbFetch ' + method + ' /' + path.split('?')[0] + '] ' + (errBody.message || res.statusText));
      });
    }
    if (res.status === 204) return null;
    return res.text().then(function(text) { return text ? JSON.parse(text) : null; });
  });
}

// ─── window.etlDB ─────────────────────────────────────────────

window.etlDB = {

  mapping: {
    getRulesets: function() {
      return sbFetch('mapping_rulesets?select=*,mapping_rules(*)&order=created_at.asc');
    },

    saveRule: function(rulesetId, rule) {
      return sbFetch('mapping_rules', {
        method: 'POST', prefer: 'return=representation',
        body: {
          ruleset_id:   rulesetId,
          source_value: rule.src,
          operator:     rule.op,
          target_value: rule.tgt,
          priority:     Number(rule.prio) || 99,
        },
      }).then(function(res) {
        var row = Array.isArray(res) ? res[0] : res;
        return row ? row.id : null;
      });
    },

    deleteRule: function(ruleId) {
      return sbFetch('mapping_rules?id=eq.' + ruleId, { method: 'DELETE' });
    },

    activateRuleset: function(rulesetId, activatedBy) {
      return sbFetch('mapping_rulesets?id=eq.' + rulesetId, {
        method: 'PATCH', prefer: 'return=minimal',
        body: { status: 'active', activated_at: new Date().toISOString(), activated_by: activatedBy || 'Peter Novák' },
      });
    },

    createRuleset: function(name, createdBy) {
      return sbFetch('mapping_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: name, status: 'draft', version: 1, created_by: createdBy || 'Peter Novák' },
      }).then(function(res) {
        return Array.isArray(res) ? res[0] : res;
      });
    },
  },

  numerator: {
    getRulesets: function() {
      return sbFetch('numerator_rulesets?select=*,numerator_rules(*)&order=created_at.asc');
    },

    saveRule: function(rulesetId, rule) {
      return sbFetch('numerator_rules', {
        method: 'POST', prefer: 'return=representation',
        body: {
          ruleset_id:      rulesetId,
          account_pattern: rule.pattern || rule.src || '',
          operator:        rule.op || 'LIKE',
          sign_value:      typeof rule.sign === 'number' ? rule.sign
                           : (rule.sign === '+1' || rule.sign === 1 ? 1 : -1),
          priority:        Number(rule.prio) || 99,
          label:           rule.label || rule.category || '',
        },
      }).then(function(res) {
        var row = Array.isArray(res) ? res[0] : res;
        return row ? row.id : null;
      });
    },

    deleteRule: function(ruleId) {
      return sbFetch('numerator_rules?id=eq.' + ruleId, { method: 'DELETE' });
    },

    activateRuleset: function(rulesetId, activatedBy) {
      return sbFetch('numerator_rulesets?id=eq.' + rulesetId, {
        method: 'PATCH', prefer: 'return=minimal',
        body: { status: 'active', activated_at: new Date().toISOString(), activated_by: activatedBy || 'Peter Novák' },
      });
    },

    createRuleset: function(name, createdBy) {
      return sbFetch('numerator_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: name, status: 'draft', version: 1, created_by: createdBy || 'Peter Novák' },
      }).then(function(res) {
        return Array.isArray(res) ? res[0] : res;
      });
    },
  },

  audit: {
    insert: function(actionType, detail, userName) {
      return sbFetch('action_log', {
        method: 'POST', prefer: 'return=minimal',
        body: {
          action_type: actionType,
          detail:      detail,
          user_name:   userName || 'Peter Novák',
          ts:          new Date().toISOString(),
          metadata:    {},
        },
      });
    },
    getLast: function(limit) {
      return sbFetch('action_log?order=ts.desc&limit=' + (limit || 100));
    },
  },

  pipeline: {
    getLast7Days: function() {
      var since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return sbFetch('pipeline_runs?started_at=gte.' + since + '&order=started_at.desc&limit=50');
    },
    insert: function(phase, status, rowsProcessed, durationSeconds, triggeredBy) {
      var now = new Date().toISOString();
      return sbFetch('pipeline_runs', {
        method: 'POST', prefer: 'return=minimal',
        body: {
          phase:            phase,
          status:           status,
          rows_processed:   rowsProcessed || 0,
          duration_seconds: durationSeconds || 0,
          triggered_by:     triggeredBy || 'manual',
          started_at:       now,
          finished_at:      now,
        },
      });
    },
  },

  files: {
    getAll: function() {
      return sbFetch('imported_files?order=uploaded_at.desc&limit=50');
    },
    insert: function(fileName, rowCount, colCount, fileType, uploadedBy) {
      return sbFetch('imported_files', {
        method: 'POST', prefer: 'return=representation',
        body: {
          file_name:   fileName,
          file_type:   fileType || 'xlsx',
          row_count:   rowCount || 0,
          col_count:   colCount || 0,
          uploaded_by: uploadedBy || window.__ETL_USER__ || 'Peter Novák',
          status:      'loaded',
          uploaded_at: new Date().toISOString(),
        },
      }).then(function(res) {
        var row = Array.isArray(res) ? res[0] : res;
        return row ? row.id : null;
      });
    },
  },

  reset: {
    allData: async function() {
      var ZERO = '00000000-0000-0000-0000-000000000000';
      await sbFetch('action_log?id=gt.0',                                   { method: 'DELETE' }).catch(function() {});
      await sbFetch('pipeline_runs?phase=neq.___never___',                   { method: 'DELETE' }).catch(function() {});
      await sbFetch('imported_files?id=neq.'  + ZERO,                       { method: 'DELETE' }).catch(function() {});
      await sbFetch('mapping_rules?id=neq.'   + ZERO,                       { method: 'DELETE' }).catch(function() {});
      await sbFetch('mapping_rulesets?id=neq.' + ZERO,                      { method: 'DELETE' }).catch(function() {});
      await sbFetch('numerator_rules?id=neq.' + ZERO,                       { method: 'DELETE' }).catch(function() {});
      await sbFetch('numerator_rulesets?id=neq.' + ZERO,                    { method: 'DELETE' }).catch(function() {});
      await window.etlSeedIfEmpty();
      console.log('[ETL Reset] Database reset complete ✓');
    },
  },
};

// ─── window.etlSeedIfEmpty — additive, nikdy duplikáty ────────

window.etlSeedIfEmpty = async function() {
  try {
    var SEED_MAPPINGS = [
      {
        name: 'Account → Category', status: 'active',
        rules: [
          { src: '343150', op: '=',    tgt: 'DPH výstupná 20%',  prio: 1  },
          { src: '343200', op: '=',    tgt: 'DPH výstupná 10%',  prio: 1  },
          { src: '343*',   op: 'LIKE', tgt: 'DPH ostatné',       prio: 2  },
          { src: '504100', op: '=',    tgt: 'Materiál výroba',   prio: 1  },
          { src: '504200', op: '=',    tgt: 'Materiál réžia',    prio: 1  },
          { src: '504*',   op: 'LIKE', tgt: 'Materiál ostatné',  prio: 2  },
          { src: '518100', op: '=',    tgt: 'Služby IT',         prio: 1  },
          { src: '518200', op: '=',    tgt: 'Služby právne',     prio: 1  },
          { src: '518*',   op: 'LIKE', tgt: 'Služby ostatné',    prio: 2  },
          { src: '521*',   op: 'LIKE', tgt: 'Mzdy',              prio: 2  },
          { src: '601*',   op: 'LIKE', tgt: 'Tržby výrobky',     prio: 2  },
          { src: '602*',   op: 'LIKE', tgt: 'Tržby služby',      prio: 2  },
          { src: '*',      op: 'ELSE', tgt: 'Nezaradené',        prio: 99 },
        ],
      },
      {
        name: 'Supplier dedupe', status: 'draft',
        rules: [
          { src: 'TATRA BANKA A.S.',  op: '=',    tgt: 'Tatra banka a.s.',     prio: 1 },
          { src: 'TATRABANKA AS',     op: '=',    tgt: 'Tatra banka a.s.',     prio: 1 },
          { src: 'SPP DISTRIBUCIA*',  op: 'LIKE', tgt: 'SPP distribúcia a.s.', prio: 2 },
          { src: 'O2 SLOVAKIA*',      op: 'LIKE', tgt: 'O2 Slovakia s.r.o.',   prio: 2 },
          { src: 'SLOVAK TELEKOM*',   op: 'LIKE', tgt: 'Slovak Telekom a.s.',  prio: 2 },
        ],
      },
      {
        name: 'Product → Group', status: 'draft',
        rules: [
          { src: 'SKU-A-*', op: 'LIKE', tgt: 'Skupina A výrobky',    prio: 1 },
          { src: 'SKU-B-*', op: 'LIKE', tgt: 'Skupina B komponenty', prio: 1 },
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

    var SEED_NUMERATORS = [
      {
        name: 'P&L Sign Numerator', status: 'active',
        rules: [
          { pattern: '5*',     op: 'LIKE', sign: -1, prio: 1, label: 'Náklady'       },
          { pattern: '6*',     op: 'LIKE', sign:  1, prio: 1, label: 'Výnosy'        },
          { pattern: '343150', op: '=',    sign: -1, prio: 0, label: 'DPH výstupná'  },
          { pattern: '343350', op: '=',    sign:  1, prio: 0, label: 'DPH vstupná'   },
          { pattern: '518*',   op: 'LIKE', sign: -1, prio: 2, label: 'Služby'        },
          { pattern: '521*',   op: 'LIKE', sign: -1, prio: 2, label: 'Mzdy'          },
          { pattern: '601*',   op: 'LIKE', sign:  1, prio: 2, label: 'Tržby výrobky' },
          { pattern: '602*',   op: 'LIKE', sign:  1, prio: 2, label: 'Tržby služby'  },
        ],
      },
      {
        name: 'Balance Sheet Sign', status: 'active',
        rules: [
          { pattern: '0*', op: 'LIKE', sign:  1, prio: 1, label: 'Aktíva DM'      },
          { pattern: '1*', op: 'LIKE', sign:  1, prio: 1, label: 'Aktíva zásoby'  },
          { pattern: '2*', op: 'LIKE', sign:  1, prio: 1, label: 'Aktíva fin'     },
          { pattern: '3*', op: 'LIKE', sign: -1, prio: 1, label: 'Pasíva záväzky' },
          { pattern: '4*', op: 'LIKE', sign: -1, prio: 0, label: 'Pasíva vlastné' },
        ],
      },
      {
        name: 'VAT Direction', status: 'active',
        rules: [
          { pattern: '343150', op: '=', sign: -1, prio: 0, label: 'DPH výstup' },
          { pattern: '343350', op: '=', sign:  1, prio: 0, label: 'DPH vstup'  },
        ],
      },
    ];

    var existingMR = await sbFetch('mapping_rulesets?select=name&limit=20').catch(function() { return []; });
    var existingMRNames = (existingMR || []).map(function(r) { return r.name; });
    for (var i = 0; i < SEED_MAPPINGS.length; i++) {
      var sm = SEED_MAPPINGS[i];
      if (existingMRNames.indexOf(sm.name) !== -1) continue;
      var rsRes = await sbFetch('mapping_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: sm.name, status: sm.status, version: 1, created_by: 'system' },
      }).catch(function() { return null; });
      var rsId = rsRes && (Array.isArray(rsRes) ? rsRes[0] && rsRes[0].id : rsRes.id);
      if (!rsId) continue;
      for (var j = 0; j < sm.rules.length; j++) {
        await window.etlDB.mapping.saveRule(rsId, sm.rules[j]).catch(function() {});
      }
      console.log('[ETL Seed] Created mapping "' + sm.name + '"');
    }

    var existingNR = await sbFetch('numerator_rulesets?select=name&limit=20').catch(function() { return []; });
    var existingNRNames = (existingNR || []).map(function(r) { return r.name; });
    for (var i = 0; i < SEED_NUMERATORS.length; i++) {
      var sn = SEED_NUMERATORS[i];
      if (existingNRNames.indexOf(sn.name) !== -1) continue;
      var rsRes = await sbFetch('numerator_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: sn.name, status: sn.status, version: 1, created_by: 'system' },
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
            sign_value:      nr.sign,
            priority:        nr.prio,
            label:           nr.label,
          },
        }).catch(function() {});
      }
      console.log('[ETL Seed] Created numerator "' + sn.name + '"');
    }

    await window.etlDB.audit.insert('system.seed', 'Seed dáta vložené', 'system').catch(function() {});
    console.log('[ETL Seed] Done ✓');
  } catch (e) {
    console.warn('[ETL Seed] Failed:', e.message);
  }
};

// ─── window.etlResetDatabase — backward compat alias ──────────
window.etlResetDatabase = function() { return window.etlDB.reset.allData(); };

// ─── window.etlAuth — Supabase Auth ───────────────────────────

window.etlAuth = {
  signIn: async function(email, password) {
    var r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    });
    var data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.message || 'Prihlásenie zlyhalo');
    sessionStorage.setItem('etl_token', data.access_token);
    sessionStorage.setItem('etl_user_email', data.user && data.user.email ? data.user.email : email);
    sessionStorage.setItem('etl_user_id',    data.user && data.user.id   ? data.user.id   : '');
    window.__ETL_USER__ = data.user && data.user.email ? data.user.email : email;
    return data;
  },

  signOut: async function() {
    var token = sessionStorage.getItem('etl_token');
    if (token) {
      await fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + token },
      }).catch(function() {});
    }
    sessionStorage.removeItem('etl_token');
    sessionStorage.removeItem('etl_user_email');
    sessionStorage.removeItem('etl_user_id');
    window.__ETL_USER__ = null;
  },

  getSession: function() {
    var token = sessionStorage.getItem('etl_token');
    var email = sessionStorage.getItem('etl_user_email');
    if (!token) return null;
    return { token: token, email: email };
  },

  isLoggedIn: function() {
    return !!sessionStorage.getItem('etl_token');
  },
};

// ─── window.etlCreateFirstUser — one-time helper (run from console) ──
window.etlCreateFirstUser = async function() {
  var r = await fetch(SUPABASE_URL + '/auth/v1/signup', {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'peter.novak@etlcommander.sk', password: 'ETLCommander2026!' }),
  });
  var data = await r.json();
  console.log('[ETL] createFirstUser result:', data);
  return data;
};

// ─── Backward-compat window aliases ───────────────────────────

window.supabaseClient            = { ready: true };
window.dbSaveImportedFile        = function(p) { return window.etlDB.files.insert(p.fileName, p.rowCount, p.colCount, p.fileType, p.uploadedBy); };
window.dbListImportedFiles       = function()  { return window.etlDB.files.getAll(); };
window.dbLoadAllMappingRulesets  = function()  { return window.etlDB.mapping.getRulesets(); };
window.dbSaveMappingRule         = function(rsId, rule) { return window.etlDB.mapping.saveRule(rsId, rule); };
window.dbAddAuditEntry           = function(a, d, u)    { return window.etlDB.audit.insert(a, d, u); };
window.dbLoadAuditLog            = function(limit)      { return window.etlDB.audit.getLast(limit); };
window.dbLogPipelineRun          = function(ph, st, r, dur) { return window.etlDB.pipeline.insert(ph, st, r, dur); };
window.dbLoadPipelineRuns        = function(limit) { return sbFetch('pipeline_runs?order=started_at.desc&limit=' + (limit || 20)); };

// gl helpers used by store.jsx
window.etlDB.gl = {
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
      var accdbs = Array.from(new Set(byCategory[category]));
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
      var accdbs = Array.from(new Set(bySign[sign_value]));
      await sbFetch(
        'raw_gl_transactions?file_id=eq.' + fileId +
        '&accdb=in.(' + accdbs.map(function(a) { return '"' + a + '"'; }).join(',') + ')',
        { method: 'PATCH', prefer: 'return=minimal', body: { sign_value: parseInt(sign_value) } }
      ).catch(function(e) { console.error('[ETL] gl.updateNumerator:', e.message); });
    }
  },
};

// ─── Keep etlDB.file as alias for etlDB.files ─────────────────
window.etlDB.file = window.etlDB.files;

console.log('[ETL Commander] Supabase REST helper initialized ✓', SUPABASE_URL);
