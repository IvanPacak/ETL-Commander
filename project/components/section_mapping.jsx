// Section 4 — Mapping Editor
function SectionMapping() {
  const { uploadedFiles, applyMapping, mappingRules, setMappingRules, addAuditEntry } = useAppState();
  const [activeId, setActiveId] = React.useState('m1');
  const [tab, setTab] = React.useState('rules');
  const [mappingResult, setMappingResult] = React.useState(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [sourceColSel, setSourceColSel] = React.useState('');
  const [targetColName, setTargetColName] = React.useState('category');
  const [selectedTable, setSelectedTable] = React.useState('');
  const [showAddRule, setShowAddRule] = React.useState(false);
  const [newRule, setNewRule] = React.useState({ src: '', op: '=', tgt: '', prio: 1 });

  const m = MAPPINGS.find(x => x.id === activeId);
  const rules = mappingRules[activeId] || [];

  const uploadedKeys = Object.keys(uploadedFiles);
  const hasUploaded = uploadedKeys.length > 0;
  const tableKey = selectedTable || uploadedKeys[0] || '';
  const tableCols = tableKey && uploadedFiles[tableKey]
    ? Object.keys(uploadedFiles[tableKey][0] || {})
    : [];

  React.useEffect(() => {
    if (tableCols.length > 0 && !sourceColSel) {
      const accCol = tableCols.find(c => c === 'ACCDB' || c.toLowerCase().includes('acc') || c.toLowerCase().includes('account'));
      setSourceColSel(accCol || tableCols[0]);
    }
  }, [tableKey]);

  const handleRunMapping = () => {
    if (!tableKey || !sourceColSel) return;
    const result = applyMapping(tableKey, activeId, sourceColSel, targetColName);
    if (result) {
      setMappingResult(result);
      setShowPreview(true);
    }
  };

  const handleAddRule = () => {
    if (!newRule.src || !newRule.tgt) return;
    setMappingRules(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), { ...newRule, prio: Number(newRule.prio) || 1 }],
    }));
    addAuditEntry('mapping.edit', `Pridané pravidlo "${newRule.src} ${newRule.op} ${newRule.tgt}" do mappingu ${activeId}`);
    setNewRule({ src: '', op: '=', tgt: '', prio: 1 });
    setShowAddRule(false);
  };

  const mappedCount = mappingResult ? mappingResult.filter(r => r[targetColName] && r[targetColName] !== 'Nezaradené').length : 0;
  const unmappedCount = mappingResult ? mappingResult.length - mappedCount : 0;
  const uniqueCats = mappingResult ? new Set(mappingResult.map(r => r[targetColName])).size : 0;

  return (
    <div className="fade-in">
      <PageHeader
        title="Mapping Editor"
        subtitle="Pravidlá, ktoré transformujú raw hodnoty na cieľové kategórie"
        actions={<Button icon={<IcoPlus className="w-4 h-4"/>}>Nový mapping</Button>}
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left: list */}
        <div className="col-span-3">
          <Card title="Mappingy" padded={false}>
            <div className="px-3 py-2.5 border-b border-slate-100">
              <div className="relative">
                <IcoSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
                <input className="w-full h-8 pl-8 pr-2 text-[12px] rounded-md ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Filter…"/>
              </div>
            </div>
            <ul className="py-1 max-h-[640px] overflow-y-auto">
              {MAPPINGS.map(mp => (
                <li key={mp.id}>
                  <button
                    onClick={() => { setActiveId(mp.id); setMappingResult(null); setShowPreview(false); }}
                    className={cls(
                      'w-full text-left px-3 py-2.5 border-l-2 transition-colors',
                      activeId === mp.id ? 'bg-[#1E3A5F]/5 border-[#1E3A5F]' : 'border-transparent hover:bg-slate-50'
                    )}
                  >
                    <div className="text-[13px] font-medium text-slate-800">{mp.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{mp.count.toLocaleString('sk-SK')} pravidiel</div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right: editor */}
        <div className="col-span-9 space-y-4">
          <Card padded={false}>
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 tracking-tight">{m.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{m.source}</span>
                    <IcoArrowR className="w-3 h-3"/>
                    <span>{m.target}</span>
                    <span className="text-slate-300">·</span>
                    <Badge tone="navy">v13</Badge>
                    <Badge tone="success" dot>active</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" icon={<IcoEye className="w-3.5 h-3.5"/>}>Náhľad výsledku</Button>
                  <Button variant="secondary" size="sm" icon={<IcoBranch className="w-3.5 h-3.5"/>}>Verzovať</Button>
                  <Button
                    variant="primary" size="sm" icon={<IcoPlay className="w-3.5 h-3.5"/>}
                    onClick={handleRunMapping}
                    disabled={!hasUploaded}
                    title={!hasUploaded ? 'Najprv nahrajte dáta v sekcii Importer' : ''}
                  >Spustiť mapping</Button>
                </div>
              </div>
            </div>

            {/* Apply to real data panel */}
            {hasUploaded && (
              <div className="px-5 py-3 border-b border-slate-100 bg-[#1E3A5F]/[2%] flex items-center gap-3">
                <IcoDb className="w-4 h-4 text-[#1E3A5F] shrink-0"/>
                <span className="text-xs font-semibold text-slate-700">Aplikovať na reálne dáta:</span>
                <Select
                  value={selectedTable || uploadedKeys[0]}
                  onChange={(v) => { setSelectedTable(v); setSourceColSel(''); }}
                  options={uploadedKeys.map(k => ({ value: k, label: k }))}
                />
                <Select
                  value={sourceColSel}
                  onChange={setSourceColSel}
                  options={tableCols.map(c => ({ value: c, label: c }))}
                />
                <span className="text-xs text-slate-500">→</span>
                <input
                  className="h-9 px-3 text-sm rounded-md ring-1 ring-inset ring-slate-300 bg-white w-32 focus:ring-2 focus:ring-[#1E3A5F]"
                  value={targetColName}
                  onChange={(e) => setTargetColName(e.target.value)}
                  placeholder="cieľový stĺpec"
                />
                <Button variant="primary" size="sm" icon={<IcoPlay className="w-3.5 h-3.5"/>} onClick={handleRunMapping}>
                  Spustiť mapping
                </Button>
              </div>
            )}

            {!hasUploaded && (
              <div className="px-5 py-2.5 border-b border-slate-100 bg-amber-50/40">
                <span className="text-xs text-amber-700">Najprv nahrajte dáta v sekcii Importer — potom tu môžete spustiť mapping na reálnych dátach.</span>
              </div>
            )}

            <div className="px-5">
              <Tabs
                tabs={[
                  { id: 'rules', label: 'Pravidlá', count: rules.length },
                  { id: 'keys',  label: 'KEY columns' },
                  { id: 'audit', label: 'Audit log', count: MAPPING_AUDIT.length },
                ]}
                value={tab}
                onChange={setTab}
              />
            </div>

            {tab === 'rules' && (
              <div>
                <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-100 bg-slate-50/40">
                  <Input placeholder="Filter source value…" className="flex-1"/>
                  <Select value="all" onChange={()=>{}} options={[{value:'all',label:'Všetky operátory'},{value:'eq',label:'='},{value:'like',label:'LIKE'}]}/>
                  <Button variant="secondary" size="sm" icon={<IcoPlus className="w-3.5 h-3.5"/>} onClick={() => setShowAddRule(v => !v)}>Pravidlo</Button>
                </div>

                {showAddRule && (
                  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-end gap-3">
                    <div className="flex-1">
                      <div className="text-[10.5px] text-slate-500 mb-1">Source value</div>
                      <input
                        className="h-8 w-full px-2.5 text-[12.5px] font-mono rounded-md ring-1 ring-slate-300 bg-white focus:ring-2 focus:ring-[#1E3A5F]"
                        placeholder="napr. 518100 alebo 518*"
                        value={newRule.src}
                        onChange={e => setNewRule(r => ({ ...r, src: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="text-[10.5px] text-slate-500 mb-1">Operátor</div>
                      <select
                        className="h-8 px-2 text-sm rounded-md ring-1 ring-slate-300 bg-white focus:ring-2 focus:ring-[#1E3A5F]"
                        value={newRule.op}
                        onChange={e => setNewRule(r => ({ ...r, op: e.target.value }))}
                      >
                        <option>=</option>
                        <option>LIKE</option>
                        <option>ELSE</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10.5px] text-slate-500 mb-1">Target value</div>
                      <input
                        className="h-8 w-full px-2.5 text-[12.5px] rounded-md ring-1 ring-slate-300 bg-white focus:ring-2 focus:ring-[#1E3A5F]"
                        placeholder="napr. Služby — IT"
                        value={newRule.tgt}
                        onChange={e => setNewRule(r => ({ ...r, tgt: e.target.value }))}
                      />
                    </div>
                    <div className="w-20">
                      <div className="text-[10.5px] text-slate-500 mb-1">Priorita</div>
                      <input
                        type="number" min="1" max="99"
                        className="h-8 w-full px-2.5 text-sm rounded-md ring-1 ring-slate-300 bg-white focus:ring-2 focus:ring-[#1E3A5F]"
                        value={newRule.prio}
                        onChange={e => setNewRule(r => ({ ...r, prio: e.target.value }))}
                      />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleAddRule}>Uložiť</Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowAddRule(false)}>Zrušiť</Button>
                  </div>
                )}

                <Table>
                  <THead cols={[
                    { label: 'Source value', className: 'w-56' },
                    { label: 'Operator', className: 'w-32' },
                    { label: 'Target value' },
                    { label: 'Priority', className: 'w-24' },
                    { label: '', className: 'w-12' },
                  ]}/>
                  <tbody>
                    {rules.map((r, i) => (
                      <tr key={i} className={cls('border-b border-slate-100 last:border-0 hover:bg-slate-50/60', i % 2 ? 'bg-slate-50/30' : '')}>
                        <td className="px-4 py-2.5 font-mono text-[12.5px] text-slate-800">{r.src}</td>
                        <td className="px-4 py-2.5">
                          <span className={cls(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-mono font-semibold',
                            r.op === '=' && 'bg-emerald-50 text-emerald-700',
                            r.op === 'LIKE' && 'bg-sky-50 text-sky-700',
                            r.op === 'ELSE' && 'bg-slate-100 text-slate-600',
                          )}>{r.op}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-800">{r.tgt}</td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-slate-600">{r.prio}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button className="text-slate-400 hover:text-slate-700"><IcoDots className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr><td colSpan={5}><EmptyHint>Pre tento mapping zatiaľ nie sú pravidlá. Začnite kliknutím na „+ Pravidlo".</EmptyHint></td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}

            {tab === 'keys' && (
              <div className="p-5">
                <p className="text-sm text-slate-600 mb-3">Stĺpce, podľa ktorých sa vyhľadáva zhoda v zdrojovej tabuľke. Aspoň jeden je povinný.</p>
                <div className="grid grid-cols-3 gap-2">
                  {['account_no','cost_center','period_yyyymm','currency','source_system','transaction_type'].map((c, i) => (
                    <label key={i} className="flex items-center gap-2 px-3 py-2 rounded-md ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" defaultChecked={m.keys.includes(c) || (i === 0)} className="rounded text-[#1E3A5F]"/>
                      <span className="text-sm font-mono text-slate-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {tab === 'audit' && (
              <ol className="px-5 py-2">
                {MAPPING_AUDIT.map((a, i) => (
                  <li key={i} className="py-3 border-b border-slate-100 last:border-0 flex items-start gap-3">
                    <div className="w-32 shrink-0 font-mono text-[11.5px] text-slate-500 pt-0.5">{a.time}</div>
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <IcoEdit className="w-3.5 h-3.5 text-slate-500"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-slate-800"><span className="font-semibold">{a.user}</span> · <span className="font-mono text-slate-500">{a.action}</span></div>
                      <div className="text-[12px] text-slate-500 mt-0.5">{a.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* Mapping result */}
          {showPreview && mappingResult && (
            <Card
              title="Výsledok mappingu"
              subtitle={`${mappedCount.toLocaleString('sk-SK')} namapovaných · ${unmappedCount} nezaradených · ${uniqueCats} unikátnych kategórií`}
              className="fade-in"
              padded={false}
              right={<Button variant="secondary" size="sm" onClick={() => setShowPreview(false)}>Zatvoriť náhľad</Button>}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 text-left font-semibold font-mono">{sourceColSel}</th>
                      <th className="px-4 py-2.5 text-left font-semibold">{targetColName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappingResult.slice(0, 20).map((row, i) => (
                      <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                        <td className="px-4 py-2 font-mono text-[12.5px] text-slate-800">{String(row[sourceColSel] ?? '')}</td>
                        <td className="px-4 py-2">
                          <span className={cls(
                            'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset',
                            row[targetColName] === 'Nezaradené'
                              ? 'bg-slate-100 text-slate-500 ring-slate-200'
                              : 'bg-[#1E3A5F]/8 text-[#1E3A5F] ring-[#1E3A5F]/20'
                          )}>
                            {row[targetColName]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappingResult.length > 20 && (
                <div className="px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400">
                  Zobrazených 20 z {mappingResult.length.toLocaleString('sk-SK')} riadkov
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
window.SectionMapping = SectionMapping;
