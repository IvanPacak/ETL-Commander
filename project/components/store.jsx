// Global app state — React Context s Supabase persistovaním.
// Každá kľúčová operácia sa ukladá do DB a zapísuje do audit.action_log.

const AppStateContext = React.createContext(null);

function AppStateProvider({ children }) {
  const [uploadedFiles, setUploadedFiles]   = React.useState({});
  const [fileIds, setFileIds]               = React.useState({}); // fileKey → supabase UUID
  const [activeTable, setActiveTable]       = React.useState(null);
  const [mappingRules, setMappingRules]       = React.useState(MAPPING_RULES);
  const [mappingsList, setMappingsList]       = React.useState(window.MAPPINGS || []);
  const [mappingVersions, setMappingVersions] = React.useState({ m1: 13, m2: 3, m3: 2, m4: 1, m5: 1 });
  const [numeratorRules, setNumeratorRules]   = React.useState(NUMERATOR_RULES);
  const [transformedData, setTransformedData] = React.useState({});
  const [auditLog, setAuditLog]             = React.useState([]);
  const [dbAuditLog, setDbAuditLog]         = React.useState([]);
  const [dbReady, setDbReady]               = React.useState(false);
  const [duckDb, setDuckDb]                 = React.useState(null);
  const [duckDbReady, setDuckDbReady]       = React.useState(false);

  // ── Inicializácia: načítaj pravidlá a audit log zo Supabase pri štarte ──
  React.useEffect(() => {
    async function init() {
      try {
        // Načítaj mapping pravidlá zo Supabase (ak existujú)
        const rulesets = await dbLoadAllMappingRulesets();
        if (rulesets && rulesets.length > 0) {
          const merged = { ...MAPPING_RULES };
          rulesets.forEach(rs => {
            if (rs.mapping_rules && rs.mapping_rules.length > 0) {
              // Mapuj DB formát → interný formát store.jsx
              merged['db_' + rs.id] = rs.mapping_rules.map(r => ({
                src:  r.source_value,
                op:   r.operator === 'LIKE' ? 'LIKE' : r.operator === 'ELSE' ? 'ELSE' : '=',
                tgt:  r.target_value,
                prio: r.priority,
              }));
            }
          });
          setMappingRules(merged);
        }

        // Načítaj posledných 50 audit záznamov zo Supabase
        const log = await dbLoadAuditLog(50);
        if (log && log.length > 0) {
          const formatted = log.map(l => ({
            time:   new Date(l.ts).toLocaleString('sk-SK', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            user:   l.user_name,
            action: l.action_type,
            detail: l.detail,
            fromDb: true,
          }));
          setDbAuditLog(formatted);
        }

        setDbReady(true);
        console.log('[ETL Commander] Store initialized from Supabase ✓');
      } catch (e) {
        console.warn('[ETL Commander] Supabase init failed, running offline:', e.message);
        setDbReady(false);
      }
    }
    init();
  }, []);

  // ── DuckDB inicializácia ───────────────────────────────────────────────────
  React.useEffect(() => {
    const initDuck = async () => {
      try {
        if (typeof duckdb === 'undefined') return;
        const JSDELIVR_BUNDLES = duckdb.selectBundle({
          mvp: {
            mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-mvp.wasm',
            mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-browser-mvp.worker.js',
          },
          eh: {
            mainModule: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-eh.wasm',
            mainWorker: 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-browser-eh.worker.js',
          },
        });
        const bundle = await JSDELIVR_BUNDLES;
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule);
        setDuckDb(db);
        setDuckDbReady(true);
        console.log('[ETL Commander] DuckDB ready ✓');
      } catch (e) {
        console.warn('[ETL Commander] DuckDB init failed, JS fallback active:', e.message);
        setDuckDbReady(false);
      }
    };
    initDuck();
  }, []);

  // ── Audit log helper ──────────────────────────────────────────────────────
  const addAuditEntry = React.useCallback(async (action, detail, user = 'Peter Novák') => {
    const now  = new Date();
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    // Pridaj do lokálneho state okamžite (UX)
    setAuditLog(prev => [{ time: `dnes ${time}`, user, action, detail }, ...prev]);
    // Persist do Supabase async (bez blokovania UI)
    dbAddAuditEntry(action, detail, user).catch(e =>
      console.warn('[ETL] audit persist failed:', e.message)
    );
  }, []);

  // ── loadFile: načíta Excel/CSV, uloží do pamäte + Supabase ───────────────
  const loadFile = React.useCallback((file) => {
    return new Promise(async (resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data     = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet    = workbook.Sheets[workbook.SheetNames[0]];
          const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const fileKey  = file.name.replace(/\.(xlsx|csv|xls)$/i, '');
          const cols     = rows.length > 0 ? Object.keys(rows[0]) : [];

          // 1. Lokálny state (okamžite)
          setUploadedFiles(prev => ({ ...prev, [fileKey]: rows }));
          setActiveTable(fileKey);

          // 2. Supabase: zaregistruj súbor
          const ext = file.name.split('.').pop().toLowerCase();
          const fileId = await dbSaveImportedFile({
            fileName: file.name,
            fileType: ['xlsx','xls'].includes(ext) ? 'xlsx' : 'csv',
            rowCount: rows.length,
            colCount: cols.length,
          });

          if (fileId) {
            setFileIds(prev => ({ ...prev, [fileKey]: fileId }));

            // 3. Ak je to GL_TRANSACTIONS, vlož riadky do raw.gl_transactions
            const isGl = fileKey.toLowerCase().includes('gl') ||
                         fileKey.toLowerCase().includes('transaction') ||
                         cols.includes('ACCDB') || cols.includes('accdb');
            if (isGl) {
              const inserted = await dbInsertGlTransactions(fileId, rows);
              console.log(`[ETL] Inserted ${inserted} GL transactions to Supabase`);
              await dbLogPipelineRun('RAW', 'success', inserted, null);
            }
          }

          // 4. Audit log
          await addAuditEntry('file.upload', `Nahraný súbor ${file.name} (${rows.length} riadkov)`);

          resolve({ name: fileKey, rows, columns: cols });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, [addAuditEntry]);

  // ── applyMapping: transformuje v pamäti + update kategórií v Supabase ────
  const applyMapping = React.useCallback(async (tableKey, mappingId, sourceCol, targetColName) => {
    const rows = uploadedFiles[tableKey];
    if (!rows) return null;
    const rules  = mappingRules[mappingId] || [];
    const sorted = [...rules].sort((a, b) => (a.prio || 99) - (b.prio || 99));

    const transformed = rows.map(row => {
      const val = String(row[sourceCol] || '').trim();
      let matched = null;
      for (const rule of sorted) {
        if (rule.op === '=' && val === rule.src) { matched = rule.tgt; break; }
        if (rule.op === 'LIKE') {
          const pat = rule.src.replace(/\*/g, '');
          if (rule.src.endsWith('*') && val.startsWith(pat)) { matched = rule.tgt; break; }
          if (rule.src.startsWith('*') && val.endsWith(pat)) { matched = rule.tgt; break; }
          if (val.includes(pat)) { matched = rule.tgt; break; }
        }
        if (rule.op === 'ELSE') { matched = rule.tgt; }
      }
      return { ...row, [targetColName]: matched || 'Nezaradené' };
    });

    setTransformedData(prev => ({ ...prev, [tableKey + '_mapped']: transformed }));
    await addAuditEntry('mapping.apply', `Mapping ${mappingId} → stĺpec "${targetColName}" (${rows.length} riadkov)`);

    // Persist kategórií do Supabase (async, ak máme fileId)
    const fileId = fileIds[tableKey];
    if (fileId) {
      const updates = transformed.map(r => ({ accdb: String(r[sourceCol] || ''), category: r[targetColName] }));
      dbUpdateGlCategory(fileId, updates)
        .then(() => dbLogPipelineRun('SAVE', 'success', updates.length, null))
        .catch(e => console.warn('[ETL] mapping persist failed:', e.message));
    }

    return transformed;
  }, [uploadedFiles, mappingRules, fileIds, addAuditEntry]);

  // ── applyNumerator: počíta sign + ukladá do Supabase ─────────────────────
  const applyNumerator = React.useCallback(async (tableKey, numeratorId, accountCol, amountCol) => {
    const rows = transformedData[tableKey + '_mapped'] || uploadedFiles[tableKey];
    if (!rows) return null;
    const rules = numeratorRules[numeratorId] || [];

    const withSign = rows.map(row => {
      const account = String(row[accountCol] || '').trim();
      let sign = 0;
      for (const rule of rules) {
        const pat = rule.pattern.replace(/\*/g, '');
        const matches =
          rule.pattern.endsWith('*') ? account.startsWith(pat) :
          rule.pattern.startsWith('*') ? account.endsWith(pat) :
          account === rule.pattern;
        if (matches) {
          sign = rule.sign === '+1' ? 1 : rule.sign === '-1' ? -1 : 0;
          break;
        }
      }
      const orig = parseFloat(String(row[amountCol] || '0').replace(',', '.')) || 0;
      return {
        ...row,
        _sign:            sign,
        _signed_amount:   sign !== 0 ? orig * sign : orig,
        _account_col:     account,
        _amount_orig:     orig,
        _account_category: sign === 1 ? 'Výnos' : sign === -1 ? 'Náklad' : 'Ostatné',
      };
    });

    setTransformedData(prev => ({ ...prev, [tableKey + '_numerator']: withSign }));
    const classified = withSign.filter(r => r._sign !== 0).length;
    await addAuditEntry('numerator.apply', `Numerátor ${numeratorId} aplikovaný — ${classified} riadkov klasifikovaných z ${rows.length}`);

    // Persist sign_value do Supabase (async)
    const fileId = fileIds[tableKey];
    if (fileId) {
      const updates = withSign.map(r => ({
        accdb:         String(r[accountCol] || ''),
        sign_value:    r._sign,
        signed_amount: r._signed_amount,
      }));
      dbUpdateGlNumerator(fileId, updates)
        .then(() => dbLogPipelineRun('ANALYTICS', 'success', classified, null))
        .catch(e => console.warn('[ETL] numerator persist failed:', e.message));
    }

    return withSign;
  }, [uploadedFiles, transformedData, numeratorRules, fileIds, addAuditEntry]);

  // ── deduplicateSuppliers (bez zmeny, lokálne) ─────────────────────────────
  const deduplicateSuppliers = React.useCallback((tableKey, nameCol) => {
    const rows = uploadedFiles[tableKey];
    if (!rows) return null;
    const normalize = (s) => String(s || '').toLowerCase()
      .replace(/[,.\-_]/g, ' ')
      .replace(/\b(sro|s\.r\.o\.|spol|as|a\.s\.|sp|šp|gmbh|ltd|inc)\b/gi, '')
      .replace(/\s+/g, ' ').trim();
    const groups = {};
    rows.forEach(row => {
      const rawName = row[nameCol];
      const norm    = normalize(rawName);
      const existingKey = Object.keys(groups).find(k => {
        const kn = normalize(k);
        return norm.length > 4 && kn.substring(0, 6) === norm.substring(0, 6);
      });
      if (existingKey) {
        if (!groups[existingKey].includes(rawName)) groups[existingKey].push(rawName);
      } else {
        groups[rawName] = [rawName];
      }
    });
    const duplicates = Object.entries(groups).filter(([, v]) => v.length > 1);
    addAuditEntry('dedup.scan', `Nájdených ${duplicates.length} skupín duplikátov v ${rows.length} záznamoch`);
    return { groups, duplicates, totalDuplicates: rows.length - Object.keys(groups).length };
  }, [uploadedFiles, addAuditEntry]);

  // ── createMapping: vytvorí nový mapping a inicializuje pravidlá ──────────
  const createMapping = React.useCallback(async (name, source, target) => {
    const ids = mappingsList.map(m => parseInt(m.id.replace('m', ''))).filter(n => !isNaN(n));
    const nextNum = Math.max(...ids, 0) + 1;
    const newId = 'm' + nextNum;
    setMappingsList(prev => [...prev, { id: newId, name, source: source || '—', target: target || '—', count: 0, keys: [] }]);
    setMappingRules(prev => ({ ...prev, [newId]: [] }));
    await addAuditEntry('mapping.create', `Vytvorený nový mapping "${name}" (${source} → ${target})`);
    return newId;
  }, [mappingsList, addAuditEntry]);

  // ── deleteRule: vymaže pravidlo podľa indexu ─────────────────────────────
  const deleteRule = React.useCallback(async (mappingId, ruleIndex) => {
    let ruleName = '';
    setMappingRules(prev => {
      const rule = (prev[mappingId] || [])[ruleIndex];
      if (rule) ruleName = `"${rule.src} ${rule.op} ${rule.tgt}"`;
      return { ...prev, [mappingId]: (prev[mappingId] || []).filter((_, i) => i !== ruleIndex) };
    });
    await addAuditEntry('mapping.edit', `Zmazané pravidlo ${ruleName} z mappingu ${mappingId}`);
  }, [addAuditEntry]);

  // ── updateRule: aktualizuje pravidlo na danom indexe ─────────────────────
  const updateRule = React.useCallback(async (mappingId, ruleIndex, updatedRule) => {
    setMappingRules(prev => ({
      ...prev,
      [mappingId]: (prev[mappingId] || []).map((r, i) =>
        i === ruleIndex ? { ...updatedRule, prio: Number(updatedRule.prio) || 1 } : r
      ),
    }));
    await addAuditEntry('mapping.edit', `Upravené pravidlo "${updatedRule.src} ${updatedRule.op} ${updatedRule.tgt}" v mappingu ${mappingId}`);
  }, [addAuditEntry]);

  // ── versionMapping: zvýši verziu mappingu ────────────────────────────────
  const versionMapping = React.useCallback(async (mappingId) => {
    const newVersion = (mappingVersions[mappingId] || 1) + 1;
    setMappingVersions(prev => ({ ...prev, [mappingId]: newVersion }));
    const mapping = mappingsList.find(m => m.id === mappingId);
    await addAuditEntry('mapping.version', `Mapping "${mapping?.name || mappingId}" verzovaný ako v${newVersion}`);
    return newVersion;
  }, [mappingVersions, mappingsList, addAuditEntry]);

  // ── addMappingRuleToDb: uloží nové pravidlo do Supabase ───────────────────
  const addMappingRuleToDb = React.useCallback(async (rulesetId, rule) => {
    const id = await dbSaveMappingRule(rulesetId, rule);
    if (id) {
      await addAuditEntry('mapping.edit', `Pridané pravidlo "${rule.src} ${rule.op} ${rule.tgt}"`);
    }
    return id;
  }, [addAuditEntry]);

  // ── runPivotQuery: DuckDB SQL alebo JS fallback agregácia ────────────────
  const runPivotQuery = React.useCallback(async (tableKey, rowDim, valueCols, filters = []) => {
    const allData =
      transformedData[tableKey + '_numerator'] ||
      transformedData[tableKey + '_mapped']    ||
      uploadedFiles[tableKey];
    if (!allData || allData.length === 0) return null;

    const jsFallback = () => {
      const valueCol = valueCols[0];
      const agg = {};
      allData.forEach(row => {
        const key = String(row[rowDim] ?? 'N/A');
        const val = parseFloat(String(row[valueCol] ?? '0').replace(',', '.')) || 0;
        agg[key] = (agg[key] || 0) + val;
      });
      return Object.entries(agg)
        .map(([key, val]) => ({ key, val }))
        .sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
    };

    if (!duckDb) return jsFallback();

    try {
      const conn = await duckDb.connect();
      const tableName = 'tbl_' + tableKey.replace(/[^a-zA-Z0-9]/g, '_');
      const jsonData  = JSON.stringify(allData);
      await conn.query(
        `CREATE OR REPLACE TABLE ${tableName} AS ` +
        `SELECT * FROM read_json_auto('data:application/json,${encodeURIComponent(jsonData)}')`
      );
      const aggExprs = valueCols.map(col =>
        `SUM(TRY_CAST("${col}" AS DOUBLE)) as "${col}_sum"`
      ).join(', ');
      const whereClause = filters.length > 0 ? 'WHERE ' + filters.join(' AND ') : '';
      const sql = `
        SELECT "${rowDim}" as key, ${aggExprs}, COUNT(*) as row_count
        FROM ${tableName} ${whereClause}
        GROUP BY "${rowDim}"
        ORDER BY ABS("${valueCols[0]}_sum") DESC NULLS LAST
      `;
      const result = await conn.query(sql);
      await conn.close();
      return result.toArray().map(row => ({
        key:     String(row.key ?? 'N/A'),
        val:     Number(row[valueCols[0] + '_sum'] ?? 0),
        count:   Number(row.row_count ?? 0),
        allVals: Object.fromEntries(valueCols.map(c => [c, Number(row[c + '_sum'] ?? 0)])),
      }));
    } catch (e) {
      console.warn('[ETL] DuckDB query failed, JS fallback:', e.message);
      return jsFallback();
    }
  }, [duckDb, transformedData, uploadedFiles]);

  // ── Kombinovaný audit log: reálne akcie + DB záznamy ─────────────────────
  const combinedAuditLog = React.useMemo(() => {
    return [...auditLog, ...dbAuditLog];
  }, [auditLog, dbAuditLog]);

  const value = {
    // State
    uploadedFiles, setUploadedFiles,
    fileIds,
    activeTable, setActiveTable,
    mappingRules, setMappingRules,
    numeratorRules, setNumeratorRules,
    transformedData, setTransformedData,
    auditLog: combinedAuditLog,
    setAuditLog,
    dbReady,
    // Actions
    addAuditEntry,
    loadFile,
    applyMapping,
    applyNumerator,
    deduplicateSuppliers,
    addMappingRuleToDb,
    mappingsList, setMappingsList,
    mappingVersions,
    createMapping, deleteRule, updateRule, versionMapping,
    duckDbReady, runPivotQuery,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

const useAppState = () => React.useContext(AppStateContext);
window.AppStateProvider = AppStateProvider;
window.useAppState = useAppState;
