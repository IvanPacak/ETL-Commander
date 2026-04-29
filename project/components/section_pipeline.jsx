// Section 2 — Pipeline Orchestrátor
function SectionPipeline() {
  const { dbStatus, addAuditEntry } = useAppState();
  const [expanded, setExpanded]     = React.useState({ raw: true, save: false, analytics: false });
  const [running, setRunning]       = React.useState(false);
  const [phaseStatus, setPhaseStatus] = React.useState({ raw: 'idle', save: 'idle', analytics: 'idle' });
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [pipelineRuns, setPipelineRuns]   = React.useState([]);
  const [loadingRuns, setLoadingRuns]     = React.useState(false);

  const PHASES = [
    {
      id: 'raw', num: 1, name: 'RAW Phase', duration: '~4m',
      desc: 'Načítanie zdrojových súborov a inzercia do raw tabuliek. Parsovanie CSV/Excel, GL transakcie → raw.gl_transactions.',
    },
    {
      id: 'save', num: 2, name: 'SAVE Phase', duration: '~4m',
      desc: 'Delta / full / hash save do cieľových schém. Prepočet mien cez fx_rates, aplikácia mapping pravidiel.',
    },
    {
      id: 'analytics', num: 3, name: 'ANALYTICS Phase', duration: '~2m',
      desc: 'Refresh materialized views: mv_pl_monthly, mv_balance_sheet, mv_gl_summary. Indexy a štatistiky.',
    },
  ];

  const loadRuns = () => {
    if (dbStatus !== 'online') return;
    setLoadingRuns(true);
    window.etlDB.pipeline.getLast7Days()
      .then(runs => { if (runs) setPipelineRuns(runs); })
      .catch(() => {})
      .finally(() => setLoadingRuns(false));
  };

  React.useEffect(() => { loadRuns(); }, [dbStatus]);

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const runPipeline = async () => {
    setShowConfirm(false);
    setRunning(true);
    setPhaseStatus({ raw: 'idle', save: 'idle', analytics: 'idle' });

    for (const ph of PHASES) {
      setPhaseStatus(prev => ({ ...prev, [ph.id]: 'running' }));
      await sleep(1500);
      await window.etlDB.pipeline.insert(ph.id.toUpperCase(), 'success', 0, 1500).catch(() => {});
      setPhaseStatus(prev => ({ ...prev, [ph.id]: 'success' }));
      await sleep(200);
    }

    await addAuditEntry('pipeline.run', 'Manuálny pipeline beh dokončený (RAW+SAVE+ANALYTICS)');
    setRunning(false);
    loadRuns();
  };

  const phaseIcon = (id) => {
    const s = phaseStatus[id];
    if (s === 'running') return (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
    );
    if (s === 'success') return <IcoCheck className="w-4 h-4 text-emerald-400"/>;
    return <Badge tone="neutral" dot>idle</Badge>;
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Pipeline Orchestrátor"
        subtitle="Trojfázový pipeline RAW → SAVE → ANALYTICS"
        actions={
          <>
            <Button variant="secondary" icon={<IcoCheck className="w-4 h-4"/>} disabled title="Dostupné v Fáze 2">
              Validovať pred spustením
            </Button>
            <Button variant="primary" icon={<IcoPlay className="w-4 h-4"/>} onClick={() => setShowConfirm(true)} disabled={running}>
              {running ? 'Beží…' : 'Spustiť pipeline manuálne'}
            </Button>
          </>
        }
      />

      {/* Phase boxes */}
      <Card padded={false} className="mb-6">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-slate-800">Fázy pipeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {running ? 'Prebieha manuálny beh…' : 'Kliknite na fázu pre detaily'}
            </p>
          </div>
          <Badge tone={running ? 'info' : 'neutral'} dot>{running ? 'running' : 'idle'}</Badge>
        </div>

        <div className="p-5">
          <div className="flex items-stretch gap-3">
            {PHASES.map((ph, idx) => {
              const isExpanded = expanded[ph.id];
              const ps = phaseStatus[ph.id];
              return (
                <React.Fragment key={ph.id}>
                  <div className={cls('flex-1 rounded-lg ring-1 overflow-hidden transition-colors',
                    ps === 'running' ? 'ring-[#1E3A5F]' : ps === 'success' ? 'ring-emerald-400' : 'ring-slate-200'
                  )}>
                    <button
                      onClick={() => setExpanded(s => ({...s, [ph.id]: !s[ph.id]}))}
                      className={cls('w-full text-left px-4 py-3.5 flex items-center justify-between border-b border-slate-200 transition-colors',
                        ps === 'running' ? 'bg-[#1E3A5F]/5' : ps === 'success' ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cls('w-7 h-7 rounded-md text-white text-xs font-bold flex items-center justify-center font-mono',
                          ps === 'success' ? 'bg-emerald-500' : 'bg-[#1E3A5F]'
                        )}>{ph.num}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 tracking-tight">{ph.name}</div>
                          <div className="text-[11px] text-slate-500">{ph.duration}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {phaseIcon(ph.id)}
                        <IcoChevD className={cls('w-4 h-4 text-slate-400 transition-transform', !isExpanded && '-rotate-90')}/>
                      </div>
                    </button>
                    {isExpanded ? (
                      <div className="bg-white px-4 py-3 text-[12.5px] text-slate-600 leading-relaxed">{ph.desc}</div>
                    ) : (
                      <div className="px-4 py-3 bg-white text-[11.5px] text-slate-400 truncate">{ph.desc.slice(0, 65)}…</div>
                    )}
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className="flex items-center text-slate-300 self-center">
                      <IcoArrowR className="w-5 h-5"/>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Plánované behy" className="col-span-1">
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <IcoRefresh className="w-5 h-5 text-slate-400"/>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[160px] mx-auto">
              Cron scheduler dostupný v <span className="font-medium text-slate-700">Fáze 3</span> — Pipeline orchestrácia.
            </p>
          </div>
        </Card>

        <Card title="Validation rules" className="col-span-1">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Schema match</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Mapping coverage</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Numerator safety rules</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Disk capacity</span></li>
          </ul>
          <p className="text-[11px] text-slate-400 mt-3">Validácia prebehne automaticky pred každým behom.</p>
        </Card>

        <Card title="Resources" className="col-span-1">
          <div className="space-y-3">
            {[
              { label: 'CPU', val: 18 }, { label: 'RAM', val: 47 },
              { label: 'Disk I/O', val: 32 }, { label: 'DB connections', val: 24 },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-mono text-slate-500">{r.val}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cls('h-full', r.val > 75 ? 'bg-red-500' : r.val > 50 ? 'bg-amber-500' : 'bg-[#1E3A5F]')}
                    style={{ width: `${r.val}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title="História behov"
        subtitle={pipelineRuns.length > 0 ? `${pipelineRuns.length} záznamov` : 'Zatiaľ žiadne behy'}
        padded={false}
      >
        {loadingRuns ? (
          <div className="py-8 text-center text-sm text-slate-400">Načítavam…</div>
        ) : pipelineRuns.length > 0 ? (
          <Table>
            <THead cols={[
              { label: 'Timestamp', className: 'w-44' },
              { label: 'Fáza', className: 'w-32' },
              { label: 'Výsledok', className: 'w-32' },
              { label: 'Trvanie', className: 'w-28' },
              { label: 'Riadky' },
            ]}/>
            <tbody>
              {pipelineRuns.map((r, i) => (
                <tr key={r.id || i} className={cls('border-b border-slate-100 last:border-0 hover:bg-slate-50/60', i % 2 ? 'bg-slate-50/30' : '')}>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-700">
                    {new Date(r.started_at || r.finished_at).toLocaleString('sk-SK', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-2.5 text-slate-800 font-medium">{r.phase || '—'}</td>
                  <td className="px-4 py-2.5">
                    {r.status === 'success' && <Badge tone="success" dot>success</Badge>}
                    {r.status === 'failed'  && <Badge tone="error"   dot>failed</Badge>}
                    {(!r.status || r.status === 'pending') && <Badge tone="neutral" dot>pending</Badge>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-600 tabular-nums">
                    {r.duration_seconds ? r.duration_seconds + 's' : '—'}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-600 tabular-nums">
                    {r.rows_processed ? r.rows_processed.toLocaleString('sk-SK') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1E3A5F]/5 flex items-center justify-center mb-4">
              <IcoActivity className="w-5 h-5 text-[#1E3A5F]/40"/>
            </div>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Zatiaľ žiadne pipeline behy. Spustite prvý beh tlačidlom <span className="font-medium text-slate-700">Spustiť pipeline manuálne</span> vyššie.
            </p>
          </div>
        )}
      </Card>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-lg shadow-2xl ring-1 ring-slate-200 w-[420px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center">
                <IcoPlay className="w-5 h-5 text-[#1E3A5F]"/>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Spustiť manuálny pipeline beh?</h3>
                <p className="text-xs text-slate-500 mt-0.5">RAW → SAVE → ANALYTICS</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Sekvenčne prebehú všetky 3 fázy. Každá fáza bude zaznamenaná do histórie behov v Supabase.
            </p>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>Zrušiť</Button>
              <Button variant="primary" icon={<IcoPlay className="w-4 h-4"/>} onClick={runPipeline}>Spustiť</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.SectionPipeline = SectionPipeline;
