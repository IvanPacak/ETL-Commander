// Section 8 — Data Governance
function SectionGovernance() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Data Governance"
        subtitle="Inventár všetkých objektov v systéme a ich životný cyklus"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Production', ring: 'ring-emerald-200' },
          { label: 'Review',     ring: 'ring-amber-200' },
          { label: 'Draft',      ring: 'ring-slate-200' },
          { label: 'Deprecated', ring: 'ring-red-200' },
        ].map(s => (
          <div key={s.label} className={cls('rounded-lg bg-white p-4 ring-1', s.ring)}>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</div>
            <div className="mt-2 text-[26px] font-semibold tabular-nums text-slate-300">0</div>
            <div className="mt-1 text-xs text-slate-400">objektov</div>
          </div>
        ))}
      </div>

      <Card padded>
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-5">
            <IcoCheck className="w-7 h-7 text-[#1E3A5F]/50"/>
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-2">Governance objekty sa registrujú automaticky</h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Objekty sa automaticky registrujú pri pipeline behoch — zdrojové tabuľky, mappingy, numerátory, views a materialized views.
            Zatiaľ žiadne produkčné objekty. Spustite prvý pipeline beh v sekcii <span className="font-medium text-slate-700">Pipeline Orchestrátor</span>.
          </p>
        </div>
      </Card>
    </div>
  );
}
window.SectionGovernance = SectionGovernance;
