// Section 10 — Scheduler
function SectionScheduler() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Scheduler"
        subtitle="Cron-based plánovač pre importy, pipeline behy a údržbu"
        actions={
          <Button icon={<IcoPlus className="w-4 h-4"/>} disabled title="Dostupné v Fáze 2">
            Nový scheduled job
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Card title="Naplánované úlohy" padded={false}>
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-5">
                <IcoRefresh className="w-7 h-7 text-[#1E3A5F]/50"/>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-2">Plánované úlohy — Fáza 2</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Automatické behy budú dostupné v ďalšej verzii
                (<span className="font-medium text-slate-700">Fáza 2 — Pipeline orchestrácia</span>).
                Tu budete konfigurovať cron joby pre importy, pipeline behy a údržbu.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-50 ring-1 ring-slate-200 text-xs text-slate-600 font-mono">
                <IcoCheck className="w-3.5 h-3.5 text-emerald-500"/>
                Plánovaný v Q3 2026
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-4 space-y-4">
          <Card title="Plánované cron vzory" padded>
            <ul className="space-y-2.5 text-sm text-slate-600">
              {[
                { cron: '0 23 * * *',  label: 'Denný RAW refresh',       hint: 'denne 23:00' },
                { cron: '0 6 * * *',   label: 'ECB FX import',           hint: 'denne 06:00' },
                { cron: '0 2 * * 0',   label: 'Týždenný full ANALYTICS', hint: 'nedeľa 02:00' },
                { cron: '0 0 1 * *',   label: 'Mesačný snapshot',        hint: '1. v mesiaci' },
              ].map((j, i) => (
                <li key={i} className="flex items-start gap-2.5 py-2 border-b border-slate-100 last:border-0">
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-slate-800">{j.label}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{j.hint}</div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{j.cron}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11.5px] text-slate-400 mt-3">Budú nakonfigurované po implementácii Fázy 2.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
window.SectionScheduler = SectionScheduler;
