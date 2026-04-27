// Section 8 — Data Governance
function SectionGovernance() {
  const [cat, setCat] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [owner, setOwner] = React.useState('all');
  const [q, setQ] = React.useState('');

  const cats    = ['all', ...Array.from(new Set(GOVERNANCE.map(g => g.cat)))];
  const owners  = ['all', ...Array.from(new Set(GOVERNANCE.map(g => g.owner)))];
  const statuses= ['all','Production','Review','Draft','Deprecated'];

  const filtered = GOVERNANCE.filter(g =>
    (cat === 'all' || g.cat === cat) &&
    (status === 'all' || g.status === status) &&
    (owner === 'all' || g.owner === owner) &&
    (q === '' || g.obj.toLowerCase().includes(q.toLowerCase()))
  );

  const counts = {
    Production: GOVERNANCE.filter(g => g.status === 'Production').length,
    Review:     GOVERNANCE.filter(g => g.status === 'Review').length,
    Draft:      GOVERNANCE.filter(g => g.status === 'Draft').length,
    Deprecated: GOVERNANCE.filter(g => g.status === 'Deprecated').length,
  };

  const statusTone = {
    'Production': 'success',
    'Review':     'warning',
    'Draft':      'draft',
    'Deprecated': 'error',
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Data Governance"
        subtitle="Inventár všetkých objektov v systéme a ich životný cyklus (maturity)"
      />

      {/* Lifecycle row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Production', count: counts.Production, tone: 'green',   ring: 'ring-emerald-200' },
          { label: 'Review',     count: counts.Review,     tone: 'amber',   ring: 'ring-amber-200' },
          { label: 'Draft',      count: counts.Draft,      tone: 'navy',    ring: 'ring-slate-200' },
          { label: 'Deprecated', count: counts.Deprecated, tone: 'red',     ring: 'ring-red-200' },
        ].map(s => (
          <button key={s.label} onClick={() => setStatus(s.label === status ? 'all' : s.label)}
                  className={cls('text-left rounded-lg bg-white p-4 ring-1 transition-colors',
                    status === s.label ? 'ring-2 ring-[#1E3A5F]' : s.ring + ' hover:ring-slate-300')}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
              <span className={cls('w-2.5 h-2.5 rounded-full',
                s.tone === 'green' ? 'bg-emerald-500' :
                s.tone === 'amber' ? 'bg-amber-500' :
                s.tone === 'red'   ? 'bg-red-500' : 'bg-slate-400')}></span>
            </div>
            <div className="mt-2 text-[26px] font-semibold tabular-nums text-slate-900">{s.count}</div>
            <div className="mt-1 text-xs text-slate-500">objektov</div>
          </button>
        ))}
      </div>

      <Card padded={false}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[260px]">
            <IcoSearch className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Hľadať objekt…"
              className="w-full h-9 pl-9 pr-3 text-sm rounded-md ring-1 ring-inset ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]"
            />
          </div>
          <Select value={cat} onChange={setCat} options={cats.map(c => ({value:c,label: c === 'all' ? 'Všetky kategórie' : c}))}/>
          <Select value={status} onChange={setStatus} options={statuses.map(s => ({value:s,label: s === 'all' ? 'Všetky statusy' : s}))}/>
          <Select value={owner} onChange={setOwner} options={owners.map(o => ({value:o,label: o === 'all' ? 'Všetci ownery' : o}))}/>
          <Button variant="secondary" size="sm" icon={<IcoDownload className="w-3.5 h-3.5"/>}>Export</Button>
        </div>
        <Table>
          <THead cols={[
            { label: 'Objekt' },
            { label: 'Kategória', className: 'w-32' },
            { label: 'Status', className: 'w-32' },
            { label: 'Owner', className: 'w-44' },
            { label: 'Posledná zmena', className: 'w-44' },
          ]}/>
          <tbody>
            {filtered.map((g, i) => (
              <tr key={g.obj} className={cls('border-b border-slate-100 last:border-0 hover:bg-slate-50/60', i % 2 ? 'bg-slate-50/30' : '')}>
                <td className="px-4 py-2.5 font-mono text-[12.5px] text-slate-800">{g.obj}</td>
                <td className="px-4 py-2.5"><Badge tone="neutral">{g.cat}</Badge></td>
                <td className="px-4 py-2.5"><Badge tone={statusTone[g.status]} dot>{g.status}</Badge></td>
                <td className="px-4 py-2.5 text-[12.5px] text-slate-700">{g.owner}</td>
                <td className="px-4 py-2.5 text-[12.5px] text-slate-500">{g.lastMod}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5}><EmptyHint>Žiadne objekty nezodpovedajú filtru.</EmptyHint></td></tr>}
          </tbody>
        </Table>
        <div className="px-5 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>{filtered.length} z {GOVERNANCE.length} objektov</span>
          <span className="font-mono">prod-pg.lan · etl_warehouse</span>
        </div>
      </Card>
    </div>
  );
}
window.SectionGovernance = SectionGovernance;
