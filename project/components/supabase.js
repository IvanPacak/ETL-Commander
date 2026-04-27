// ─────────────────────────────────────────────────────────────
//  ETL Commander · Supabase client helper
//  Načítaj tento súbor PRED store.jsx v index.html:
//  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//  <script type="text/babel" src="components/supabase.js"></script>
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://clnkarllsszrlobvxtdw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbmthcmxsc3N6cmxvYnZ4dGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTk4MTgsImV4cCI6MjA5Mjg5NTgxOH0.R1eZbSvllLRrxq_SNhhv_0HvYQ8FZ9D5x3KnZhNZhr4';

// Inicializácia klienta (Supabase UMD bundle musí byť načítaný pred týmto)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── IMPORTED FILES ───────────────────────────────────────────

async function dbSaveImportedFile({ fileName, fileType, rowCount, colCount }) {
  const { data, error } = await supabase
    .from('imported_files')
    .insert({ file_name: fileName, file_type: fileType, row_count: rowCount, col_count: colCount })
    .select('id')
    .single();
  if (error) { console.error('[ETL] dbSaveImportedFile:', error.message); return null; }
  return data.id;
}

async function dbListImportedFiles() {
  const { data, error } = await supabase
    .from('imported_files')
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (error) { console.error('[ETL] dbListImportedFiles:', error.message); return []; }
  return data;
}

// ─── GL TRANSACTIONS ──────────────────────────────────────────

async function dbInsertGlTransactions(fileId, rows) {
  // Mapuj stĺpce z AS400 Excel (uppercase) na DB schému (lowercase)
  const mapped = rows.map(r => ({
    file_id:  fileId,
    jwfcdn:   String(r.JWFCDN  ?? r.jwfcdn  ?? ''),
    jwfnum:   String(r.JWFNUM  ?? r.jwfnum  ?? ''),
    jwfdat:   String(r.JWFDAT  ?? r.jwfdat  ?? ''),
    jwbtip:   String(r.JWBTIP  ?? r.jwbtip  ?? ''),
    accdb:    String(r.ACCDB   ?? r.accdb   ?? ''),
    acccr:    String(r.ACCCR   ?? r.acccr   ?? ''),
    amtloc:   parseFloat(String(r.AMTLOC ?? r.amtloc ?? '0').replace(',', '.')) || 0,
    amteur:   parseFloat(String(r.AMTEUR ?? r.amteur ?? '0').replace(',', '.')) || 0,
    curcd:    String(r.CURCD   ?? r.curcd   ?? ''),
    exrate:   parseFloat(String(r.EXRATE ?? r.exrate ?? '1').replace(',', '.')) || 1,
    ccid:     String(r.CCID    ?? r.ccid    ?? ''),
    prdid:    String(r.PRDID   ?? r.prdid   ?? ''),
    supid:    String(r.SUPID   ?? r.supid   ?? ''),
    jwtxt:    String(r.JWTXT   ?? r.jwtxt   ?? ''),
    yfnmov:   String(r.YFNMOV  ?? r.yfnmov  ?? ''),
  }));

  // Vkladáme po 500 riadkoch (Supabase limit)
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < mapped.length; i += BATCH) {
    const batch = mapped.slice(i, i + BATCH);
    const { error } = await supabase.from('raw_gl_transactions').insert(batch);
    if (error) { console.error(`[ETL] dbInsertGlTransactions batch ${i}:`, error.message); return inserted; }
    inserted += batch.length;
  }
  return inserted;
}

async function dbUpdateGlCategory(fileId, rowUpdates) {
  // rowUpdates: [{ accdb, category }] — hromadný update podľa accdb
  // Zoskupíme podľa category a robíme UPDATE per category
  const byCategory = {};
  rowUpdates.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r.accdb);
  });

  for (const [category, accdbs] of Object.entries(byCategory)) {
    const { error } = await supabase
      .from('raw_gl_transactions')
      .update({ category })
      .eq('file_id', fileId)
      .in('accdb', [...new Set(accdbs)]);
    if (error) console.error(`[ETL] dbUpdateGlCategory "${category}":`, error.message);
  }
}

