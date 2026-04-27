// Section 3 — Importer
function SectionImporter() {
  const { loadFile, uploadedFiles, deduplicateSuppliers } = useAppState();
  const [tab, setTab] = React.useState('csv');
  const [drag, setDrag] = React.useState(false);
  const [loadedFile, setLoadedFile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [dedupResult, setDedupResult] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const sourceIcon = (s) => ({
    'CSV':      <IcoFile className="w-4 h-4"/>,
    'Excel':    <IcoFile className="w-4 h-4"/>,
    'HTTP':     <IcoGlobe className="w-4 h-4"/>,
    'Database': <IcoDb className="w-4 h-4"/>,
  }[s]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDedupResult(null);
    try {
      const result = await loadFile(file);
      setLoadedFile(result);
    } catch (e) {
      setError('Chyba pri načítaní súboru: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDedup = () => {
    if (!loadedFile) return;
    const nameCol = loadedFile.columns.find(c =>
      c.toLowerCase().includes('sup') || c.toLowerCase().includes('name') || c.toLowerCase() === 'supnm'
    ) || loadedFile.columns[0];
    const result = deduplicateSuppliers(loadedFile.name, nameCol);
    setDedupResult({ ...result, nameCol });
  };

  const isSupplierFile = loadedFile && (
    loadedFile.name.toLowerCase().includes('supplier') ||
    loadedFile.name.toLowerCase().includes('dodavatel')
  );

  const previewCols = loadedFile ? loadedFile.columns.slice(0, 8) : [];
  const previewRows = loadedFile ? loadedFile.rows.slice(0, 10) : [];

  const UploadZone = ({ accept }) => (
    <div
      onDragEnter={() => setDrag(true)}
      onDragLeave={() => setDrag(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={cls(
        'rounded-lg border-2 border-dashed p-10 text-center transition-colors',
        drag ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-slate-300 bg-slate-50/40 hover:bg-slate-50'
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e.target.files[0])}
      />
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"/>
          <div className="text-sm text-slate-600">Načítavam súbor…</div>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 mx-auto rounded-full bg-white ring-1 ring-slate-200 flex items-center justify-center mb-3">
            <IcoUpload className="w-5 h-5 text-[#1E3A5F]"/>
          </div>
          <div className="text-sm font-semibold text-slate-800">Pretiahnite súbor sem</div>
          <div className="text-xs text-slate-500 mt-1">alebo kliknite na tlačidlo nižšie. Max. 250 MB.</div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="primary" size="sm" icon={<IcoUpload className="w-3.5 h-3.5"/>} onClick={() => fileInputRef.current?.click()}>
              Prevziať súbor
            </Button>
            <Button variant="secondary" size="sm">Použiť \\fileserver\</Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Importer"
        subtitle="Definované zdroje dát a schedule pre ich pripojenie"
        actions={<Button icon={<IcoPlus className="w-4 h-4"/>}>Nový import</Button>}
      />

      <Card padded={false} className="mb-6">
        <div className="px-5">
          <Tabs
            tabs={[
              { id: 'csv',   label: 'CSV' },
              { id: 'excel', label: 'Excel' },
              { id: 'http',  label: 'HTTP' },
              { id: 'db',    label: 'Database' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="p-5">
          {tab === 'csv' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <UploadZone accept=".csv,.xlsx,.xls"/>
                {error && (
                  <div className="mt-3 rounded-md bg-red-50 ring-1 ring-red-200 px-4 py-3 flex items-start gap-2.5">
                    <IcoX className="w-4 h-4 text-red-500 mt-0.5 shrink-0"/>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}
              </div>
              <Card title="Nastavenia parsera" padded>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between"><span className="text-slate-600">Oddeľovač</span><Select value=";" onChange={()=>{}} options={[{value:';',label:'; (semicolon)'},{value:',',label:', (comma)'},{value:'\\t',label:'TAB'}]}/></div>
                  <div className="flex items-center justify-between"><span className="text-slate-600">Encoding</span><Select value="cp1250" onChange={()=>{}} options={[{value:'cp1250',label:'CP1250 (Windows-1250)'},{value:'utf8',label:'UTF-8'}]}/></div>
                  <div className="flex items-center justify-between"><span className="text-slate-600">Header riadok</span><Select value="1" onChange={()=>{}} options={[{value:'1',label:'1. riadok'},{value:'2',label:'2. riadok'},{value:'0',label:'bez headeru'}]}/></div>
                  <div className="flex items-center justify-between"><span className="text-slate-600">Decimal</span><Select value="," onChange={()=>{}} options={[{value:',',label:', (čiarka)'},{value:'.',label:'. (bodka)'}]}/></div>
                </div>
              </Card>
            </div>
          )}
          {tab === 'excel' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <UploadZone accept=".xlsx,.xls"/>
                {error && (
                  <div className="mt-3 rounded-md bg-red-50 ring-1 ring-red-200 px-4 py-3 flex items-start gap-2.5">
                    <IcoX className="w-4 h-4 text-red-500 mt-0.5 shrink-0"/>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}
              </div>
              <Card title="Frekvencia" padded>
                <Select value="manual" onChange={()=>{}} options={[{value:'manual',label:'Manuálne'},{value:'daily',label:'Denne'},{value:'weekly',label:'Týždenne'},{value:'monthly',label:'Mesačne'}]}/>
                <p className="text-xs text-slate-500 mt-3">Odporúčame pre Excel zdroje manuálny mód s notifikáciou na e-mail po neúspechu.</p>
              </Card>
            </div>
          )}
          {tab === 'http' && (
            <div className="grid grid-cols-3 gap-4">
              <Card title="HTTP zdroj" className="col-span-2" padded>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">URL</div>
                    <Input className="w-full font-mono text-[12px]" defaultValue="https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"/>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Method</div>
                      <Select value="GET" onChange={()=>{}} options={[{value:'GET',label:'GET'},{value:'POST',label:'POST'}]}/>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Auth</div>
                      <Select value="none" onChange={()=>{}} options={[{value:'none',label:'None'},{value:'basic',label:'Basic'},{value:'bearer',label:'Bearer'}]}/>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Format</div>
                      <Select value="xml" onChange={()=>{}} options={[{value:'xml',label:'XML'},{value:'json',label:'JSON'},{value:'csv',label:'CSV'}]}/>
                    </div>
                  </div>
                </div>
              </Card>
              <Card title="Schedule" padded>
                <Select value="daily" onChange={()=>{}} options={[{value:'manual',label:'Manuálne'},{value:'daily',label:'Denne'},{value:'hourly',label:'Hodinovo'}]}/>
                <div className="mt-3 text-xs text-slate-500 mb-1">Čas (HH:MM)</div>
                <Input defaultValue="06:00" className="w-full font-mono"/>
                <div className="mt-3 text-xs text-slate-500">Cron: <span className="font-mono">0 6 * * *</span></div>
              </Card>
            </div>
          )}
          {tab === 'db' && (
            <div className="grid grid-cols-3 gap-4">
              <Card title="Connection profile" className="col-span-2" padded>
                <div className="space-y-2">
                  {CONNECTION_PROFILES.map((c, i) => (
                    <label key={i} className={cls('flex items-center gap-3 px-3 py-2.5 rounded-md ring-1 cursor-pointer transition-colors', i === 0 ? 'ring-[#1E3A5F] bg-[#1E3A5F]/5' : 'ring-slate-200 hover:bg-slate-50')}>
                      <input type="radio" name="conn" defaultChecked={i === 0}/>
                      <IcoServer className="w-4 h-4 text-slate-500"/>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.driver} · {c.host}:{c.port} · {c.db}</div>
                      </div>
                      <Badge tone="success" dot>{c.status}</Badge>
                    </label>
                  ))}
                </div>
              </Card>
              <Card title="Query / table" padded>
                <div className="text-xs text-slate-500 mb-1">Schema · Tabuľka</div>
                <Input className="w-full font-mono text-[12px]" defaultValue="GLPROD.GL_TRANS"/>
                <div className="text-xs text-slate-500 mt-3 mb-1">WHERE clause</div>
                <textarea className="w-full text-[12px] font-mono rounded-md ring-1 ring-slate-300 px-3 py-2 h-20 focus:ring-2 focus:ring-[#1E3A5F]" defaultValue="POSTING_DATE >= CURRENT_DATE - 1"/>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Preview of uploaded file */}
      {loadedFile && (
        <Card
          title={`Náhľad: ${loadedFile.name}`}
          subtitle={`${loadedFile.rows.length.toLocaleString('sk-SK')} riadkov · ${loadedFile.columns.length} stĺpcov`}
          className="mb-6 fade-in"
          padded={false}
          right={
            isSupplierFile
              ? <Button variant="secondary" size="sm" icon={<IcoSearch className="w-3.5 h-3.5"/>} onClick={handleDedup}>Analyzovať duplikáty</Button>
              : null
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  {previewCols.map(c => (
                    <th key={c} className="px-3 py-2.5 text-left font-semibold font-mono whitespace-nowrap">{c}</th>
                  ))}
                  {loadedFile.columns.length > 8 && <th className="px-3 py-2.5 text-slate-400">+{loadedFile.columns.length - 8} ďalšie…</th>}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                    {previewCols.map(c => (
                      <td key={c} className="px-3 py-2 font-mono text-[12px] text-slate-700 whitespace-nowrap max-w-[160px] truncate">
                        {String(row[c] ?? '')}
                      </td>
                    ))}
                    {loadedFile.columns.length > 8 && <td/>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2">
            <Badge tone="success" dot>
              Súbor úspešne načítaný · {loadedFile.rows.length.toLocaleString('sk-SK')} riadkov · {loadedFile.columns.length} stĺpcov · pripravený na mapping
            </Badge>
          </div>
        </Card>
      )}

      {/* Supplier dedup results */}
      {dedupResult && (
        <Card title="Analýza duplikátov dodávateľov" className="mb-6 fade-in" padded={false}>
          <div className="p-5 grid grid-cols-3 gap-4 border-b border-slate-100">
            <div className="bg-slate-50 rounded-md p-4 text-center">
              <div className="text-2xl font-semibold text-slate-900">{loadedFile.rows.length.toLocaleString('sk-SK')}</div>
              <div className="text-xs text-slate-500 mt-1">Celkový počet záznamov</div>
            </div>
            <div className="bg-slate-50 rounded-md p-4 text-center">
              <div className="text-2xl font-semibold text-[#1E3A5F]">{Object.keys(dedupResult.groups).length.toLocaleString('sk-SK')}</div>
              <div className="text-xs text-slate-500 mt-1">Unikátnych dodávateľov</div>
            </div>
            <div className="bg-amber-50 rounded-md p-4 text-center">
              <div className="text-2xl font-semibold text-amber-700">{dedupResult.totalDuplicates.toLocaleString('sk-SK')}</div>
              <div className="text-xs text-slate-500 mt-1">Možných duplikátov</div>
            </div>
          </div>
          {dedupResult.duplicates.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 text-left font-semibold">Kanonický názov</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Varianty</th>
                  <th className="px-4 py-2.5 text-right font-semibold w-20">Počet</th>
                </tr>
              </thead>
              <tbody>
                {dedupResult.duplicates.slice(0, 10).map(([canon, variants], i) => (
                  <tr key={i} className={cls('border-b border-slate-100 last:border-0', i % 2 ? 'bg-slate-50/30' : '')}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{canon}</td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-500">{variants.filter(v => v !== canon).join(' · ')}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-700">{variants.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {dedupResult.duplicates.length === 0 && (
            <EmptyHint>Žiadne duplikáty neboli nájdené — dáta sú čisté.</EmptyHint>
          )}
        </Card>
      )}

      <Card title="Definované importy" subtitle={`${IMPORTS.length} aktívnych zdrojov`} padded={false}>
        <Table>
          <THead cols={[
            { label: 'Názov' },
            { label: 'Zdroj', className: 'w-32' },
            { label: 'Detail / URL' },
            { label: 'Frekvencia', className: 'w-36' },
            { label: 'Posledný import', className: 'w-44' },
            { label: 'Status', className: 'w-24' },
          ]}/>
          <tbody>
            {IMPORTS.map((it, i) => (
              <tr key={i} className={cls('border-b border-slate-100 last:border-0 hover:bg-slate-50/60', i % 2 ? 'bg-slate-50/30' : '')}>
                <td className="px-4 py-3 font-medium text-slate-800">{it.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-700"><span className="text-slate-400">{sourceIcon(it.source)}</span>{it.source}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[11.5px] text-slate-500 truncate max-w-[280px]">{it.detail}</td>
                <td className="px-4 py-3 text-[12.5px] text-slate-600">{it.freq}</td>
                <td className="px-4 py-3 text-[12.5px] text-slate-600">
                  <div>{it.last}</div>
                  <div className="text-[11px] text-slate-400">{it.count}</div>
                </td>
                <td className="px-4 py-3">
                  {it.status === 'success' ? <Badge tone="success" dot>OK</Badge> : <Badge tone="warning" dot>slow</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
window.SectionImporter = SectionImporter;
