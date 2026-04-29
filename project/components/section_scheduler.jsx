// Section 10 — Scheduler
function SectionScheduler() {
  const { addAuditEntry } = useAppState();

  const JOBS = [
    { id: 'daily-raw',      name: 'Denný RAW refresh',       cron: '0 23 * * *', desc: 'denne 23:00 — import GL transakcií', icon: '📥' },
    { id: 'ecb-fx',         name: 'ECB FX import',           cron: '0 6 * * *',  desc: 'denne 06:00 — kurzový lístok ECB',   icon: '💱' },
    { id: 'weekly-analyt',  name: 'Týždenný full ANALYTICS', cron: '0 2 * * 0',  desc: 'nedeľa 02:00 — refresh mat. views',  icon: '📊' },
    { id: 'monthly-snap',   name: 'Mesačný snapshot',        cron: '0 0 1 * *',  desc: '1. v mesiaci — archív dát',           icon: '📦' },
    { id: 'hourly-health',  name: 'Hourly health check',     cron: '0 * * * *',  desc: 'každú hodinu — kontrola pipeline',    icon: '❤️' },
  ];

  const [enabled, setEnabled] = React.useState(
    Object.fromEntries(JOBS.map(j => [j.id, false]))
  );

  const toggle = async (id) => {
    const next = !enabled[id];
    setEnabled(prev => ({ ...prev, [id]: next }));
    const job = JOBS.find(j => j.id === id);
    await addAuditEntry('scheduler.toggle', `${job.name}: ${next ? 'zapnutý' : 'vypnutý'}`);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Scheduler"
        subtitle="Cron-based plánovač pre importy, pipeline behy a údržbu"
        actions={
          <Button icon={<IcoPlus className="w-4 h-4"/>} disabled title="Dostupné v Fáze 3">
            Nový scheduled job
          </Button>
        }
      />

      <div className="rounded-lg bg-amber-50 ring-1 ring-amber-200 px-4 py-3 flex items-start gap-3 mb-5">
        <IcoWarn className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"/>
        <div className="text-sm text-amber-800 leading-relaxed">
          <span className="font-semibold">Fáza 3 — Automatické spúšťanie.</span>{' '}
          Momentálne spúšťajte pipeline manuálne v sekcii <span className="font-medium">Pipeline Orchestrátor</span>.
          Toggle je len vizuálny — pg_cron integrácia bude v Q3 2026.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-3">
          {JOBS.map(job => (
            <div key={job.id} className={cls(
              'rounded-lg ring-1 p-4 flex items-center gap-4 transition-colors',
              enabled[job.id] ? 'ring-[#1E3A5F]/30 bg-[#1E3A5F]/[3%]' : 'ring-slate-200 bg-white'
            )}>
              <div className="text-2xl leading-none w-9 text-center">{job.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-slate-900">{job.name}</span>
                  {enabled[job.id]
                    ? <Badge tone="success" dot>enabled</Badge>
                    : <Badge tone="neutral">disabled</Badge>}
                </div>
                <div className="text-[12px] text-slate-500">{job.desc}</div>
              </div>
              <span className="font-mono text-[11.5px] text-slate-500 bg-slate-100 px-2 py-1 rounded">{job.cron}</span>
              <button
                onClick={() => toggle(job.id)}
                className={cls(
                  'relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none',
                  enabled[job.id] ? 'bg-[#1E3A5F]' : 'bg-slate-200'
                )}
              >
                <span className={cls(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  enabled[job.id] ? 'translate-x-5.5' : 'translate-x-0.5'
                )}/>
              </button>
            </div>
          ))}
        </div>

        <div className="col-span-4 space-y-4">
          <Card title="Cron referencie" padded>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                { expr: '* * * * *',   desc: 'každú minútu' },
                { expr: '0 * * * *',   desc: 'každú hodinu' },
                { expr: '0 0 * * *',   desc: 'každý deň o polnoci' },
                { expr: '0 0 * * 0',   desc: 'každú nedeľu' },
                { expr: '0 0 1 * *',   desc: '1. každého mesiaca' },
              ].map((r, i) => (
                <li key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="font-mono text-[11.5px] text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">{r.expr}</span>
                  <span className="text-[11.5px] text-slate-500">{r.desc}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Ďalší beh" padded>
            <div className="space-y-2">
              {JOBS.filter(j => enabled[j.id]).length === 0 ? (
                <p className="text-xs text-slate-400">Žiadne joby nie sú zapnuté.</p>
              ) : (
                JOBS.filter(j => enabled[j.id]).map(j => (
                  <div key={j.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate">{j.name}</span>
                    <Badge tone="navy">scheduled</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
window.SectionScheduler = SectionScheduler;
