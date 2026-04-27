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
              { id: 'users', label: 'Users & Roles', count: USERS.length },
              { id: 'audit', label: 'Audit Log' },
              { id: 'sql',   label: 'SQL Manager',   count: SQL_OBJECTS.length },
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
  const { dbReady } = useAppState();
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-7">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Connection profiles</h3>
        <div className="space-y-2">
          {/* Supabase connection (live) */}
          <div className="rounded-md ring-1 ring-[#1E3A5F]/30 bg-[#1E3A5F]/[3%] p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center"><IcoServer className="w-4 h-4 text-slate-600"/></div>
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
              <Badge tone={dbReady ? 'success' : 'warning'} dot>{dbReady ? 'connected' : 'connecting…'}</Badge>
              <div className="text-[10.5px] text-slate-400 font-mono mt-1">eu-central-1</div>
            </div>
          </div>
          {CONNECTION_PROFILES.map((c, i) => (
            <div key={i} className="rounded-md ring-1 ring-slate-200 p-3.5 flex items-center gap-3 opacity-60">
              <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center"><IcoServer className="w-4 h-4 text-slate-600"/></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                <div className="text-[11.5px] font-mono text-slate-500 mt-0.5 truncate">{c.driver} · {c.host}:{c.port} · {c.db}</div>
              </div>
              <div className="text-right">
                <Badge tone="draft">legacy / mock</Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<IcoPlus className="w-3.5 h-3.5"/>}>Nový profil</Button>
          <Button variant="secondary" size="sm" icon={<IcoCheck className="w-3.5 h-3.5"/>}>Test connection</Button>
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
      </div>
    </div>
  );
}

