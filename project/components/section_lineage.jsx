// Section 7 — Object Graph (Lineage)
function SectionLineage() {
  const [filter, setFilter] = React.useState('all');
  const [selectedId, setSelectedId] = React.useState('an_gl');

  // Layout
  const COL_W = 200, ROW_H = 70, X0 = 30, Y0 = 30;
  const nodeX = (n) => X0 + n.col * COL_W;
  const nodeY = (n) => Y0 + n.row * ROW_H;
  const NODE_W = 160, NODE_H = 44;

  const nodes = LINEAGE_NODES.filter(n => filter === 'all' || n.status === 'production');
  const visibleIds = new Set(nodes.map(n => n.id));
  const links = LINEAGE_LINKS.filter(([a,b]) => visibleIds.has(a) && visibleIds.has(b));

  const upstream = (id) => links.filter(([,b]) => b === id).map(([a]) => a);
  const downstream = (id) => links.filter(([a]) => a === id).map(([,b]) => b);

  const selected = LINEAGE_NODES.find(n => n.id === selectedId);
  const selectedUp = upstream(selectedId);
  const selectedDown = downstream(selectedId);

  // Find max col/row for SVG size
  const maxCol = Math.max(...nodes.map(n => n.col));
  const maxRow = Math.max(...nodes.map(n => n.row));
  const W = X0 + (maxCol + 1) * COL_W;
  const H = Y0 + (maxRow + 1) * ROW_H + 20;

  // Connected to selection
  const isLinkActive = (a,b) => a === selectedId || b === selectedId;
  const isNodeActive = (id) => id === selectedId || selectedUp.includes(id) || selectedDown.includes(id);

  const typeBg = {
    'SOURCE':  'bg-slate-700 text-white',
    'TABLE':   'bg-white text-slate-800 ring-slate-300',
    'VIEW':    'bg-sky-50 text-sky-800 ring-sky-200',
    'MAT_VIEW':'bg-[#1E3A5F] text-white',
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Object Graph"
        subtitle="Lineage zdrojov, tabuliek, views a reportov"
        actions={
          <>
            <Segmented
              options={[{value:'all',label:'Vrátane draft'},{value:'prod',label:'Len production'}]}
              value={filter} onChange={setFilter}
            />
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9">
          <Card padded={false}>
            <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">Legenda:</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-700"></span>Source</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white ring-1 ring-slate-300"></span>Table</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-100 ring-1 ring-sky-200"></span>View</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#1E3A5F]"></span>Mat. View</span>
              <span className="ml-auto text-slate-400 font-mono">{nodes.length} nodes · {links.length} edges</span>
            </div>
            <div className="overflow-auto bg-slate-50/40" style={{ maxHeight: 560 }}>
              <svg width={W} height={H} className="block">
                {/* Column headers */}
                {['Sources','Raw layer','Analytics','Marts','Reporting'].map((h, i) => (
                  <text key={i} x={X0 + i * COL_W + NODE_W/2} y={18}
                        textAnchor="middle"
                        className="fill-slate-400 text-[10px] font-mono uppercase tracking-wider">{h}</text>
                ))}
                {/* Links */}
                {links.map(([a,b], i) => {
                  const A = LINEAGE_NODES.find(n => n.id === a);
                  const B = LINEAGE_NODES.find(n => n.id === b);
                  const x1 = nodeX(A) + NODE_W;
                  const y1 = nodeY(A) + NODE_H/2;
                  const x2 = nodeX(B);
                  const y2 = nodeY(B) + NODE_H/2;
                  const mx = (x1 + x2) / 2;
                  const path = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                  const active = isLinkActive(a, b);
                  return (
                    <path key={i} d={path}
                          className={cls('lineage-link', active && 'active')}
                          opacity={active ? 1 : 0.5}/>
                  );
                })}
                {/* Nodes */}
                {nodes.map(n => {
                  const active = isNodeActive(n.id);
                  return (
                    <g key={n.id}
                       transform={`translate(${nodeX(n)},${nodeY(n)})`}
                       onClick={() => setSelectedId(n.id)}
                       style={{ cursor: 'pointer' }}>
                      <rect width={NODE_W} height={NODE_H} rx={6}
                        className={cls(
                          n.type === 'SOURCE' && 'fill-slate-700',
                          n.type === 'TABLE'  && 'fill-white',
                          n.type === 'VIEW'   && 'fill-sky-50',
                          n.type === 'MAT_VIEW' && 'fill-[#1E3A5F]',
                        )}
                        stroke={selectedId === n.id ? '#1E3A5F' : (n.type === 'TABLE' ? '#cbd5e1' : (n.type === 'VIEW' ? '#bae6fd' : 'transparent'))}
                        strokeWidth={selectedId === n.id ? 2.5 : 1}
                        opacity={active ? 1 : 0.55}
                      />
                      <text x={10} y={18}
                            className={cls('text-[10px] font-mono uppercase tracking-wider',
                              (n.type === 'SOURCE' || n.type === 'MAT_VIEW') ? 'fill-white/60' : 'fill-slate-400')}>
                        {n.type.replace('_',' ')}
                      </text>
                      <text x={10} y={34}
                            className={cls('text-[12px] font-medium',
                              (n.type === 'SOURCE' || n.type === 'MAT_VIEW') ? 'fill-white' : 'fill-slate-800')}>
                        {n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label}
                      </text>
                      {n.status === 'draft' && (
                        <circle cx={NODE_W - 8} cy={8} r={4} className="fill-amber-400"/>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </div>

        <div className="col-span-3 space-y-4">
          <Card title="Detail nodu">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{selected.type.replace('_',' ')}</div>
            <div className="text-base font-semibold text-slate-900 mt-0.5 break-words">{selected.label}</div>
            <div className="mt-2"><Badge tone={selected.status === 'production' ? 'success' : 'draft'} dot>{selected.status}</Badge></div>

            <dl className="mt-4 space-y-2 text-sm border-t border-slate-100 pt-4">
              <div className="flex justify-between"><dt className="text-slate-500">Upstream</dt><dd className="font-mono text-slate-800">{selectedUp.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Downstream</dt><dd className="font-mono text-slate-800">{selectedDown.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Posledná modifikácia</dt><dd className="text-slate-700">12.3.2026</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Owner</dt><dd className="text-slate-700">Peter Novák</dd></div>
            </dl>
          </Card>

          <Card title="Critical paths">
            <div className="rounded-md bg-red-50 ring-1 ring-red-200 p-3">
              <div className="flex gap-2">
                <IcoWarn className="w-4 h-4 text-red-600 mt-0.5 shrink-0"/>
                <div>
                  <div className="text-[12.5px] font-semibold text-red-900">analytics.gl_clean</div>
                  <div className="text-[11px] text-red-800 mt-0.5">je závislá od 23 objektov a živí 8 reportov.</div>
                </div>
              </div>
            </div>
            <ul className="mt-3 text-[12.5px] text-slate-700 space-y-1.5">
              <li>• <span className="font-mono">mv_pl_monthly</span> · 12 ↓</li>
              <li>• <span className="font-mono">mv_balance_sheet</span> · 8 ↓</li>
              <li>• <span className="font-mono">reporting.pl_report</span> · 5 ↓</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
window.SectionLineage = SectionLineage;
