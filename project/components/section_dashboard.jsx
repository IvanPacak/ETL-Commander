// Section 1 — Domov (Dashboard)
function SectionDashboard() {
  const { uploadedFiles, transformedData, dbStatus, auditLog } = useAppState();
  const [pipelineRuns, setPipelineRuns] = React.useState([]);

  React.useEffect(() => {
    if (dbStatus !== 'online') return;
    window.etlDB.pipeline.getLast7Days()
      .then(runs => { if (runs && runs.length > 0) setPipelineRuns(runs); })
      .catch(() => {});
  }, [dbStatus]);

  const SK_DAYS = ['Ne', 'Po', 'Ut', 'St', 'Št', 'Pi', 'So'];

  const chartData = React.useMemo(() => {
    if (pipelineRuns.length === 0) return [];
    const byDate = {};
    pipelineRuns.forEach(r => {
      const ts = r.started_at || r.finished_at;
      if (!ts) return;
      const d = ts.slice(0, 10);
      byDate[d] = (byDate[d] || 0) + 1;
    });
    const sorted = Object.entries(byDate).sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-7);
    return sorted.map(([date, count]) => {
      const dow = new Date(date + 'T12:00:00').getDay();
      return { date, count, label: SK_DAYS[dow] };
    });
  }, [pipelineRuns]);

  const hasRuns = chartData.length > 0;
  const max = hasRuns ? Math.max(...chartData.map(d => d.count), 1) : 1;

  const realStats = React.useMemo(() => {
    const numData = Object.values(transformedData).find(d => d.length > 0 && d[0]?._signed_amount !== undefined);
    const rawData = Object.values(uploadedFiles)[0];
    if (!numData && !rawData) return null;
    const data = numData || rawData;
    const totalRows = data.length;
    if (numData) {
      const revenues = numData.filter(r => r._sign === 1).reduce((s, r) => s + (r._signed_amount || 0), 0);
      const costs    = numData.filter(r => r._sign === -1).reduce((s, r) => s + Math.abs(r._signed_amount || 0), 0);
      const margin   = revenues > 0 ? (revenues - costs) / revenues * 100 : null;
      return { totalRows, revenues, costs, margin, hasFinancials: true };
    }
    return { totalRows, revenues: null, costs: null, margin: null, hasFinancials: false };
  }, [uploadedFiles, transformedData]);

  const fmtEUR = (v) => v.toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' EUR';

  const hasFiles = Object.keys(uploadedFiles).length > 0;
  const recentActivity = React.useMemo(() => (auditLog || []).slice(0, 6), [auditLog]);

  const toneForAction = (action) => {
    if (!action) return 'info';
    if (action.startsWith('file.') || action.startsWith('pipeline.')) return 'success';
    if (action.startsWith('mapping.') || action.startsWith('numerator.')) return 'navy';
    return 'info';
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Dobrý deň, Peter"
        subtitle={new Date().toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <>
            <Button variant="secondary" icon={<IcoRefresh className="w-4 h-4"/>}>Obnoviť</Button>
            <Button variant="primary" icon={<IcoPlay className="w-4 h-4"/>}>Spustiť pipeline</Button>
          </>
        }
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Pipeline status"
          value={<span className="flex items-center gap-2 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot"></span>OK</span>}
          sublabel={hasRuns
            ? `Posledný beh: ${new Date(pipelineRuns[0].finished_at || pipelineRuns[0].started_at).toLocaleString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`
            : 'Zatiaľ žiadne behy'}
          tone="green"
          icon={<IcoActivity className="w-4 h-4"/>}
        />
        <StatTile
          label={realStats ? 'Nahraných riadkov' : 'Spracovaných riadkov'}
          value={realStats
            ? realStats.totalRows.toLocaleString('sk-SK')
            : (hasRuns ? pipelineRuns.reduce((s, r) => s + (r.rows_processed || 0), 0).toLocaleString('sk-SK') : '—')}
          sublabel={realStats ? 'z nahraných dát' : (hasRuns ? 'z pipeline histórie' : 'Nahrajte dáta v Importeri')}
          tone="navy"
          icon={<IcoLayers className="w-4 h-4"/>}
        />
        {realStats?.hasFinancials ? (
          <>
            <StatTile
              label="Výnosy (reálne)"
              value={fmtEUR(realStats.revenues)}
              sublabel="z nahraných dát"
              tone="green"
              icon={<IcoActivity className="w-4 h-4"/>}
            />
            <StatTile
              label="Hrubá marža"
              value={realStats.margin !== null ? realStats.margin.toLocaleString('sk-SK', { maximumFractionDigits: 1 }) + ' %' : '—'}
              sublabel={`Náklady: ${fmtEUR(realStats.costs)}`}
              tone={realStats.margin !== null && realStats.margin >= 0 ? 'green' : 'amber'}
              icon={<IcoHash className="w-4 h-4"/>}
            />
          </>
        ) : (
          <>
            <StatTile
              label="Aktívne mappingy"
              value="—"
              sublabel="Zatiaľ žiadne pipeline behy"
              tone="navy"
              icon={<IcoMap className="w-4 h-4"/>}
            />
            <StatTile
              label="Supabase DB"
              value={<span className={dbStatus === 'online' ? 'text-emerald-600' : 'text-amber-600'}>
                {dbStatus === 'online' ? 'Online' : dbStatus === 'offline' ? 'Offline' : 'Connecting…'}
              </span>}
              sublabel={dbStatus === 'online' ? 'eu-central-1' : 'Bez DB pripojenia'}
              tone={dbStatus === 'online' ? 'green' : 'amber'}
              icon={<IcoDb className="w-4 h-4"/>}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Run trend */}
        <Card
          className="col-span-2"
          title="Pipeline behy — posledných 7 dní"
          subtitle="Počet behov za deň"
        >
          {hasRuns ? (
            <>
              <div className="flex items-end gap-3 px-1 pb-1" style={{ height: 176 }}>
                {chartData.map((d, i) => {
                  const barH = Math.max(6, Math.round((d.count / max) * 150));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group" style={{ height: '100%' }}>
                      <div className="w-full flex items-end justify-center" style={{ height: 154 }}>
                        <div
                          className="w-full rounded-t-sm bg-[#1E3A5F]/85 group-hover:bg-[#1E3A5F] transition-colors relative"
                          style={{ height: barH }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                            {d.count}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{d.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Celkom riadkov</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {pipelineRuns.reduce((s, r) => s + (r.rows_processed || 0), 0).toLocaleString('sk-SK')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Behov spolu</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{pipelineRuns.length}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Úspešnosť</div>
                  <div className="font-semibold text-emerald-600 mt-0.5">
                    {pipelineRuns.length > 0
                      ? Math.round(pipelineRuns.filter(r => r.status === 'success').length / pipelineRuns.length * 100) + ' %'
                      : '—'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center" style={{ height: 220 }}>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E3A5F]/5 flex items-center justify-center mb-4">
                <IcoActivity className="w-6 h-6 text-[#1E3A5F]/40"/>
              </div>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Graf sa zobrazí po prvom pipeline behu. Spustite pipeline alebo nahrajte dáta v sekcii <span className="font-medium text-slate-700">Importer</span>.
              </p>
            </div>
          )}
        </Card>

        {/* Activity */}
        <Card title="Nedávna aktivita" subtitle={recentActivity.length > 0 ? 'Z audit logu' : 'Žiadna aktivita'} padded={false}>
          {recentActivity.length > 0 ? (
            <ol className="relative px-5 py-4">
              <div className="absolute left-[34px] top-5 bottom-5 w-px bg-slate-200"></div>
              {recentActivity.map((a, i) => (
                <li key={i} className="flex gap-3 py-2.5 relative">
                  <div className="w-12 shrink-0 text-[11px] font-mono text-slate-500 pt-1">{a.time}</div>
                  <div className={cls(
                    'w-2.5 h-2.5 rounded-full mt-1.5 ring-4 ring-white relative z-10 shrink-0',
                    toneForAction(a.action) === 'success' && 'bg-emerald-500',
                    toneForAction(a.action) === 'info'    && 'bg-sky-500',
                    toneForAction(a.action) === 'navy'    && 'bg-[#1E3A5F]',
                  )}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-mono text-slate-600 leading-snug truncate">{a.action}</div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">{a.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="py-10 text-center px-5">
              <p className="text-sm text-slate-400">Žiadna aktivita. Začnite nahraním súboru alebo spustením pipeline.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card title="Plánované behy" className="col-span-1">
          <div className="py-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-3">
              <IcoRefresh className="w-5 h-5 text-slate-400"/>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cron scheduler bude dostupný v <span className="font-medium text-slate-700">Fáze 2</span> — Pipeline orchestrácia.
            </p>
          </div>
        </Card>

        <Card title="Stav systému" className="col-span-1">
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Supabase DB</span>
              <Badge tone={dbStatus === 'online' ? 'success' : dbStatus === 'offline' ? 'warning' : 'navy'} dot>
                {dbStatus === 'online' ? 'online' : dbStatus === 'offline' ? 'offline' : 'connecting…'}
              </Badge>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">ETL Commander</span>
              <Badge tone="success" dot>running</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">DuckDB WASM</span>
              <Badge tone="navy" dot>ready</Badge>
            </li>
          </ul>
        </Card>

        <Card title="Drift &amp; výstrahy" className="col-span-1">
          {hasFiles ? (
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <IcoCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>
                <div>
                  <div className="text-slate-800 font-medium">Dáta nahrané</div>
                  <div className="text-xs text-slate-500">{Object.keys(uploadedFiles).length} súbor(ov) v pamäti</div>
                </div>
              </li>
            </ul>
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-slate-400 leading-relaxed">
                Drift sa detekuje automaticky po nahraní dát a spustení pipeline behu.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
window.SectionDashboard = SectionDashboard;
