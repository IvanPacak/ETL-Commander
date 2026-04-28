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
      return sbFetch('pipeline_runs?order=started_at.desc&limit=7');
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

// ─── etlSeedIfEmpty — vloží demo dáta ak je DB prázdna ───────

window.etlSeedIfEmpty = async function() {
  try {
    var existing = await sbFetch('mapping_rulesets?select=id&limit=1');
    if (existing && existing.length > 0) {
      console.log('[ETL Seed] DB already seeded, skipping');
      return;
    }
    console.log('[ETL Seed] Empty DB — seeding from local constants...');
    var mappings   = window.MAPPINGS       || [];
    var mRules     = window.MAPPING_RULES  || {};
    var numerators = window.NUMERATORS     || [];
    var nRules     = window.NUMERATOR_RULES || {};

    for (var i = 0; i < mappings.length; i++) {
      var m = mappings[i];
      var rsRes = await sbFetch('mapping_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: m.name, status: 'active', version: 1 },
      }).catch(function() { return null; });
      var rsId = rsRes && (Array.isArray(rsRes) ? rsRes[0] && rsRes[0].id : rsRes.id);
      if (!rsId) continue;
      var rules = mRules[m.id] || [];
      for (var j = 0; j < rules.length; j++) {
        await window.etlDB.mapping.saveRule(rsId, rules[j]).catch(function() {});
      }
    }
    for (var i = 0; i < numerators.length; i++) {
      var n = numerators[i];
      var rsRes = await sbFetch('numerator_rulesets', {
        method: 'POST', prefer: 'return=representation',
        body: { name: n.name, status: n.status === 'Active' ? 'active' : 'draft', version: 1 },
      }).catch(function() { return null; });
      var rsId = rsRes && (Array.isArray(rsRes) ? rsRes[0] && rsRes[0].id : rsRes.id);
      if (!rsId) continue;
      var rules = nRules[n.id] || [];
      for (var j = 0; j < rules.length; j++) {
        await window.etlDB.numerator.saveRule(rsId, rules[j]).catch(function() {});
      }
    }
    console.log('[ETL Seed] Done ✓');
  } catch (e) {
    console.warn('[ETL Seed] Failed:', e.message);
  }
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
