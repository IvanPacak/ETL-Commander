// Section 2 — Pipeline Orchestrátor
function SectionPipeline() {
  const [expanded, setExpanded] = React.useState({ raw: true, save: true, analytics: false });
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const start = () => {
    setRunning(true); setProgress(0);
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(t); setRunning(false); return 0; }
        return p + 4;
      });
    }, 120);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Pipeline Orchestrátor"
        subtitle="Trojfázový pipeline RAW → SAVE → ANALYTICS"
        actions={
          <>
            <Button variant="secondary" icon={<IcoCheck className="w-4 h-4"/>}>Validovať pred spustením</Button>
            <Button variant="primary" icon={<IcoPlay className="w-4 h-4"/>} onClick={start} disabled={running}>
              {running ? 'Beží…' : 'Spustiť pipeline manuálne'}
            </Button>
          </>
        }
      />

      {/* Phase boxes */}
      <Card padded={false} className="mb-6">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-slate-800">Aktuálny beh</h3>
            <p className="text-xs text-slate-500 mt-0.5">{running ? `Prebieha — ${progress} %` : 'Posledný beh dnes 03:14 → 03:24 · trvanie 10m 02s'}</p>
          </div>
          <Badge tone={running ? 'info' : 'success'} dot>{running ? 'running' : 'idle'}</Badge>
        </div>

        <div className="p-5">
          <div className="flex items-stretch gap-3">
            {PIPELINE_PHASES.map((p, idx) => {
              const isExpanded = expanded[p.id];
              return (
                <React.Fragment key={p.id}>
                  <div className="flex-1 rounded-lg ring-1 ring-slate-200 overflow-hidden">
                    <button
                      onClick={() => setExpanded(s => ({...s, [p.id]: !s[p.id]}))}
                      className="w-full text-left px-4 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-md bg-[#1E3A5F] text-white text-xs font-bold flex items-center justify-center font-mono">{idx+1}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 tracking-tight">{p.name}</div>
                          <div className="text-[11px] text-slate-500">{p.duration} · {p.jobs.length} jobov</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="success" dot>success</Badge>
                        <IcoChevD className={cls('w-4 h-4 text-slate-400 transition-transform', !isExpanded && '-rotate-90')}/>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="bg-white">
                        {p.jobs.map((j, i) => (
                          <div key={i} className="px-4 py-2.5 border-b border-slate-100 last:border-0 flex items-center gap-3">
                            <span className={cls(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              j.status === 'success' && 'bg-emerald-500',
                              j.status === 'failed' && 'bg-red-500',
                              j.status === 'pending' && 'bg-slate-300',
                            )}></span>
                            <span className="text-[12.5px] font-mono text-slate-700 flex-1 truncate">{j.name}</span>
                            <span className="text-[11px] font-mono text-slate-500 tabular-nums">{j.duration}</span>
                            <span className="text-[11px] font-mono text-slate-400 tabular-nums w-24 text-right">{j.rows}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!isExpanded && (
                      <div className="px-4 py-3 bg-white text-xs text-slate-500">{p.description}</div>
                    )}
                  </div>
                  {idx < PIPELINE_PHASES.length - 1 && (
                    <div className="flex items-center text-slate-300 self-center">
                      <IcoArrowR className="w-5 h-5"/>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {running && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-medium">Spustený manuálny beh — RAW phase</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1E3A5F] transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="Plánované behy" className="col-span-1">
          <ul className="-my-2">
            {SCHEDULED.slice(0,4).map((s, i) => (
              <li key={i} className="py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-800">{s.name}</span>
                  <Badge tone="navy">{s.cronLabel}</Badge>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{s.cron}</div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Validation rules" className="col-span-1">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Schema match (47/47)</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Mapping coverage</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Numerator safety rules</span></li>
            <li className="flex items-center gap-2"><IcoWarn className="w-4 h-4 text-amber-500"/><span className="text-slate-700">Source freshness — 1 warning</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Disk capacity (62 %)</span></li>
          </ul>
        </Card>

        <Card title="Resources" className="col-span-1">
          <div className="space-y-3">
            {[
              { label: 'CPU', val: 18 }, { label: 'RAM', val: 47 },
              { label: 'Disk I/O', val: 32 }, { label: 'DB connections', val: 24 }
            ].map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-mono text-slate-500">{r.val}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cls('h-full', r.val > 75 ? 'bg-red-500' : r.val > 50 ? 'bg-amber-500' : 'bg-[#1E3A5F]')} style={{ width: `${r.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="História behov" subtitle="Posledných 9 záznamov" padded={false}>
        <Table>
          <THead cols={[
            { label: 'Timestamp', className: 'w-44' },
            { label: 'Fáza', className: 'w-32' },
            { label: 'Výsledok', className: 'w-32' },
            { label: 'Trvanie', className: 'w-28' },
            { label: 'Riadky', className: 'w-40' },
            { label: 'Job ID' },
          ]}/>
          <tbody>
            {PIPELINE_RUNS.map((r, i) => (
              <tr key={r.id} className={cls('border-b border-slate-100 last:border-0 hover:bg-slate-50/60', i % 2 ? 'bg-slate-50/30' : '')}>
                <td className="px-4 py-2.5 font-mono text-[12px] text-slate-700">{r.date} <span className="text-slate-400">·</span> {r.time}</td>
                <td className="px-4 py-2.5 text-slate-800 font-medium">{r.phase}</td>
                <td className="px-4 py-2.5">
                  {r.result === 'success' && <Badge tone="success" dot>success</Badge>}
                  {r.result === 'failed' && <Badge tone="error" dot>failed</Badge>}
                  {r.result === 'pending' && <Badge tone="neutral" dot>pending</Badge>}
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-slate-600 tabular-nums">{r.duration}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-slate-600 tabular-nums">{r.rows}</td>
                <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{r.id}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
window.SectionPipeline = SectionPipeline;
