// Section 7 — Object Graph (Lineage)
function SectionLineage() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Object Graph"
        subtitle="Lineage zdrojov, tabuliek, views a reportov"
      />
      <Card padded>
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-5">
            <IcoBranch className="w-7 h-7 text-[#1E3A5F]/50"/>
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-2">Object Graph bude vygenerovaný automaticky</h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Lineage sa zostavuje z audit logu a <span className="font-mono text-slate-700">pipeline_runs</span> po prvom úspešnom pipeline behu.
            Zobrazia sa tu zdrojové systémy, raw tabuľky, analytické views a ich závislosti v interaktívnom grafe.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-600 inline-block"></span>Source</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white ring-1 ring-slate-300 inline-block"></span>Table</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-100 ring-1 ring-sky-200 inline-block"></span>View</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#1E3A5F] inline-block"></span>Mat. View</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
window.SectionLineage = SectionLineage;
