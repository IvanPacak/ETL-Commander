// Section 11 — Admin (4 tabs) · Supabase-connected Audit Log
function SectionAdmin() {
  const [tab, setTab] = React.useState('db');

  return (
    <div className="fade-in">
      <PageHeader
        title="Admin"
        subtitle="Konfigurácia DB, používatelia, audit log a SQL objekty"
      />

      <Card padded={false}>
        <div className="px-5">
          <Tabs
            tabs={[
              { id: 'db',    label: 'Database Setup' },
              { id: 'users', label: 'Users & Roles' },
              { id: 'audit', label: 'Audit Log' },
              { id: 'sql',   label: 'SQL Manager' },
            ]}
            value={tab} onChange={setTab}
          />
        </div>
        <div className="p-5">
          {tab === 'db'    && <AdminDb/>}
          {tab === 'users' && <AdminUsers/>}
          {tab === 'audit' && <AdminAudit/>}
          {tab === 'sql'   && <AdminSql/>}
        </div>
      </Card>
    </div>
  );
}

function AdminDb() {
  const { dbStatus } = useAppState();
  const [showReset, setShowReset]   = React.useState(false);
  const [resetting, setResetting]   = React.useState(false);
  const [resetDone, setResetDone]   = React.useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      await window.etlResetDatabase();
      setResetDone(true);
      setTimeout(() => { setShowReset(false); setResetting(false); setResetDone(false); }, 1500);
    } catch (e) {
      console.error('[ETL Reset] Failed:', e.message);
      setResetting(false);
      setShowReset(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Connection profiles</h3>
        <div className="space-y-2">
          <div className="rounded-md ring-1 ring-[#1E3A5F]/30 bg-[#1E3A5F]/[3%] p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center">
              <IcoServer className="w-4 h-4 text-slate-600"/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">SUPABASE_PROD</span>
                <Badge tone="navy">default</Badge>
              </div>
              <div className="text-[11.5px] font-mono text-slate-500 mt-0.5 truncate">
                PostgreSQL 17 · clnkarllsszrlobvxtdw.supabase.co:5432 · etl_commander
              </div>
            </div>
            <div className="text-right">
              <Badge tone={dbStatus === 'online' ? 'success' : 'warning'} dot>
                {dbStatus === 'online' ? 'connected' : dbStatus === 'offline' ? 'offline' : 'connecting…'}
              </Badge>
              <div className="text-[10.5px] text-slate-400 font-mono mt-1">eu-central-1</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Ďalšie connection profily (AS400, SMB, JDBC) budú konfigurovateľné v Fáze 2.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<IcoPlus className="w-3.5 h-3.5"/>}>Nový profil</Button>
          <Button variant="secondary" size="sm" icon={<IcoCheck className="w-3.5 h-3.5"/>}>Test connection</Button>
          <Button
            variant="secondary" size="sm"
            onClick={() => setShowReset(true)}
            className="text-red-600 hover:text-red-700"
          >Reset Database…</Button>
        </div>
      </div>

      <div className="col-span-5 space-y-4">
        <div className="rounded-md ring-1 ring-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-800">Aktuálny profil</h4>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Profil</dt><dd className="font-mono text-slate-800">SUPABASE_PROD</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Engine</dt><dd className="text-slate-800">PostgreSQL 17.6</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Region</dt><dd className="text-slate-800">eu-central-1 (Frankfurt)</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Encoding</dt><dd className="font-mono text-slate-800">UTF-8</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Timezone</dt><dd className="font-mono text-slate-800">Europe/Bratislava</dd></div>
          </dl>
        </div>

        <div className="rounded-md ring-1 ring-slate-200 p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Bootstrap status</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Schema initialized <span className="font-mono text-slate-500">v1.0.0</span></span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Schemas: raw, public, audit, analytics</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">RLS policies enabled</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Default mapping rules seeded</span></li>
            <li className="flex items-center gap-2"><IcoCheck className="w-4 h-4 text-emerald-500"/><span className="text-slate-700">Materialized view: analytics.gl_summary</span></li>
          </ul>
        </div>

        <div className="rounded-md ring-1 ring-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-800">Automatizácia (Fáza 3)</h4>
            <Badge tone="navy">Coming soon</Badge>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Pre nočné automatické pipeline behy odporúčame aktivovať <span className="font-mono font-medium text-slate-700">pg_cron</span> extension v Supabase.
          </p>
          <a
            href="https://supabase.com/dashboard/project/clnkarllsszrlobvxtdw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1E3A5F] hover:underline mb-3"
          >
            <IcoGlobe className="w-3.5 h-3.5"/>
            Otvoriť Supabase Dashboard
          </a>
          <div className="rounded-md bg-slate-900 p-3 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
            <span className="text-slate-500">-- Aktivuj pg_cron (raz)</span>{'\n'}
            <span className="text-sky-400">CREATE EXTENSION IF NOT EXISTS</span> pg_cron;{'\n\n'}
            <span className="text-slate-500">-- Denný pipeline beh o 23:00</span>{'\n'}
            <span className="text-sky-400">SELECT</span> cron.<span className="text-emerald-400">schedule</span>(<span className="text-amber-300">'daily-pipeline'</span>, <span className="text-amber-300">'0 23 * * *'</span>,{'\n'}
            {'  '}<span className="text-amber-300">$$INSERT INTO public.pipeline_runs (phase, status, rows_processed, duration_ms, started_at)</span>{'\n'}
            {'    '}<span className="text-amber-300">VALUES ('RAW', 'scheduled', 0, 0, NOW())$$</span>{'\n'}
            );
          </div>
        </div>
      </div>

      {/* Reset DB Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => !resetting && setShowReset(false)}>
          <div className="bg-white rounded-lg shadow-2xl ring-1 ring-slate-200 w-[440px] p-6" onClick={e => e.stopPropagation()}>
            {resetDone ? (
              <div className="py-4 text-center">
                <IcoCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2"/>
                <p className="text-sm font-semibold text-slate-800">Reset dokončený ✓</p>
                <p className="text-xs text-slate-500 mt-1">Dáta sú vymazané a demo seed je obnovený.</p>
              </div>
            ) : (
              <>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Reset Database</h3>
                <p className="text-sm text-slate-600 mb-2">Táto akcia vymaže všetky záznamy vrátane:</p>
                <ul className="text-xs text-slate-500 space-y-1 mb-4 pl-4 list-disc">
                  <li>Mapping pravidlá a rulesets</li>
                  <li>Numerátor rulesets a pravidlá</li>
                  <li>Audit log záznamy</li>
                  <li>Pipeline behy a importované súbory</li>
                  <li>Raw GL transakcie</li>
                </ul>
                <p className="text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-md px-3 py-2 mb-5">
                  Po resete sa automaticky nasadí demo seed (4 mappingy, 3 numerátory). Akciu nie je možné vrátiť.
                </p>
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button variant="secondary" onClick={() => setShowReset(false)} disabled={resetting}>Zrušiť</Button>
                  <Button variant="primary" onClick={handleReset} disabled={resetting}>
                    {resetting ? 'Resetujem…' : 'Potvrdiť reset'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUsers() {
  return (
    <div className="py-14 text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-5">
        <IcoCheck className="w-7 h-7 text-[#1E3A5F]/50"/>
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-2">Správa používateľov — Fáza 2</h3>
      <p className="text-sm text-slate-500 leading-relaxed">
        Role-based access control (RBAC) bude dostupný v ďalšej verzii. Používatelia budú spravovaní cez
        Supabase Auth s priradením rolí <span className="font-medium text-slate-700">Admin / Editor / Viewer</span>.
      </p>
      <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-50 ring-1 ring-slate-200 text-xs text-slate-600 font-mono">
        <IcoCheck className="w-3.5 h-3.5 text-emerald-500"/>
        Plánovaný v Q3 2026
      </div>
    </div>
  );
}

function AdminAudit() {
  const { auditLog, dbStatus } = useAppState();
  const [liveLog, setLiveLog] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [user, setUser]       = React.useState('all');
  const [act, setAct]         = React.useState('all');

  React.useEffect(() => {
    if (dbStatus !== 'online') return;
    setLoading(true);
    window.dbLoadAuditLog(200).then(rows => {
      const formatted = rows.map(l => ({
        time:   new Date(l.ts).toLocaleString('sk-SK', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        user:   l.user_name,
        action: l.action_type,
        detail: l.detail,
        fromDb: true,
      }));
      setLiveLog(formatted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [dbStatus]);

  const combined = React.useMemo(() => {
    const localNew = (auditLog || []).filter(a => !a.fromDb);
    return [...localNew, ...liveLog];
  }, [auditLog, liveLog]);

  const users   = ['all', ...Array.from(new Set(combined.map(a => a.user).filter(Boolean)))];
  const actions = ['all', ...Array.from(new Set(combined.map(a => a.action).filter(Boolean)))];
  const filtered = combined.filter(a =>
    (user === 'all' || a.user === user) &&
    (act  === 'all' || a.action === act)
  );

  const newCount = (auditLog || []).filter(a => !a.fromDb).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Select value={user} onChange={setUser} options={users.map(u => ({value:u, label: u === 'all' ? 'Všetci používatelia' : u}))}/>
        <Select value={act}  onChange={setAct}  options={actions.map(a => ({value:a, label: a === 'all' ? 'Všetky akcie' : a}))}/>
        <Select value="all"  onChange={()=>{}}  options={[{value:'1d',label:'Posledných 24h'},{value:'7d',label:'Posledných 7 dní'},{value:'all',label:'Všetko'}]}/>
        <div className="flex-1"/>
        {dbStatus === 'online' && <Badge tone="success" dot>Supabase · live</Badge>}
        {dbStatus !== 'online' && <Badge tone="warning" dot>offline</Badge>}
        {newCount > 0 && <Badge tone="navy">{newCount} nových akcií</Badge>}
        {loading && <span className="text-xs text-slate-400">Načítavam…</span>}
        <Button variant="secondary" size="sm" icon={<IcoDownload className="w-3.5 h-3.5"/>} onClick={() => {
          const rows = [['Time','User','Action','Detail']].concat(
            filtered.map(a => [a.time, a.user, a.action, a.detail || ''].map(v => '"' + String(v || '').replace(/"/g, '""') + '"'))
          );
          const csv  = rows.map(r => r.join(',')).join('\n');
          const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href = url; a.download = 'audit_log.csv'; a.click();
          URL.revokeObjectURL(url);
        }}>Export CSV</Button>
      </div>

      {filtered.length === 0 && !loading ? (
        <EmptyHint>Zatiaľ nebola vykonaná žiadna akcia.</EmptyHint>
      ) : (
        <div className="rounded-md ring-1 ring-slate-200 overflow-hidden">
          <Table>
            <THead cols={[
              { label: 'Time',   className: 'w-44' },
              { label: 'User',   className: 'w-44' },
              { label: 'Action', className: 'w-48' },
              { label: 'Detail' },
              { label: 'Zdroj',  className: 'w-24' },
            ]}/>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} className={cls(
                  'border-b border-slate-100 last:border-0',
                  !a.fromDb ? 'bg-[#1E3A5F]/[2%]' : (i % 2 ? 'bg-slate-50/30' : '')
                )}>
                  <td className="px-4 py-2 font-mono text-[12px] text-slate-600">{a.time}</td>
                  <td className="px-4 py-2 text-[12.5px] text-slate-800">{a.user}</td>
                  <td className="px-4 py-2">
                    <span className="font-mono text-[11.5px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{a.action}</span>
                  </td>
                  <td className="px-4 py-2 text-[12px] text-slate-500">{a.detail || a.obj}</td>
                  <td className="px-4 py-2">
                    {a.fromDb
                      ? <Badge tone="navy">DB</Badge>
                      : <Badge tone="success">session</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AdminSql() {
  const [showAiModal, setShowAiModal] = React.useState(false);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Input placeholder="Hľadať SQL objekt…" className="flex-1"/>
        <Select value="all" onChange={()=>{}} options={[{value:'all',label:'Všetky typy'},{value:'view',label:'Views'},{value:'mv',label:'Materialized'},{value:'fn',label:'Functions'},{value:'sp',label:'Procedures'}]}/>
        <Button variant="secondary" size="sm" icon={<span className="text-sm leading-none">✨</span>} onClick={() => setShowAiModal(true)}>
          AI generovať objekt
        </Button>
        <Button variant="primary" size="sm" icon={<IcoPlus className="w-3.5 h-3.5"/>} disabled title="Dostupné v Fáze 2">
          Nový objekt
        </Button>
      </div>

      <div className="py-14 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E3A5F]/5 flex items-center justify-center mb-4">
          <IcoCode className="w-6 h-6 text-[#1E3A5F]/40"/>
        </div>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          SQL objekty (views, materialized views, funkcie) sa registrujú automaticky pri pipeline behu.
          Zatiaľ žiadne objekty — spustite prvý pipeline beh v sekcii <span className="font-medium text-slate-700">Pipeline Orchestrátor</span>.
        </p>
      </div>

      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAiModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 w-[500px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A5F]/10 to-[#1E3A5F]/5 flex items-center justify-center ring-1 ring-[#1E3A5F]/15">
                <span className="text-lg leading-none">✨</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">AI Generovať SQL objekt</h3>
                <p className="text-xs text-slate-500 mt-0.5">Generuje VIEW / MAT. VIEW / FUNCTION · Human-in-the-loop review</p>
              </div>
            </div>

            <div className="rounded-lg bg-[#1E3A5F]/[4%] ring-1 ring-[#1E3A5F]/10 p-4 mb-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                AI vygeneruje SQL definíciu nového objektu na základe existujúcej schémy a mapping pravidiel.
                Každý objekt musí schváliť DBA pred nasadením.
              </p>
            </div>

            <div className="space-y-2.5 mb-5">
              {[
                'Generovanie VIEW z analytickej vrstvy',
                'Materialized view s automatickým REFRESH plánom',
                'SQL funkcia s parametrami a typmi',
                'Dependency graph pred nasadením',
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
              <Button variant="primary" disabled icon={<span className="text-sm leading-none">✨</span>}>Generovať objekt</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.SectionAdmin = SectionAdmin;