async function dbUpdateGlNumerator(fileId, rowUpdates) {
  // rowUpdates: [{ accdb, sign_value, signed_amount }]
  const bySign = {};
  rowUpdates.forEach(r => {
    const key = r.sign_value;
    if (!bySign[key]) bySign[key] = [];
    bySign[key].push(r.accdb);
  });

  for (const [sign_value, accdbs] of Object.entries(bySign)) {
    const { error } = await supabase
      .from('raw_gl_transactions')
      .update({ sign_value: parseInt(sign_value) })
      .eq('file_id', fileId)
      .in('accdb', [...new Set(accdbs)]);
    if (error) console.error(`[ETL] dbUpdateGlNumerator sign=${sign_value}:`, error.message);
  }

  // Refresh materialized view
  await supabase.rpc('refresh_gl_summary').catch(() => {});
}

// ─── MAPPING RULES ────────────────────────────────────────────

async function dbLoadMappingRules(rulesetName) {
  const { data, error } = await supabase
    .from('mapping_rulesets')
    .select('id, name, version, status, mapping_rules(source_value, operator, target_value, priority)')
    .eq('name', rulesetName)
    .eq('status', 'active')
    .single();
  if (error) { console.error('[ETL] dbLoadMappingRules:', error.message); return null; }
  return data;
}

async function dbLoadAllMappingRulesets() {
  const { data, error } = await supabase
    .from('mapping_rulesets')
    .select('id, name, version, status, mapping_rules(id, source_value, operator, target_value, priority)')
    .order('created_at', { ascending: false });
  if (error) { console.error('[ETL] dbLoadAllMappingRulesets:', error.message); return []; }
  return data;
}

async function dbSaveMappingRule(rulesetId, rule) {
  const { data, error } = await supabase
    .from('mapping_rules')
    .insert({
      ruleset_id:   rulesetId,
      source_value: rule.src,
      operator:     rule.op,
      target_value: rule.tgt,
      priority:     rule.prio || 50,
    })
    .select('id')
    .single();
  if (error) { console.error('[ETL] dbSaveMappingRule:', error.message); return null; }
  return data.id;
}

// ─── NUMERATOR RULES ─────────────────────────────────────────

async function dbLoadNumeratorRules(rulesetName) {
  const { data, error } = await supabase
    .from('numerator_rulesets')
    .select('id, name, version, status, numerator_rules(account_pattern, operator, sign_value, priority, label)')
    .eq('name', rulesetName)
    .eq('status', 'active')
    .single();
  if (error) { console.error('[ETL] dbLoadNumeratorRules:', error.message); return null; }
  return data;
}

// ─── AUDIT LOG ────────────────────────────────────────────────

async function dbAddAuditEntry(actionType, detail, userName = 'demo_user', metadata = {}) {
  const { error } = await supabase
    .from('action_log')
    .insert({ action_type: actionType, detail, user_name: userName, metadata });
  if (error) console.error('[ETL] dbAddAuditEntry:', error.message);
}

async function dbLoadAuditLog(limit = 100) {
  const { data, error } = await supabase
    .from('action_log')
    .select('*')
    .order('ts', { ascending: false })
    .limit(limit);
  if (error) { console.error('[ETL] dbLoadAuditLog:', error.message); return []; }
  return data;
}

// ─── PIPELINE RUNS ────────────────────────────────────────────

async function dbLogPipelineRun(phase, status, rowsProcessed, durationSeconds, errorMessage = null) {
  const { error } = await supabase
    .from('pipeline_runs')
    .insert({ phase, status, rows_processed: rowsProcessed, duration_seconds: durationSeconds, error_message: errorMessage, finished_at: new Date().toISOString() });
  if (error) console.error('[ETL] dbLogPipelineRun:', error.message);
}

async function dbLoadPipelineRuns(limit = 20) {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[ETL] dbLoadPipelineRuns:', error.message); return []; }
  return data;
}

// ─── ANALYTICS ───────────────────────────────────────────────

async function dbLoadGlSummary() {
  const { data, error } = await supabase
    .from('gl_summary')
    .select('*');
  if (error) { console.error('[ETL] dbLoadGlSummary:', error.message); return []; }
  return data;
}

// ─── EXPORTS ─────────────────────────────────────────────────

Object.assign(window, {
  supabaseClient: supabase,
  dbSaveImportedFile,
  dbListImportedFiles,
  dbInsertGlTransactions,
  dbUpdateGlCategory,
  dbUpdateGlNumerator,
  dbLoadMappingRules,
  dbLoadAllMappingRulesets,
  dbSaveMappingRule,
  dbLoadNumeratorRules,
  dbAddAuditEntry,
  dbLoadAuditLog,
  dbLogPipelineRun,
  dbLoadPipelineRuns,
  dbLoadGlSummary,
});

console.log('[ETL Commander] Supabase client initialized ✓', SUPABASE_URL);
