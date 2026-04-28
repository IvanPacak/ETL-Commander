// Section 1 — Domov (Dashboard)
function SectionDashboard() {
  const { uploadedFiles, transformedData, dbStatus } = useAppState();
  const max = Math.max(...RUN_HISTORY_7D.map(d => d.value));
  const activity = [
    { time: '03:14', label: 'RAW phase dokončená',       sub: '1,247,832 riadkov · 4m 12s', tone: 'success' },
    { time: '03:18', label: 'SAVE phase dokončená',      sub: 'delta: 23,451 changes · 3m 47s', tone: 'success' },
    { time: '03:22', label: 'ANALYTICS phase dokončená', sub: 'mv_pl_monthly, mv_balance_sheet refresh', tone: 'success' },
    { time: '06:02', label: 'ECB FX import',             sub: '245 záznamov · automaticky', tone: 'success' },
    { time: '08:14', label: 'Peter Novák sa prihlásil',  sub: 'IP 10.4.1.18 · admin session', tone: 'info' },
    { time: '09:14', label: 'Mapping aktivovaný',        sub: 'account_category v12 → v13', tone: 'navy' },
  ];

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

  return (
    <div className="fade-in">
      <PageHeader
        title="Dobrý deň, Peter"
        subtitle={`Pondelok 27. apríla 2026 · Posledný úspešný beh pipeline: dnes 03:22`}
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
          sublabel="Posledný beh: dnes 03:14"
          tone="green"
          icon={<IcoActivity className="w-4 h-4"/>}
        />
        <StatTile
          label={realStats ? 'Nahraných riadkov' : 'Spracovaných riadkov dnes'}
          value={realStats ? realStats.totalRows.toLocaleString('sk-SK') : '1 247 832'}
          sublabel={realStats ? 'z nahraných dát' : '+0,4 % oproti včerajšku'}
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
              value="47"
              sublabel="3 v reviewe, 2 draft"
              tone="navy"
              icon={<IcoMap className="w-4 h-4"/>}
            />
            <StatTile
              label="Aktívne numerátory"
              value="12"
              sublabel="1 pending activation"
              tone="amber"
              icon={<IcoHash className="w-4 h-4"/>}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Run trend */}
        <Card
          className="col-span-2"
          title="Pipeline behy — posledných 7 dní"
          subtitle="Spracovaných riadkov v RAW fáze (denne)"
          right={<Segmented options={[{value:'7d',label:'7 dní'},{value:'30d',label:'30 dní'},{value:'q',label:'Kvartál'}]} value="7d" onChange={()=>{}}/>}
        >
          <div className="flex items-end gap-3 px-1 pb-1" style={{ height: 176 }}>
            {RUN_HISTORY_7D.map((d, i) => {
              const barH = Math.max(6, Math.round((d.value / max) * 150));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group" style={{ height: '100%' }}>
                  <div className="w-full flex items-end justify-center" style={{ height: 154 }}>
                    <div
                      className="w-full rounded-t-sm bg-[#1E3A5F]/85 group-hover:bg-[#1E3A5F] transition-colors relative"
                      style={{ height: barH }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[10px] font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                        {d.value.toLocaleString('sk-SK')}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{d.day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Priemer / deň</div>
              <div className="font-semibold text-slate-800 mt-0.5">1 234 190</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Najdlhší beh</div>
              <div className="font-semibold text-slate-800 mt-0.5">10m 02s <span className="text-slate-400 font-normal">(štvrtok)</span></div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Úspešnosť</div>
              <div className="font-semibold text-emerald-600 mt-0.5">95,2 % <span className="text-slate-400 font-normal">(20/21)</span></div>
            </div>
          </div>
        </Card>

        {/* Activity */}
        <Card title="Nedávna aktivita" subtitle="Dnes" padded={false}>
          <ol className="relative px-5 py-4">
            <div className="absolute left-[34px] top-5 bottom-5 w-px bg-slate-200"></div>
            {activity.map((a, i) => (
              <li key={i} className="flex gap-3 py-2.5 relative">
                <div className="w-12 shrink-0 text-[11px] font-mono text-slate-500 pt-1">{a.time}</div>
                <div className={cls(
                  'w-2.5 h-2.5 rounded-full mt-1.5 ring-4 ring-white relative z-10 shrink-0',
                  a.tone === 'success' && 'bg-emerald-500',
                  a.tone === 'info' && 'bg-sky-500',
                  a.tone === 'navy' && 'bg-[#1E3A5F]',
                )}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-800 leading-snug">{a.label}</div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">{a.sub}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card title="Najbližšie naplánované" className="col-span-1">
          <ul className="-my-1">
            {SCHEDULED.slice(0,3).map((s,i) => (
              <li key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <div className="text-[13px] font-medium text-slate-800">{s.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{s.cronLabel}</div>
                </div>
                <Badge tone="navy" dot>{s.cron}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Stav systému" className="col-span-1">
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center justify-between"><span className="text-slate-600">PostgreSQL 16 (prod)</span><Badge tone="success" dot>online</Badge></li>
            <li className="flex items-center justify-between"><span className="text-slate-600">AS400 connector</span><Badge tone="success" dot>online</Badge></li>
            <li className="flex items-center justify-between"><span className="text-slate-600">Fileserver SMB</span><Badge tone="success" dot>online</Badge></li>
            <li className="flex items-center justify-between"><span className="text-slate-600">ECB feed</span><Badge tone="success" dot>online</Badge></li>
            <li className="flex items-center justify-between"><span className="text-slate-600">Disk (warehouse)</span><Badge tone="warning" dot>62 % použité</Badge></li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Supabase DB</span>
              <Badge tone={dbStatus === 'online' ? 'success' : dbStatus === 'offline' ? 'warning' : 'navy'} dot>
                {dbStatus === 'online' ? 'online' : dbStatus === 'offline' ? 'offline' : 'connecting…'}
              </Badge>
            </li>
          </ul>
        </Card>

        <Card title="Drift &amp; výstrahy" className="col-span-1">
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2.5">
              <IcoWarn className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"/>
              <div>
                <div className="text-slate-800 font-medium">P&amp;L Sign Numerator drift</div>
                <div className="text-xs text-slate-500">3 účty v produkcii nesedia s definíciou</div>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <IcoWarn className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"/>
              <div>
                <div className="text-slate-800 font-medium">NBS FX feed pomalý</div>
                <div className="text-xs text-slate-500">timeout 4.7s · práh 3s</div>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <IcoCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/>
              <div>
                <div className="text-slate-800 font-medium">Validácia mappingov</div>
                <div className="text-xs text-slate-500">47/47 OK</div>
              </div>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
window.SectionDashboard = SectionDashboard;
