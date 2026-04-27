// Section 10 — Scheduler
function SectionScheduler() {
  const [selected, setSelected] = React.useState(0);
  const j = SCHEDULED[selected];
  const history = [
    { time: 'dnes 23:00',     status: 'success', dur: '4m 12s', rows: '1,247,832' },
    { time: 'včera 23:00',    status: 'success', dur: '4m 08s', rows: '1,243,118' },
    { time: '25.4.2026 23:00',status: 'success', dur: '4m 19s', rows: '1,239,801' },
    { time: '24.4.2026 23:00',status: 'failed',  dur: '0m 47s', rows: '— (timeout)' },
    { time: '23.4.2026 23:00',status: 'success', dur: '4m 11s', rows: '1,244,920' },
    { time: '22.4.2026 23:00',status: 'success', dur: '4m 03s', rows: '1,240,118' },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Scheduler"
        subtitle="Cron-based plánovač pre importy, pipeline behy a údržbu"
        actions={<Button icon={<IcoPlus className="w-4 h-4"/>}>Nový scheduled job</Button>}
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <Card title="Naplánované úlohy" padded={false}>
            <Table>
              <THead cols={[
                { label: 'Job name' },
                { label: 'Cron', className: 'w-36' },
                { label: 'Last run', className: 'w-44' },
                { label: 'Status', className: 'w-24' },
                { label: '', className: 'w-12' },
              ]}/>
              <tbody>
                {SCHEDULED.map((s, i) => (
                  <tr key={i}
                      onClick={() => setSelected(i)}
                      className={cls(
                        'border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                        selected === i ? 'bg-[#1E3A5F]/5' : (i % 2 ? 'bg-slate-50/30 hover:bg-slate-50' : 'hover:bg-slate-50')
                      )}>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium text-slate-800">{s.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11.5px] text-slate-700">{s.cron}</div>
                      <div className="text-[11px] text-slate-500">{s.cronLabel}</div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-slate-700">{s.last}</td>
                    <td className="px-4 py-3"><Badge tone="success" dot>OK</Badge></td>
                    <td className="px-4 py-3 text-right text-slate-400"><IcoChevR className="w-4 h-4"/></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        <div className="col-span-4 space-y-4">
          <Card title={j.name} subtitle="Detail úlohy">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Cron</span><span className="font-mono text-slate-800">{j.cron}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Frekvencia</span><span className="text-slate-800">{j.cronLabel}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Posledný beh</span><span className="text-slate-800">{j.last}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span><Badge tone="success" dot>active</Badge></div>
              <div className="flex justify-between"><span className="text-slate-500">Owner</span><span className="text-slate-800">Peter Novák</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Notifikácia</span><span className="text-slate-800">e-mail pri zlyhaní</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
              <Button variant="secondary" size="sm" icon={<IcoPlay className="w-3.5 h-3.5"/>}>Spustiť teraz</Button>
              <Button variant="ghost" size="sm">Pozastaviť</Button>
            </div>
          </Card>

          <Card title="Parametre">
            <pre className="bg-slate-900 text-slate-100 rounded-md p-3 text-[11.5px] font-mono overflow-x-auto">
{`{
  "phase":     "RAW",
  "sources":   ["AS400", "ECB", "FILESERVER"],
  "timeout":   "30m",
  "retry":     2,
  "notify_on": ["fail", "slow"]
}`}
            </pre>
          </Card>
        </div>
      </div>

      <Card title="História behov tejto úlohy" className="mt-4" padded={false}>
        <Table>
          <THead cols={[
            { label: 'Timestamp', className: 'w-56' },
            { label: 'Status', className: 'w-32' },
            { label: 'Trvanie', className: 'w-28' },
            { label: 'Riadky' },
          ]}/>
          <tbody>
            {history.map((h, i) => (
              <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                <td className="px-4 py-2.5 font-mono text-[12px] text-slate-700">{h.time}</td>
                <td className="px-4 py-2.5">{h.status === 'success' ? <Badge tone="success" dot>success</Badge> : <Badge tone="error" dot>failed</Badge>}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-slate-600 tabular-nums">{h.dur}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-slate-600 tabular-nums">{h.rows}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
window.SectionScheduler = SectionScheduler;