function AdminUsers() {
  const roleColor = { Admin: 'navy', Editor: 'info', Viewer: 'neutral', System: 'draft' };
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Užívatelia</h3>
      <div className="rounded-md ring-1 ring-slate-200 overflow-hidden">
        <Table>
          <THead cols={[
            { label: 'Meno' },
            { label: 'E-mail' },
            { label: 'Rola', className: 'w-28' },
            { label: 'Posledné prihlásenie', className: 'w-44' },
            { label: '', className: 'w-12' },
          ]}/>
          <tbody>
            {USERS.map((u, i) => (
              <tr key={u.email} className={cls('border-b border-slate-100 last:border-0 hover:bg-slate-50/60', i % 2 ? 'bg-slate-50/30' : '')}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] text-[11px] font-bold flex items-center justify-center">
                      {u.name.split(' ').map(s => s[0]).join('').slice(0,2)}
                    </span>
                    <span className="text-[13px] font-medium text-slate-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[12.5px] font-mono text-slate-500">{u.email}</td>
                <td className="px-4 py-2.5"><Badge tone={roleColor[u.role]}>{u.role}</Badge></td>
                <td className="px-4 py-2.5 text-[12.5px] text-slate-600">{u.last}</td>
                <td className="px-4 py-2.5 text-right"><button className="text-slate-400 hover:text-slate-700"><IcoDots className="w-4 h-4"/></button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <h3 className="text-sm font-semibold text-slate-800 mt-6 mb-3">Action codes</h3>
      <div className="rounded-md ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/60">
              <th className="px-4 py-2.5 font-semibold">Action code</th>
              <th className="px-4 py-2.5 font-semibold w-24 text-center">Admin</th>
              <th className="px-4 py-2.5 font-semibold w-24 text-center">Editor</th>
              <th className="px-4 py-2.5 font-semibold w-24 text-center">Viewer</th>
            </tr>
          </thead>
          <tbody>
            {ACTION_CODES.map((a, i) => (
              <tr key={a.code} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                <td className="px-4 py-2 font-mono text-[12.5px] text-slate-800">{a.code}</td>
                {['admin','editor','viewer'].map(r => (
                  <td key={r} className="px-4 py-2 text-center">
                    {a[r] ? <IcoCheck className="w-4 h-4 text-emerald-500 inline"/> : <span className="text-slate-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminAudit() {
  const { auditLog, dbReady } = useAppState();
  const [liveLog, setLiveLog]   = React.useState([]);
  const [loading, setLoading]   = React.useState(false);
  const [user, setUser]         = React.useState('all');
  const [act, setAct]           = React.useState('all');

  // Načítaj live audit log zo Supabase pri otvorení tabu
  React.useEffect(() => {
    if (!dbReady) return;
    setLoading(true);
    dbLoadAuditLog(200).then(rows => {
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
  }, [dbReady]);

  // Kombinuj: live DB záznamy + lokálne (z aktuálnej session) + mock
  const combined = React.useMemo(() => {
    const localNew = auditLog.filter(a => !a.fromDb);
    return [...localNew, ...liveLog, ...AUDIT];
  }, [auditLog, liveLog]);

  const users   = ['all', ...Array.from(new Set(combined.map(a => a.user)))];
  const actions = ['all', ...Array.from(new Set(combined.map(a => a.action)))];
  const filtered = combined.filter(a =>
    (user === 'all' || a.user === user) &&
    (act  === 'all' || a.action === act)
  );

  const newCount = auditLog.filter(a => !a.fromDb).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Select value={user} onChange={setUser} options={users.map(u => ({value:u, label: u === 'all' ? 'Všetci používatelia' : u}))}/>
        <Select value={act}  onChange={setAct}  options={actions.map(a => ({value:a, label: a === 'all' ? 'Všetky akcie' : a}))}/>
        <Select value="all"  onChange={()=>{}}  options={[{value:'1d',label:'Posledných 24h'},{value:'7d',label:'Posledných 7 dní'},{value:'all',label:'Všetko'}]}/>
        <div className="flex-1"/>
        {dbReady && <Badge tone="success" dot>Supabase · live</Badge>}
        {!dbReady && <Badge tone="warning" dot>offline</Badge>}
        {newCount > 0 && <Badge tone="navy">{newCount} nových akcií</Badge>}
        {loading && <span className="text-xs text-slate-400">Načítavam…</span>}
        <Button variant="secondary" size="sm" icon={<IcoDownload className="w-3.5 h-3.5"/>}>Export CSV</Button>
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
  const typeColor = {
    'VIEW':      'info',
    'MAT. VIEW': 'navy',
    'FUNCTION':  'success',
    'PROCEDURE': 'warning',
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Input placeholder="Hľadať SQL objekt…" className="flex-1"/>
        <Select value="all" onChange={()=>{}} options={[{value:'all',label:'Všetky typy'},{value:'view',label:'Views'},{value:'mv',label:'Materialized'},{value:'fn',label:'Functions'},{value:'sp',label:'Procedures'}]}/>
        <Button variant="primary" size="sm" icon={<IcoPlus className="w-3.5 h-3.5"/>}>Nový objekt</Button>
      </div>
      <div className="rounded-md ring-1 ring-slate-200 overflow-hidden">
        <Table>
          <THead cols={[
            { label: 'Objekt' },
            { label: 'Typ',            className: 'w-32' },
            { label: 'Verzia',         className: 'w-20' },
            { label: 'Závislosti',     className: 'w-24' },
            { label: 'Posledná zmena', className: 'w-44' },
            { label: '',               className: 'w-12' },
          ]}/>
          <tbody>
            {SQL_OBJECTS.map((s, i) => (
              <tr key={s.name} className={cls('border-b border-slate-100 last:border-0 hover:bg-slate-50/60', i % 2 ? 'bg-slate-50/30' : '')}>
                <td className="px-4 py-2.5 font-mono text-[12.5px] text-slate-800">{s.name}</td>
                <td className="px-4 py-2.5"><Badge tone={typeColor[s.type]}>{s.type}</Badge></td>
                <td className="px-4 py-2.5 font-mono text-slate-700 text-[12px]">{s.version}</td>
                <td className="px-4 py-2.5 font-mono tabular-nums text-slate-600">{s.deps}</td>
                <td className="px-4 py-2.5 text-[12.5px] text-slate-600">{s.modAt} <span className="text-slate-400">·</span> {s.modBy}</td>
                <td className="px-4 py-2.5 text-right"><button className="text-slate-400 hover:text-slate-700"><IcoCode className="w-4 h-4"/></button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

window.SectionAdmin = SectionAdmin;
