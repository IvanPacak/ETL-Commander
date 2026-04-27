// Global app state — React Context powering real data operations.

const AppStateContext = React.createContext(null);

function AppStateProvider({ children }) {
  const [uploadedFiles, setUploadedFiles] = React.useState({});
  const [activeTable, setActiveTable] = React.useState(null);
  const [mappingRules, setMappingRules] = React.useState(MAPPING_RULES);
  const [numeratorRules, setNumeratorRules] = React.useState(NUMERATOR_RULES);
  const [transformedData, setTransformedData] = React.useState({});
  const [auditLog, setAuditLog] = React.useState([]);

  const addAuditEntry = (action, detail, user = 'Peter Novák') => {
    const now = new Date();
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    setAuditLog(prev => [{ time: `dnes ${time}`, user, action, detail }, ...prev]);
  };

  const loadFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          const fileKey = file.name.replace(/\.(xlsx|csv|xls)$/i, '');
          setUploadedFiles(prev => ({ ...prev, [fileKey]: rows }));
          setActiveTable(fileKey);
          addAuditEntry('file.upload', `Nahraný súbor ${file.name} (${rows.length} riadkov)`);
          resolve({
            name: fileKey,
            rows,
            columns: rows.length > 0 ? Object.keys(rows[0]) : [],
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const applyMapping = (tableKey, mappingId, sourceCol, targetColName) => {
    const rows = uploadedFiles[tableKey];
    if (!rows) return null;
    const rules = mappingRules[mappingId] || [];
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
    addAuditEntry('mapping.apply', `Mapping ${mappingId} → stĺpec "${targetColName}" (${rows.length} riadkov)`);
    return transformed;
  };

  const applyNumerator = (tableKey, numeratorId, accountCol, amountCol) => {
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
        _sign: sign,
        _signed_amount: sign !== 0 ? orig * sign : orig,
        _account_col: account,
        _amount_orig: orig,
        _account_category: sign === 1 ? 'Výnos' : sign === -1 ? 'Náklad' : 'Ostatné',
      };
    });

    setTransformedData(prev => ({ ...prev, [tableKey + '_numerator']: withSign }));
    const classified = withSign.filter(r => r._sign !== 0).length;
    addAuditEntry('numerator.apply', `Numerátor ${numeratorId} aplikovaný — ${classified} riadkov klasifikovaných z ${rows.length}`);
    return withSign;
  };

  const deduplicateSuppliers = (tableKey, nameCol) => {
    const rows = uploadedFiles[tableKey];
    if (!rows) return null;

    const normalize = (s) => String(s || '').toLowerCase()
      .replace(/[,.\-_]/g, ' ')
      .replace(/\b(sro|s\.r\.o\.|spol|as|a\.s\.|sp|šp|gmbh|ltd|inc)\b/gi, '')
      .replace(/\s+/g, ' ').trim();

    const groups = {};
    rows.forEach((row) => {
      const rawName = row[nameCol];
      const norm = normalize(rawName);
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
  };

  const value = {
    uploadedFiles, setUploadedFiles,
    activeTable, setActiveTable,
    mappingRules, setMappingRules,
    numeratorRules, setNumeratorRules,
    transformedData, setTransformedData,
    auditLog, setAuditLog,
    addAuditEntry,
    loadFile,
    applyMapping,
    applyNumerator,
    deduplicateSuppliers,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

const useAppState = () => React.useContext(AppStateContext);
window.AppStateProvider = AppStateProvider;
window.useAppState = useAppState;
