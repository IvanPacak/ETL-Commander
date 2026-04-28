// Section 9 — Pivot Reports (DuckDB-powered)
function SectionPivot() {
  const { uploadedFiles, transformedData, duckDbReady, runPivotQuery, addAuditEntry } = useAppState();

  const [activeId, setActiveId]             = React.useState(null);
  const [pivotRows, setPivotRows]           = React.useState([]);
  const [pivotCols, setPivotCols]           = React.useState([]);
  const [pivotValues, setPivotValues]       = React.useState([]);
  const [pivotFilters, setPivotFilters]     = React.useState([]);
  const [pivotResult, setPivotResult]       = React.useState(null);
  const [availableCols, setAvailableCols]   = React.useState([]);
  const [isComputing, setIsComputing]       = React.useState(false);
  const [draggedCol, setDraggedCol]         = React.useState(null);
  const [activeDropZone, setActiveDropZone] = React.useState(null);
  const [savedLayouts, setSavedLayouts]     = React.useState([]);

  const p = savedLayouts.find(x => x.id === activeId) || savedLayouts[0];

  const fmt = (n) => {
    const sign = n < 0 ? '-' : '';
    return sign + Math.abs(n).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const hasUploaded = Object.keys(uploadedFiles).length > 0 || Object.keys(transformedData).length > 0;

  // Sync available columns from uploaded/transformed data
  React.useEffect(() => {
    const allData =
      Object.values(transformedData).find(d => d.length > 0) ||
      Object.values(uploadedFiles).find(d => d.length > 0);
    if (allData && allData.length > 0) {
      setAvailableCols(Object.keys(allData[0]).filter(c => !c.startsWith('_')));
    } else {
      setAvailableCols([]);
    }
  }, [uploadedFiles, transformedData]);

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const removeFromAllZones = (col) => {
    setPivotRows(r => r.filter(c => c !== col));
    setPivotCols(c => c.filter(c2 => c2 !== col));
    setPivotValues(v => v.filter(c => c !== col));
    setPivotFilters(f => f.filter(c => c !== col));
  };

  const addToZone = (zone, col) => {
    removeFromAllZones(col);
    if (zone === 'rows')    setPivotRows(r => [...r, col]);
    if (zone === 'cols')    setPivotCols(c => [...c, col]);
    if (zone === 'values')  setPivotValues(v => [...v, col]);
    if (zone === 'filters') setPivotFilters(f => [...f, col]);
    setPivotResult(null);
  };

  const handleDrop = (zone) => (e) => {
    e.preventDefault();
    if (!draggedCol) return;
    addToZone(zone, draggedCol);
    setDraggedCol(null);
    setActiveDropZone(null);
  };

  // ── Click to add (1st click → Rows, 2nd → Values, 3rd → remove) ──────────
  const handleColClick = (col) => {
    if (pivotRows.includes(col)) {
      setPivotRows(r => r.filter(c => c !== col));
    } else if (pivotValues.includes(col)) {
      setPivotValues(v => v.filter(c => c !== col));
    } else if (pivotCols.includes(col)) {
      setPivotCols(c => c.filter(c2 => c2 !== col));
    } else if (pivotFilters.includes(col)) {
      setPivotFilters(f => f.filter(c => c !== col));
    } else if (pivotRows.length === 0) {
      setPivotRows([col]);
    } else if (pivotValues.length === 0) {
      setPivotValues([col]);
    } else {
      setPivotRows(r => [...r, col]);
    }
    setPivotResult(null);
  };

  // ── Compute ───────────────────────────────────────────────────────────────
  const handleComputePivot = async () => {
    if (pivotRows.length === 0 || pivotValues.length === 0) return;
    setIsComputing(true);
    setPivotResult(null);
    const tableKey = Object.keys(uploadedFiles)[0] || '';
    try {
      const result = await runPivotQuery(tableKey, pivotRows[0], pivotValues, pivotFilters);
      setPivotResult(result);
      if (result) {
        addAuditEntry('pivot.compute',
          `${pivotRows[0]} × ${pivotValues.join(', ')} — ${result.length} skupín`);
      }
    } catch (e) {
      console.error('[ETL] pivot compute error:', e);
    } finally {
      setIsComputing(false);
    }
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!pivotResult || pivotResult.length === 0) return;
    const pivotTotal = pivotResult.reduce((s, r) => s + r.val, 0);
    const wsData = [
      ['Kategória', 'Suma EUR', '% z celku'],
      ...pivotResult.map(r => [
        r.key,
        r.val,
        pivotTotal !== 0 ? Math.abs(r.val / pivotTotal * 100).toFixed(1) + '%' : '0%',
      ]),
      ['TOTAL', pivotTotal, '100%'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, (pivotRows[0] || 'Pivot').slice(0, 31));
    const filename = `ETL_Pivot_${(pivotRows[0] || 'pivot').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    addAuditEntry('pivot.export', `Excel export: ${filename}`);
  };

  // ── Export PDF ────────────────────────────────────────────────────────────
  const handleExportPdf = () => {
    if (!pivotResult) return;
    const printContent = document.getElementById('pivot-result-printable');
    if (!printContent) return;
    const printHtml = `
      <html><head><title>ETL Commander — Pivot Report</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1E3A5F; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .positive { color: #059669; } .negative { color: #dc2626; }
        .total-row { background: #f8fafc; font-weight: bold; }
        h2 { color: #1E3A5F; }
      </style></head>
      <body>
        <h2>ETL Commander — Pivot Report</h2>
        <p>Generované: ${new Date().toLocaleString('sk-SK')} | Dimenzia: ${pivotRows[0] || '—'} | Hodnota: ${pivotValues[0] || '—'}</p>
        ${printContent.innerHTML}
      </body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.print();
    addAuditEntry('pivot.export', `PDF export: ${pivotRows[0] || '—'} × ${pivotValues[0] || '—'}`);
  };

  // ── Save layout ───────────────────────────────────────────────────────────
  const handleSaveLayout = () => {
    if (pivotRows.length === 0) return;
    const name = prompt('Názov layoutu:', `${pivotRows[0]} × ${pivotValues[0] || '—'}`);
    if (!name) return;
    const newLayout = {
      id: 'p' + Date.now(),
      name,
      rows:    [...pivotRows],
      cols:    [...pivotCols],
      values:  [...pivotValues],
      filters: [...pivotFilters],
    };
    setSavedLayouts(prev => [...prev, newLayout]);
    addAuditEntry('pivot.save', `Uložený layout: ${name}`);
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  const LoadingSpinner = () => (
    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
  );

  const Chip = ({ children, tone = 'navy', onRemove }) => (
    <span className={cls(
      'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11.5px] font-medium ring-1',
      tone === 'navy'  && 'bg-[#1E3A5F]/8 text-[#1E3A5F] ring-[#1E3A5F]/20',
      tone === 'sky'   && 'bg-sky-50 text-sky-700 ring-sky-200',
      tone === 'amber' && 'bg-amber-50 text-amber-800 ring-amber-200',
      tone === 'green' && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    )}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-current opacity-60 hover:opacity-100">
          <IcoX className="w-3 h-3"/>
        </button>
      )}
    </span>
  );

  const DropZone = ({ zone, label, items, tone, hint, onRemove }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); setActiveDropZone(zone); }}
      onDragLeave={() => setActiveDropZone(null)}
      onDrop={handleDrop(zone)}
      className={cls(
        'rounded-md ring-1 p-3 min-h-[88px] transition-all',
        activeDropZone === zone
          ? 'ring-2 ring-[#1E3A5F] bg-[#1E3A5F]/5'
          : 'bg-slate-50/60 ring-slate-200',
      )}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && (
          <span className={cls(
            'text-[11px] italic',
            activeDropZone === zone ? 'text-[#1E3A5F]' : 'text-slate-400',
          )}>
            {activeDropZone === zone ? 'Pustite sem…' : hint}
          </span>
        )}
        {items.map((it, i) => (
          <Chip key={i} tone={tone} onRemove={() => onRemove(it)}>{it}</Chip>
        ))}
      </div>
    </div>
  );

  const pivotTotal = pivotResult ? pivotResult.reduce((s, r) => s + r.val, 0) : 0;
  const pivotMax   = pivotResult ? Math.max(...pivotResult.map(r => Math.abs(r.val)), 1) : 1;

  return (
    <div className="fade-in">
      <PageHeader
        title="Pivot Reports"
        subtitle="Builder a uložené pivot výkazy nad analytickou vrstvou"
        actions={
          <>
            {duckDbReady && <Badge tone="success" dot>DuckDB</Badge>}
            <Button variant="secondary" size="sm" icon={<IcoDownload className="w-3.5 h-3.5"/>}
              onClick={handleExportExcel} disabled={!pivotResult}>Export Excel</Button>
            <Button variant="secondary" size="sm" icon={<IcoDownload className="w-3.5 h-3.5"/>}
              onClick={handleExportPdf} disabled={!pivotResult}>Export PDF</Button>
            <Button variant="primary" size="sm" icon={<IcoCheck className="w-3.5 h-3.5"/>}
              onClick={handleSaveLayout} disabled={pivotRows.length === 0}>Save layout</Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left: saved layouts + dimensions */}
        <div className="col-span-3 space-y-4">
          <Card title="Uložené pivoty" padded={false}>
            <ul className="py-1">
              {savedLayouts.map(pl => (
                <li key={pl.id}>
                  <button
                    onClick={() => {
                      setActiveId(pl.id);
                      setPivotRows(pl.rows || []);
                      setPivotCols(pl.cols || []);
                      setPivotValues(pl.values || []);
                      setPivotFilters(pl.filters || []);
                      setPivotResult(null);
                    }}
                    className={cls(
                      'w-full text-left px-3 py-2.5 border-l-2 transition-colors',
                      activeId === pl.id ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]' : 'border-transparent hover:bg-slate-50'
                    )}
                  >
                    <div className="text-[13px] font-medium text-slate-800">{pl.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {(pl.rows || []).length} riad. dim · {(pl.cols || []).length} stĺp. dim
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Dimensions" padded>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              {hasUploaded ? 'Polia z nahraných dát' : 'Dostupné polia'}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(hasUploaded && availableCols.length > 0 ? availableCols : [
                'Department', 'Cost Center', 'Account', 'Account category', 'Month', 'Quarter',
                'Year', 'Product Group', 'Product', 'Supplier', 'VAT direction', 'Currency', 'Source system',
              ]).map((d, i) => {
                const inRows    = pivotRows.includes(d);
                const inVals    = pivotValues.includes(d);
                const inCols    = pivotCols.includes(d);
                const inFilters = pivotFilters.includes(d);
                const isDragging = draggedCol === d;
                return (
                  <div
                    key={i}
                    draggable={hasUploaded}
                    onDragStart={(e) => { setDraggedCol(d); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDraggedCol(null); setActiveDropZone(null); }}
                    onClick={() => hasUploaded ? handleColClick(d) : null}
                    className={cls(
                      'px-2 py-1.5 rounded text-[12px] font-mono ring-1 text-slate-700 transition-all select-none',
                      inRows    && 'bg-[#1E3A5F]/10 ring-[#1E3A5F]/30 text-[#1E3A5F]',
                      inVals    && 'bg-emerald-50 ring-emerald-200 text-emerald-700',
                      inCols    && 'bg-sky-50 ring-sky-200 text-sky-700',
                      inFilters && 'bg-amber-50 ring-amber-200 text-amber-700',
                      !inRows && !inVals && !inCols && !inFilters && 'bg-slate-50 ring-slate-200 hover:bg-white',
                      hasUploaded ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
                      isDragging && 'opacity-40 scale-95',
                    )}
                  >{d}</div>
                );
              })}
            </div>
            {hasUploaded && (
              <p className="text-[10.5px] text-slate-400 mt-2">
                Kliknite alebo pretiahnite pole do zóny
              </p>
            )}
          </Card>
        </div>

        {/* Right: builder + result */}
        <div className="col-span-9 space-y-4">
          <Card title={p ? p.name : 'Pivot Builder'} subtitle="Drag & drop alebo kliknite na pole vľavo">
            <div className="grid grid-cols-2 gap-3">
              <DropZone
                zone="rows" label="Rows" tone="navy"
                items={hasUploaded ? pivotRows : (p ? (p.rows || []) : [])}
                hint="Pretiahnite dimenziu sem"
                onRemove={col => { setPivotRows(r => r.filter(c => c !== col)); setPivotResult(null); }}
              />
              <DropZone
                zone="cols" label="Columns" tone="sky"
                items={hasUploaded ? pivotCols : (p ? (p.cols || []) : [])}
                hint="Pretiahnite sem dimenzie"
                onRemove={col => { setPivotCols(c => c.filter(c2 => c2 !== col)); setPivotResult(null); }}
              />
              <DropZone
                zone="values" label="Values" tone="green"
                items={hasUploaded ? pivotValues : (p ? (p.values || []) : [])}
                hint="Pretiahnite číselné pole sem"
                onRemove={col => { setPivotValues(v => v.filter(c => c !== col)); setPivotResult(null); }}
              />
              <DropZone
                zone="filters" label="Filters" tone="amber"
                items={hasUploaded ? pivotFilters : (p ? (p.filters || []) : [])}
                hint="Pretiahnite filter sem"
                onRemove={col => { setPivotFilters(f => f.filter(c => c !== col)); setPivotResult(null); }}
              />
            </div>

            {hasUploaded && (
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="primary"
                  icon={isComputing ? <LoadingSpinner/> : <IcoPlay className="w-4 h-4"/>}
                  onClick={handleComputePivot}
                  disabled={isComputing || pivotRows.length === 0 || pivotValues.length === 0}
                >
                  {isComputing ? 'Počítam…' : 'Compute Pivot'}
                </Button>
                {(pivotRows.length === 0 || pivotValues.length === 0) && !isComputing && (
                  <span className="text-xs text-slate-400">Pridajte aspoň 1 pole do Rows a 1 do Values</span>
                )}
                {duckDbReady && (
                  <span className="text-[11px] text-emerald-600 font-mono font-semibold">⚡ DuckDB SQL</span>
                )}
              </div>
            )}
          </Card>

          {/* Pivot result */}
          {pivotResult && pivotResult.length > 0 && (
            <Card
              title={`Výsledok: ${pivotRows[0]} → ${pivotValues[0]}`}
              subtitle={`${pivotResult.length} skupín · Spolu: ${fmt(pivotTotal)} EUR`}
              className="fade-in"
              padded={false}
              right={<Button variant="secondary" size="sm" onClick={() => setPivotResult(null)}>Zatvoriť</Button>}
            >
              <div id="pivot-result-printable">
                <div className="p-5 space-y-2">
                  {pivotResult.slice(0, 20).map((row, i) => {
                    const pct      = pivotMax > 0 ? Math.abs(row.val) / pivotMax * 100 : 0;
                    const positive = row.val >= 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-44 text-[12px] font-mono text-slate-700 truncate shrink-0" title={row.key}>{row.key}</div>
                        <div className="flex-1 h-6 bg-slate-50 rounded overflow-hidden">
                          <div
                            className={cls('h-full rounded transition-all', positive ? 'bg-emerald-400' : 'bg-red-400')}
                            style={{ width: pct + '%' }}
                          />
                        </div>
                        <div className={cls('w-40 text-right text-[12.5px] font-mono tabular-nums shrink-0', positive ? 'text-emerald-700' : 'text-red-700')}>
                          {fmt(row.val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-slate-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-2.5 text-left font-semibold">{pivotRows[0]}</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Suma EUR</th>
                        <th className="px-4 py-2.5 text-right font-semibold w-24">% z celku</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pivotResult.slice(0, 10).map((row, i) => (
                        <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                          <td className="px-4 py-2 font-mono text-[12.5px] text-slate-800">{row.key}</td>
                          <td className={cls('px-4 py-2 text-right font-mono text-[12px] tabular-nums', row.val >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                            {fmt(row.val)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-[12px] text-slate-500 tabular-nums">
                            {pivotTotal !== 0 ? Math.abs(row.val / pivotTotal * 100).toLocaleString('sk-SK', { maximumFractionDigits: 1 }) + ' %' : '—'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-semibold">
                        <td className="px-4 py-2.5 text-slate-900">Σ Total</td>
                        <td className={cls('px-4 py-2.5 text-right font-mono tabular-nums', pivotTotal >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                          {fmt(pivotTotal)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-500">100,0 %</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {pivotResult.length > 20 && (
                <div className="px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400">
                  Graf zobrazuje top 20 z {pivotResult.length} skupín
                </div>
              )}
            </Card>
          )}

          {/* Empty state when data loaded but not computed */}
          {!pivotResult && hasUploaded && !isComputing && (
            <Card padded>
              <EmptyHint>Vyberte Rows a Values z panela vľavo, potom kliknite „Compute Pivot".</EmptyHint>
            </Card>
          )}

          {!pivotResult && !hasUploaded && (
            <Card padded>
              <EmptyHint>Nahrajte dáta v sekcii Importer, nakonfigurujte pivot (Rows + Values) a kliknite „Compute Pivot".</EmptyHint>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
window.SectionPivot = SectionPivot;
