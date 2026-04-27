// Section 9 — Pivot Reports
function SectionPivot() {
  const { uploadedFiles, transformedData } = useAppState();
  const [activeId, setActiveId] = React.useState('p1');
  const [pivotRows, setPivotRows] = React.useState([]);
  const [pivotValues, setPivotValues] = React.useState([]);
  const [pivotResult, setPivotResult] = React.useState(null);
  const [availableCols, setAvailableCols] = React.useState([]);
  const p = PIVOT_LIST.find(x => x.id === activeId);

  const fmt = (n) => {
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    return sign + abs.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const hasUploaded = Object.keys(uploadedFiles).length > 0 || Object.keys(transformedData).length > 0;

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

  const handleColClick = (col) => {
    if (pivotRows.includes(col)) {
      setPivotRows(r => r.filter(c => c !== col));
    } else if (pivotValues.includes(col)) {
      setPivotValues(v => v.filter(c => c !== col));
    } else {
      if (pivotRows.length === 0) {
        setPivotRows([col]);
      } else if (pivotValues.length === 0) {
        setPivotValues([col]);
      } else {
        setPivotRows(r => [...r, col]);
      }
    }
    setPivotResult(null);
  };

  const computePivot = () => {
    const allData =
      Object.values(transformedData).find(d => d.length > 0) ||
      Object.values(uploadedFiles).find(d => d.length > 0);
    if (!allData || pivotValues.length === 0 || pivotRows.length === 0) return;

    const valueCol = pivotValues[0];
    const rowDim = pivotRows[0];

    const agg = {};
    allData.forEach(row => {
      const key = String(row[rowDim] ?? 'N/A');
      const raw = String(row[valueCol] ?? '0').replace(',', '.');
      const val = parseFloat(raw) || 0;
      agg[key] = (agg[key] || 0) + val;
    });

    const sorted = Object.entries(agg)
      .map(([key, val]) => ({ key, val }))
      .sort((a, b) => Math.abs(b.val) - Math.abs(a.val));

    setPivotResult(sorted);
  };

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

  const dropZone = (label, items, tone, hint, onRemove) => (
    <div className="bg-slate-50/60 rounded-md ring-1 ring-slate-200 p-3 min-h-[88px]">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-[11px] text-slate-400 italic">{hint}</span>}
        {items.map((it, i) => (
          <Chip key={i} tone={tone} onRemove={() => onRemove(it)}>{it}</Chip>
        ))}
      </div>
    </div>
  );

  const pivotTotal = pivotResult ? pivotResult.reduce((s, r) => s + r.val, 0) : 0;
  const pivotMax = pivotResult ? Math.max(...pivotResult.map(r => Math.abs(r.val))) : 1;

  return (
    <div className="fade-in">
      <PageHeader
        title="Pivot Reports"
        subtitle="Builder a uložené pivot výkazy nad analytickou vrstvou"
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<IcoDownload className="w-3.5 h-3.5"/>}>Export Excel</Button>
            <Button variant="secondary" size="sm" icon={<IcoDownload className="w-3.5 h-3.5"/>}>Export PDF</Button>
            <Button variant="primary" size="sm" icon={<IcoCheck className="w-3.5 h-3.5"/>}>Save layout</Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Card title="Uložené pivoty" padded={false}>
            <ul className="py-1">
              {PIVOT_LIST.map(pl => (
                <li key={pl.id}>
                  <button
                    onClick={() => { setActiveId(pl.id); setPivotResult(null); }}
                    className={cls(
                      'w-full text-left px-3 py-2.5 border-l-2 transition-colors',
                      activeId === pl.id ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]' : 'border-transparent hover:bg-slate-50'
                    )}
                  >
                    <div className="text-[13px] font-medium text-slate-800">{pl.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{pl.rows.length} riad. dim · {pl.cols.length} stĺp. dim</div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Dimensions" className="mt-4" padded>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              {hasUploaded ? 'Polia z nahraných dát' : 'Dostupné polia'}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(hasUploaded && availableCols.length > 0 ? availableCols : [
                'Department','Cost Center','Account','Account category','Month','Quarter',
                'Year','Product Group','Product','Supplier','VAT direction','Currency','Source system'
              ]).map((d, i) => {
                const inRows = pivotRows.includes(d);
                const inVals = pivotValues.includes(d);
                return (
                  <div
                    key={i}
                    onClick={() => hasUploaded ? handleColClick(d) : null}
                    className={cls(
                      'px-2 py-1.5 rounded text-[12px] font-mono ring-1 text-slate-700 transition-colors',
                      inRows && 'bg-[#1E3A5F]/10 ring-[#1E3A5F]/30 text-[#1E3A5F]',
                      inVals && 'bg-emerald-50 ring-emerald-200 text-emerald-700',
                      !inRows && !inVals && 'bg-slate-50 ring-slate-200 hover:bg-white',
                      hasUploaded ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >{d}</div>
                );
              })}
            </div>
            {hasUploaded && (
              <p className="text-[10.5px] text-slate-400 mt-2">Kliknite na pole → pridá sa do Rows (alebo Values ak Rows je obsadený)</p>
            )}
          </Card>
        </div>

        <div className="col-span-9 space-y-4">
          <Card title={p.name} subtitle="Drag & drop konfigurácia">
            <div className="grid grid-cols-2 gap-3">
              {dropZone('Rows',
                hasUploaded ? pivotRows : p.rows,
                'navy', 'Kliknite na pole vľavo',
                col => setPivotRows(r => r.filter(c => c !== col))
              )}
              {dropZone('Columns',
                hasUploaded ? [] : p.cols,
                'sky', 'Pretiahnite sem dimenzie',
                () => {}
              )}
              {dropZone('Values',
                hasUploaded ? pivotValues : p.values,
                'green', 'Kliknite na číselné pole vľavo',
                col => setPivotValues(v => v.filter(c => c !== col))
              )}
              {dropZone('Filters',
                hasUploaded ? [] : p.filters,
                'amber', 'Pretiahnite sem filtre',
                () => {}
              )}
            </div>
            {hasUploaded && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="primary"
                  icon={<IcoPlay className="w-4 h-4"/>}
                  onClick={computePivot}
                  disabled={pivotRows.length === 0 || pivotValues.length === 0}
                >Compute Pivot</Button>
                {(pivotRows.length === 0 || pivotValues.length === 0) && (
                  <span className="text-xs text-slate-400">Pridajte aspoň 1 pole do Rows a 1 do Values</span>
                )}
              </div>
            )}
          </Card>

          {/* Real pivot result */}
          {pivotResult && pivotResult.length > 0 && (
            <Card
              title={`Výsledok: ${pivotRows[0]} → ${pivotValues[0]}`}
              subtitle={`${pivotResult.length} skupín · Spolu: ${fmt(pivotTotal)} EUR`}
              className="fade-in"
              padded={false}
            >
              <div className="p-5 space-y-2">
                {pivotResult.slice(0, 20).map((row, i) => {
                  const pct = pivotMax > 0 ? Math.abs(row.val) / pivotMax * 100 : 0;
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
              {pivotResult.length > 0 && (
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
                            {pivotTotal !== 0 ? Math.abs((row.val / pivotTotal) * 100).toLocaleString('sk-SK', { maximumFractionDigits: 1 }) + ' %' : '—'}
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
              )}
            </Card>
          )}

          {/* Mock preview for saved pivots (fallback when no real data) */}
          {!pivotResult && (
            <Card title="Náhľad" subtitle={p.id === 'p1' ? 'P&L by month — Q1 + Apr 2026 (€)' : 'Náhľad výsledku'} padded={false}>
              {p.id === 'p1' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-2.5 text-left font-semibold w-44">Department</th>
                        <th className="px-4 py-2.5 text-left font-semibold w-32">Cost center</th>
                        {PIVOT_PREVIEW.colsHeader.map(c => (
                          <th key={c} className={cls('px-4 py-2.5 text-right font-semibold tabular-nums', c.startsWith('Q1') && 'bg-[#1E3A5F]/5 text-[#1E3A5F]')}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PIVOT_PREVIEW.rows.map((r, i) => (
                        <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                          <td className="px-4 py-2 font-medium text-slate-800">{r.rowVals[0]}</td>
                          <td className="px-4 py-2 font-mono text-[12px] text-slate-500">{r.rowVals[1]}</td>
                          {r.cells.map((c, j) => (
                            <td key={j} className={cls(
                              'px-4 py-2 text-right font-mono text-[12.5px] tabular-nums',
                              j === r.cells.length - 1 && 'bg-[#1E3A5F]/5 font-semibold',
                              c < 0 ? 'text-red-700' : 'text-emerald-700'
                            )}>{fmt(c)}</td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-semibold">
                        <td className="px-4 py-2.5 text-slate-900" colSpan={2}>Σ Total</td>
                        {PIVOT_PREVIEW.totals.map((t, j) => (
                          <td key={j} className={cls(
                            'px-4 py-2.5 text-right font-mono tabular-nums',
                            j === PIVOT_PREVIEW.totals.length - 1 && 'bg-[#1E3A5F] text-white',
                            t < 0 ? 'text-red-700' : 'text-emerald-700',
                            j === PIVOT_PREVIEW.totals.length - 1 && (t < 0 ? '!text-red-200' : '!text-white')
                          )}>{fmt(t)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10">
                  <ChartPlaceholder height={220} label="náhľad pivot výsledku — kliknite Save layout pre uloženie"/>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
window.SectionPivot = SectionPivot;
