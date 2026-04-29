// Section 5 — Numerátor Engine
function SectionNumerator() {
  const { uploadedFiles, transformedData, applyNumerator, addAuditEntry, activateNumerator, auditLog,
          numeratorsList, createNumeratorRuleset } = useAppState();
  const [activeId, setActiveId]           = React.useState('n1');
  const [numResult, setNumResult]         = React.useState(null);
  const [accountColSel, setAccountColSel] = React.useState('ACCDB');
  const [amountColSel, setAmountColSel]   = React.useState('AMTEUR');
  const [selectedTable, setSelectedTable] = React.useState('');
  const [showActivateModal, setShowActivateModal] = React.useState(false);
  const [showAiModal, setShowAiModal]     = React.useState(false);
  const [showNewModal, setShowNewModal]   = React.useState(false);
  const [newNumName, setNewNumName]       = React.useState('');
  const [newNumType, setNewNumType]       = React.useState('P&L Sign');
  const [newNumDesc, setNewNumDesc]       = React.useState('');
  const [savingNum, setSavingNum]         = React.useState(false);
  const [numeratorStatuses, setNumeratorStatuses] = React.useState(
    Object.fromEntries((numeratorsList || NUMERATORS).map(n => [n.id, n.status]))
  );

  const allNumerators = numeratorsList && numeratorsList.length > 0 ? numeratorsList : NUMERATORS;
  const n     = allNumerators.find(x => x.id === activeId) || allNumerators[0];
  const rules = NUMERATOR_RULES[activeId] || [];
  const numeratorAuditLog = (auditLog || []).filter(a => a.action && a.action.startsWith('numerator.'));

  const uploadedKeys = Object.keys(uploadedFiles);
  const hasUploaded  = uploadedKeys.length > 0;
  const tableKey     = selectedTable || uploadedKeys[0] || '';
  const tableCols    = tableKey && uploadedFiles[tableKey]
    ? Object.keys(uploadedFiles[tableKey][0] || {})
    : [];

  const fmtEUR = (v) =>
    v.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';

  const handleTestRun = async () => {
    if (!tableKey) return;
    const result = await applyNumerator(tableKey, activeId, accountColSel, amountColSel);
    if (result) setNumResult(result);
  };

  const handleConfirmActivate = async () => {
    setNumeratorStatuses(prev => ({ ...prev, [activeId]: 'Active' }));
    await activateNumerator(activeId, `Numerátor ${n.name} aktivovaný (${n.version})`);
    setShowActivateModal(false);
  };

  const revenues        = numResult ? numResult.filter(r => r._sign === 1).reduce((s, r) => s + (r._signed_amount || 0), 0) : 0;
  const costs           = numResult ? numResult.filter(r => r._sign === -1).reduce((s, r) => s + Math.abs(r._signed_amount || 0), 0) : 0;
  const grossMargin     = revenues - costs;
  const classifiedCount = numResult ? numResult.filter(r => r._sign !== 0).length : 0;
  const currentStatus   = numeratorStatuses[activeId] || n.status;

  return (
    <div className="fade-in">
      <PageHeader
        title="Numerátor Engine"
        subtitle="Klasifikácia a znakovanie účtov pre P&L, BS a interné výkazy"
        actions={<Button icon={<IcoPlus className="w-4 h-4"/>} onClick={() => setShowNewModal(true)}>Nový numerátor</Button>}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left list */}
        <div className="col-span-3">
          <Card title="Numerátory" padded={false}>
            <ul className="py-1 max-h-[640px] overflow-y-auto">
              {allNumerators.map(num => {
                const status = numeratorStatuses[num.id] || num.status;
                const tone   = status === 'Active' ? 'success' : status === 'Draft' ? 'draft' : 'warning';
                return (
                  <li key={num.id}>
                    <button
                      onClick={() => { setActiveId(num.id); setNumResult(null); }}
                      className={cls(
                        'w-full text-left px-3 py-2.5 border-l-2 transition-colors',
                        activeId === num.id ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]' : 'border-transparent hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-slate-800">{num.name}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge tone={tone} dot>{status}</Badge>
                        <span className="text-[10.5px] font-mono text-slate-400">{num.version}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* Right detail */}
        <div className="col-span-9 space-y-4">
          <Card padded={false}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900 tracking-tight">{n.name}</h3>
                  <Badge tone={currentStatus === 'Active' ? 'success' : currentStatus === 'Draft' ? 'draft' : 'warning'} dot>{currentStatus}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Verzia <span className="font-mono text-slate-700">{n.version}</span>
                  {n.activated !== '—' && <> · aktivovaná {n.activated} <span className="text-slate-700">{n.activatedBy}</span></>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary" size="sm" icon={<IcoEye className="w-3.5 h-3.5"/>}
                  onClick={handleTestRun}
                  disabled={!hasUploaded}
                  title={!hasUploaded ? 'Najprv nahrajte dáta v sekcii Importer' : ''}
                >Test Run</Button>
                <Button variant="secondary" size="sm" icon={<IcoBranch className="w-3.5 h-3.5"/>}>Diff vs Active</Button>
                <Button
                  variant="primary" size="sm" icon={<IcoCheck className="w-3.5 h-3.5"/>}
                  onClick={() => setShowActivateModal(true)}
                >Activate (s validáciou)</Button>
              </div>
            </div>

            {hasUploaded && (
              <div className="px-5 py-3 border-b border-slate-100 bg-[#1E3A5F]/[2%] flex items-center gap-3">
                <IcoEye className="w-4 h-4 text-[#1E3A5F] shrink-0"/>
                <span className="text-xs font-semibold text-slate-700">Test Run na reálnych dátach:</span>
                <Select
                  value={selectedTable || uploadedKeys[0]}
                  onChange={(v) => setSelectedTable(v)}
                  options={uploadedKeys.map(k => ({ value: k, label: k }))}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Účet:</span>
                  <input
                    className="h-8 px-2.5 text-[12.5px] font-mono rounded-md ring-1 ring-slate-300 bg-white w-28 focus:ring-2 focus:ring-[#1E3A5F]"
                    value={accountColSel}
                    onChange={e => setAccountColSel(e.target.value)}
                    list="col-suggestions-acc"
                  />
                  <datalist id="col-suggestions-acc">
                    {tableCols.map(c => <option key={c} value={c}/>)}
                  </datalist>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Suma:</span>
                  <input
                    className="h-8 px-2.5 text-[12.5px] font-mono rounded-md ring-1 ring-slate-300 bg-white w-28 focus:ring-2 focus:ring-[#1E3A5F]"
                    value={amountColSel}
                    onChange={e => setAmountColSel(e.target.value)}
                    list="col-suggestions-amt"
                  />
                  <datalist id="col-suggestions-amt">
                    {tableCols.map(c => <option key={c} value={c}/>)}
                  </datalist>
                </div>
                <Button variant="primary" size="sm" icon={<IcoPlay className="w-3.5 h-3.5"/>} onClick={handleTestRun}>
                  Spustiť Test Run
                </Button>
              </div>
            )}
            {!hasUploaded && (
              <div className="px-5 py-2.5 border-b border-slate-100 bg-amber-50/40">
                <span className="text-xs text-amber-700">Najprv nahrajte dáta v sekcii Importer — potom tu môžete spustiť Test Run na reálnych dátach.</span>
              </div>
            )}

            <div className="p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Pravidlá ({rules.length})</div>
              <Table>
                <THead cols={[
                  { label: 'Account pattern', className: 'w-44' },
                  { label: 'Sign', className: 'w-24' },
                  { label: 'Category' },
                  { label: 'Severity', className: 'w-24' },
                ]}/>
                <tbody>
                  {rules.map((r, i) => (
                    <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                      <td className="px-4 py-2.5 font-mono text-[12.5px] text-slate-800">{r.pattern}</td>
                      <td className="px-4 py-2.5 font-mono">
                        <span className={cls(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-bold',
                          r.sign === '+1' && 'bg-emerald-50 text-emerald-700',
                          r.sign === '-1' && 'bg-red-50 text-red-700',
                          (r.sign === 'IN' || r.sign === 'OUT') && 'bg-sky-50 text-sky-700',
                        )}>{r.sign}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{r.category}</td>
                      <td className="px-4 py-2.5">
                        {r.severity === 'high' ? <Badge tone="warning">high</Badge> : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && <tr><td colSpan={4}><EmptyHint>Draft numerátor — pravidlá zatiaľ neboli definované.</EmptyHint></td></tr>}
                </tbody>
              </Table>
            </div>
          </Card>

          {numResult && (
            <Card title="Výsledok Test Run" subtitle={`${numResult.length.toLocaleString('sk-SK')} riadkov spracovaných · ${classifiedCount.toLocaleString('sk-SK')} klasifikovaných`} className="fade-in" padded={false}>
              <div className="p-5 grid grid-cols-3 gap-4 border-b border-slate-100">
                <div className="rounded-md bg-emerald-50 ring-1 ring-emerald-200 p-4">
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Výnosy</div>
                  <div className="text-xl font-semibold text-emerald-800 tabular-nums">{fmtEUR(revenues)}</div>
                  <div className="text-xs text-emerald-600 mt-1">{numResult.filter(r => r._sign === 1).length} riadkov</div>
                </div>
                <div className="rounded-md bg-red-50 ring-1 ring-red-200 p-4">
                  <div className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Náklady</div>
                  <div className="text-xl font-semibold text-red-800 tabular-nums">{fmtEUR(costs)}</div>
                  <div className="text-xs text-red-600 mt-1">{numResult.filter(r => r._sign === -1).length} riadkov</div>
                </div>
                <div className={cls('rounded-md ring-1 p-4', grossMargin >= 0 ? 'bg-[#1E3A5F]/5 ring-[#1E3A5F]/20' : 'bg-amber-50 ring-amber-200')}>
                  <div className={cls('text-xs font-semibold uppercase tracking-wide mb-1', grossMargin >= 0 ? 'text-[#1E3A5F]' : 'text-amber-700')}>Hrubá marža</div>
                  <div className={cls('text-xl font-semibold tabular-nums', grossMargin >= 0 ? 'text-[#1E3A5F]' : 'text-amber-800')}>{fmtEUR(grossMargin)}</div>
                  <div className={cls('text-xs mt-1', revenues > 0 ? (grossMargin >= 0 ? 'text-[#1E3A5F]/70' : 'text-amber-600') : 'text-slate-400')}>
                    {revenues > 0 ? ((grossMargin / revenues) * 100).toLocaleString('sk-SK', { maximumFractionDigits: 1 }) + ' %' : '—'}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 text-left font-semibold font-mono">Účet</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Suma orig.</th>
                      <th className="px-4 py-2.5 text-center font-semibold w-16">Sign</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Signed suma</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Kategória</th>
                    </tr>
                  </thead>
                  <tbody>
                    {numResult.slice(0, 15).map((row, i) => (
                      <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                        <td className="px-4 py-2 font-mono text-[12.5px] text-slate-800">{row._account_col}</td>
                        <td className="px-4 py-2 text-right font-mono text-[12px] text-slate-600 tabular-nums">
                          {row._amount_orig.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {row._sign === 0
                            ? <span className="text-slate-300">—</span>
                            : <span className={cls('inline-flex px-1.5 py-0.5 rounded text-[10.5px] font-bold', row._sign === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                                {row._sign === 1 ? '+1' : '-1'}
                              </span>
                          }
                        </td>
                        <td className={cls('px-4 py-2 text-right font-mono text-[12px] tabular-nums', row._sign === 1 ? 'text-emerald-700' : row._sign === -1 ? 'text-red-700' : 'text-slate-400')}>
                          {row._signed_amount.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-[12.5px] text-slate-700">{row._account_category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {numResult.length > 15 && (
                <div className="px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400">
                  Zobrazených 15 z {numResult.length.toLocaleString('sk-SK')} riadkov
                </div>
              )}
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Card title="Drift detection" subtitle="Účty mimo aktuálnej definície">
              <div className="py-8 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <IcoActivity className="w-5 h-5 text-slate-400"/>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                  Drift sa detekuje automaticky po každom pipeline behu.
                </p>
                <div className="mt-3">
                  <Button
                    variant="secondary" size="sm"
                    icon={<span className="text-sm leading-none">✨</span>}
                    onClick={() => setShowAiModal(true)}
                  >AI Anomaly Detection</Button>
                </div>
              </div>
            </Card>

            <Card title="Safety Rules" subtitle="Pred-aktivačná validácia">
              <ul className="text-sm space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <IcoCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>
                  <div>
                    <div className="text-slate-800 font-medium">Historical Data Change Rule</div>
                    <div className="text-xs text-slate-500">Žiadne zmeny v dátach starších ako 90 dní.</div>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <IcoCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>
                  <div>
                    <div className="text-slate-800 font-medium">Massive Change Rule</div>
                    <div className="text-xs text-slate-500">
                      {numResult
                        ? `Zmeny pokrývajú ${((classifiedCount / numResult.length) * 100).toFixed(1)} % riadkov v target tabuľke.`
                        : 'Zmeny pokrývajú < 5 % riadkov v target tabuľke.'}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <IcoWarn className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"/>
                  <div>
                    <div className="text-slate-800 font-medium">Zero Out Numerator Rule</div>
                    <div className="text-xs text-slate-500">Manuálna kontrola odporúčaná pred aktiváciou.</div>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <IcoCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>
                  <div>
                    <div className="text-slate-800 font-medium">Sign-flip Rule</div>
                    <div className="text-xs text-slate-500">Žiadne automatické prevrátenie znamienka pre účty s severity=high.</div>
                  </div>
                </li>
              </ul>
            </Card>
          </div>

          <Card title="Activation Audit Trail" padded={false}>
            {numeratorAuditLog.length > 0 ? (
              <ol className="px-5 py-2">
                {numeratorAuditLog.map((a, i) => (
                  <li key={i} className="py-3 border-b border-slate-100 last:border-0 flex items-start gap-3">
                    <div className="w-32 shrink-0 font-mono text-[11.5px] text-slate-500 pt-0.5">{a.time}</div>
                    <div className="flex-1 text-[13px] text-slate-800">
                      <span className="font-semibold">{a.user}</span>
                      <span className="ml-2 font-mono text-[11px] text-slate-500">{a.action}</span>
                    </div>
                    <div className="text-[11.5px] text-slate-500 max-w-[200px] text-right">{a.detail}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyHint>Zatiaľ nebola vykonaná žiadna aktivácia numerátora. Aktivácia sa zapíše do audit logu.</EmptyHint>
            )}
          </Card>
        </div>
      </div>

      {/* Nový numerátor modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 w-[440px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 mb-4">Nový numerátor</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Názov numerátora <span className="text-red-500">*</span></div>
                <input
                  className="w-full h-9 px-3 text-sm rounded-md ring-1 ring-slate-300 focus:ring-2 focus:ring-[#1E3A5F] outline-none"
                  placeholder="napr. P&L Sign Custom 2025"
                  value={newNumName}
                  onChange={e => setNewNumName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Typ</div>
                <Select value={newNumType} onChange={setNewNumType} options={[
                  {value:'P&L Sign',label:'P&L Sign'},{value:'Balance Sheet Sign',label:'Balance Sheet Sign'},
                  {value:'VAT Direction',label:'VAT Direction'},{value:'Custom',label:'Custom'},
                ]}/>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Popis</div>
                <textarea
                  className="w-full text-sm rounded-md ring-1 ring-slate-300 px-3 py-2 h-16 focus:ring-2 focus:ring-[#1E3A5F] outline-none resize-none"
                  placeholder="voliteľné"
                  value={newNumDesc}
                  onChange={e => setNewNumDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowNewModal(false)} disabled={savingNum}>Zrušiť</Button>
              <Button variant="primary" disabled={savingNum || !newNumName.trim()} onClick={async () => {
                setSavingNum(true);
                const newN = await createNumeratorRuleset(newNumName.trim(), 'Peter Novák');
                if (newN) {
                  setNumeratorStatuses(prev => ({ ...prev, [newN.id]: 'Draft' }));
                  setActiveId(newN.id);
                }
                setShowNewModal(false);
                setNewNumName(''); setNewNumType('P&L Sign'); setNewNumDesc('');
                setSavingNum(false);
              }}>
                {savingNum ? 'Vytváram…' : 'Vytvoriť'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Activate modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowActivateModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl ring-1 ring-slate-200 w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Potvrdiť aktiváciu numerátora</h3>
            <p className="text-sm text-slate-500 mb-4">{n.name} · {n.version}</p>
            <ul className="space-y-3 mb-5">
              <li className="flex items-start gap-2.5">
                <IcoCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>
                <div className="text-sm"><span className="font-medium text-slate-800">Historical Data Change Rule</span> — OK</div>
              </li>
              <li className="flex items-start gap-2.5">
                <IcoCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>
                <div className="text-sm">
                  <span className="font-medium text-slate-800">Massive Change Rule</span> — OK
                  {numResult && <span className="text-slate-500"> (zmeny &lt; {((classifiedCount / numResult.length) * 100).toFixed(1)} %)</span>}
                </div>
              </li>
              {numResult && (
                <li className="flex items-start gap-2.5">
                  <IcoActivity className="w-4 h-4 text-[#1E3A5F] mt-0.5 shrink-0"/>
                  <div className="text-sm text-slate-600">
                    Celkový dopad: <span className="font-semibold text-slate-900">{classifiedCount.toLocaleString('sk-SK')} riadkov</span> bude reklasifikovaných
                  </div>
                </li>
              )}
            </ul>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowActivateModal(false)}>Zrušiť</Button>
              <Button variant="success" icon={<IcoCheck className="w-4 h-4"/>} onClick={handleConfirmActivate}>Potvrdiť aktiváciu</Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Anomaly Detection modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAiModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 w-[500px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center ring-1 ring-amber-200">
                <span className="text-lg leading-none">✨</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">AI Anomaly Detection</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automatická detekcia drift-ov a outlierov v numerátorovej logike</p>
              </div>
            </div>

            <div className="rounded-lg bg-[#1E3A5F]/[4%] ring-1 ring-[#1E3A5F]/10 p-4 mb-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                AI porovnáva aktuálnu definíciu numerátora s historickými výsledkami a identifikuje účty,
                ktoré sa správajú neočakávane. Každý nález obsahuje <span className="font-semibold">severity score</span> a odporúčanú akciu.
              </p>
            </div>

            <div className="space-y-2.5 mb-5">
              {[
                'Detekcia sign-flip anomálií na základe historických trendov',
                'Clustering účtov s podobným správaním pre skupinové opravy',
                'Root-cause analýza — dôvod každej anomálie s SQL query',
                'Automatický návrh opravného pravidla s human review',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <IcoCheck className="w-4 h-4 text-emerald-500 shrink-0"/>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-amber-50 ring-1 ring-amber-200 p-3 mb-5">
              <div className="text-xs font-semibold text-amber-900 mb-1">Dostupnosť</div>
              <div className="text-xs text-amber-800 leading-relaxed">
                Táto funkcia je vo vývoji a bude dostupná v <span className="font-semibold">Q3 2026</span> ako súčasť ETL Commander Enterprise Edition.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowAiModal(false)}>Zatvoriť</Button>
              <Button variant="primary" disabled icon={<span className="text-sm leading-none">✨</span>}>Spustiť analýzu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.SectionNumerator = SectionNumerator;
