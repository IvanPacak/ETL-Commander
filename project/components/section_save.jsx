// Section 6 — Save-to-Schema
function SectionSave() {
  const [activeName, setActiveName] = React.useState('analytics');
  const [mode, setMode] = React.useState('DELTA');
  const [preload, setPreload] = React.useState('KEYS');
  const [showAiModal, setShowAiModal] = React.useState(false);
  const s = SCHEMAS.find(x => x.name === activeName);
  const cols = SCHEMA_COLUMNS[activeName] || SCHEMA_COLUMNS.analytics;

  return (
    <div className="fade-in">
      <PageHeader
        title="Save-to-Schema"
        subtitle="Uloženie spracovaných dát do cieľových schém s podporou DELTA / FULL / HASH módov"
        actions={
          <>
            <Button
              icon={<span className="text-sm leading-none">✨</span>}
              variant="secondary"
              onClick={() => setShowAiModal(true)}
            >AI navrhnúť transformáciu</Button>
            <Button icon={<IcoEye className="w-4 h-4"/>} variant="secondary">Náhľad delta zmien</Button>
          </>
        }
      />

      <Card title="Cieľové schémy" padded={false} className="mb-6">
        <Table>
          <THead cols={[
            { label: 'Schema' },
            { label: 'Tabuľky', className: 'w-24' },
            { label: 'Posledný save', className: 'w-44' },
            { label: 'Mode', className: 'w-28' },
            { label: 'Status', className: 'w-24' },
            { label: '', className: 'w-12' },
          ]}/>
          <tbody>
            {SCHEMAS.map((sc, i) => (
              <tr key={sc.name}
                  onClick={() => setActiveName(sc.name)}
                  className={cls(
                    'border-b border-slate-100 last:border-0 cursor-pointer transition-colors',
                    activeName === sc.name ? 'bg-[#1E3A5F]/5 ring-1 ring-inset ring-[#1E3A5F]/20' : (i % 2 ? 'bg-slate-50/30' : 'hover:bg-slate-50/60')
                  )}>
                <td className="px-4 py-3 font-mono text-[13px] font-semibold text-slate-800">{sc.name}</td>
                <td className="px-4 py-3 tabular-nums text-slate-600">{sc.tables}</td>
                <td className="px-4 py-3 text-slate-600 text-[12.5px]">{sc.last}</td>
                <td className="px-4 py-3"><Badge tone={sc.mode === 'FULL' ? 'warning' : sc.mode === 'HASH' ? 'info' : 'navy'}>{sc.mode}</Badge></td>
                <td className="px-4 py-3"><Badge tone="success" dot>OK</Badge></td>
                <td className="px-4 py-3 text-right text-slate-400"><IcoChevR className="w-4 h-4"/></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Save mode" subtitle={s.name} className="col-span-1">
          <div className="space-y-1.5">
            {['FULL','DELTA','HASH'].map(m => (
              <label key={m} className={cls('flex items-start gap-3 px-3 py-2.5 rounded-md ring-1 cursor-pointer transition-colors', mode === m ? 'ring-[#1E3A5F] bg-[#1E3A5F]/5' : 'ring-slate-200 hover:bg-slate-50')}>
                <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} className="mt-0.5"/>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{m}</div>
                  <div className="text-[11.5px] text-slate-500">
                    {m === 'FULL'  && 'Truncate + insert všetkých riadkov.'}
                    {m === 'DELTA' && 'Iba zmenené / nové / vymazané riadky podľa KEY.'}
                    {m === 'HASH'  && 'Porovnanie cez hash riadku, žiadne KEY columns.'}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Preload mode</div>
            <Segmented options={[{value:'NONE',label:'NONE'},{value:'KEYS',label:'KEYS'},{value:'FULL',label:'FULL'}]} value={preload} onChange={setPreload}/>
            <p className="text-[11.5px] text-slate-500 mt-2">
              {preload === 'NONE' && 'Žiadne preloadovanie cieľa — najrýchlejšie pre malé tabuľky.'}
              {preload === 'KEYS' && 'Načítajú sa len kľúče cieľa pre delta porovnanie.'}
              {preload === 'FULL' && 'Načíta sa celá cieľová tabuľka — najpomalšie, ale najpresnejšie.'}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Validation status</span><Badge tone="success" dot>Ready</Badge></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Estimated rows</span><span className="font-mono text-slate-800">23 451</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Estimated duration</span><span className="font-mono text-slate-800">~3m 50s</span></div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button variant="secondary" icon={<IcoEye className="w-4 h-4"/>}>Náhľad delta zmien</Button>
            <Button variant="primary" icon={<IcoPlay className="w-4 h-4"/>}>Spustiť save (manuálne)</Button>
          </div>
        </Card>

        <Card title={`${s.name} — stĺpce`} subtitle={`${cols.length} stĺpcov · primárny kľúč zvýraznený`} className="col-span-2" padded={false}>
          <Table>
            <THead cols={[
              { label: 'Stĺpec', className: 'w-56' },
              { label: 'Typ', className: 'w-44' },
              { label: 'PK', className: 'w-16' },
              { label: 'NN', className: 'w-16' },
              { label: 'Komentár' },
            ]}/>
            <tbody>
              {cols.map((c, i) => (
                <tr key={c.name} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                  <td className="px-4 py-2 font-mono text-[12.5px]">
                    {c.pk ? <span className="text-[#1E3A5F] font-semibold">🔑 {c.name}</span> : <span className="text-slate-700">{c.name}</span>}
                  </td>
                  <td className="px-4 py-2 font-mono text-[12px] text-slate-600">{c.type}</td>
                  <td className="px-4 py-2 text-center">{c.pk ? <span className="text-[#1E3A5F] font-bold">●</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-2 text-center">{c.nn ? <span className="text-slate-700 font-bold">●</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-2 text-[12px] text-slate-500">
                    {{ 'transaction_id': 'autoincrement, BIGSERIAL',
                       'period_yyyymm': 'YYYYMM, indexovaný',
                       'account_no': 'aplikuje sa account_category mapping',
                       'account_category': 'výsledok z mappingu',
                       'amount': 'v originálnej mene',
                       'amount_eur': 'prepočet cez raw.fx_rates',
                       'sign': 'aplikuje sa P&L Sign Numerator',
                       'imported_at': 'NOW() pri importe' }[c.name] || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAiModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A5F]/10 to-[#1E3A5F]/5 flex items-center justify-center ring-1 ring-[#1E3A5F]/15">
                <span className="text-lg leading-none">✨</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">AI Navrhnúť transformáciu</h3>
                <p className="text-xs text-slate-500 mt-0.5">Generuje SQL MERGE/UPSERT · Human-in-the-loop review pred spustením</p>
              </div>
            </div>

            <div className="rounded-lg bg-[#1E3A5F]/[4%] ring-1 ring-[#1E3A5F]/10 p-4 mb-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                AI vygeneruje optimalizovaný <span className="font-mono font-semibold text-[#1E3A5F]">SQL MERGE</span> query pre aktuálnu schému na základe detekovaných zmien.
                Každý query musí schváliť DBA — žiadna automatická exekúcia.
              </p>
            </div>

            <div className="space-y-2.5 mb-4">
              {[
                'Automatická detekcia INSERT / UPDATE / DELETE operácií',
                'Generovanie MERGE s optimálnym indexom a batch veľkosťou',
                'Odhad trvania a počtu dotknutých riadkov pred spustením',
                'DBA review flow — schválenie cez audit trail s komentárom',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <IcoCheck className="w-4 h-4 text-emerald-500 shrink-0"/>
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3 font-mono text-[12px] text-slate-600 mb-4 leading-relaxed">
              <span className="text-slate-400">-- Príklad výstupu</span><br/>
              <span className="text-[#1E3A5F] font-semibold">MERGE INTO</span> analytics.gl_transactions t<br/>
              <span className="text-[#1E3A5F] font-semibold">USING</span> staging.gl_delta s <span className="text-[#1E3A5F] font-semibold">ON</span> t.id = s.id<br/>
              <span className="text-[#1E3A5F] font-semibold">WHEN MATCHED THEN UPDATE SET</span> ...<br/>
              <span className="text-[#1E3A5F] font-semibold">WHEN NOT MATCHED THEN INSERT</span> ...
            </div>

            <div className="rounded-lg bg-amber-50 ring-1 ring-amber-200 p-3 mb-5">
              <div className="text-xs font-semibold text-amber-900 mb-1">Dostupnosť</div>
              <div className="text-xs text-amber-800 leading-relaxed">
                Táto funkcia je vo vývoji a bude dostupná v <span className="font-semibold">Q3 2026</span> ako súčasť ETL Commander Enterprise Edition.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setShowAiModal(false)}>Zatvoriť</Button>
              <Button variant="primary" disabled icon={<span className="text-sm leading-none">✨</span>}>Generovať SQL</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.SectionSave = SectionSave;
