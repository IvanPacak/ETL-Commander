// Sidebar nav + top header.

const NAV_ITEMS = [
  { id: 'home',       label: 'Domov',                icon: () => <IcoHome className="w-[18px] h-[18px]"/> },
  { id: 'pipeline',   label: 'Pipeline Orchestrátor', icon: () => <IcoPipeline className="w-[18px] h-[18px]"/> },
  { id: 'importer',   label: 'Importer',             icon: () => <IcoImport className="w-[18px] h-[18px]"/> },
  { id: 'mapping',    label: 'Mapping Editor',       icon: () => <IcoMap className="w-[18px] h-[18px]"/> },
  { id: 'numerator',  label: 'Numerátor Engine',     icon: () => <IcoHash className="w-[18px] h-[18px]"/> },
  { id: 'save',       label: 'Save-to-Schema',       icon: () => <IcoSave className="w-[18px] h-[18px]"/> },
  { id: 'lineage',    label: 'Object Graph',         icon: () => <IcoGraph className="w-[18px] h-[18px]"/> },
  { id: 'governance', label: 'Data Governance',      icon: () => <IcoShield className="w-[18px] h-[18px]"/> },
  { id: 'pivot',      label: 'Pivot Reports',        icon: () => <IcoPivot className="w-[18px] h-[18px]"/> },
  { id: 'scheduler',  label: 'Scheduler',            icon: () => <IcoClock className="w-[18px] h-[18px]"/> },
  { id: 'admin',      label: 'Admin',                icon: () => <IcoCog className="w-[18px] h-[18px]"/> },
];

function Sidebar({ active, onChange }) {
  return (
    <aside className="w-[248px] shrink-0 bg-[#1E3A5F] text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h6v6H4z"/>
              <path d="M14 12h6v6h-6z"/>
              <path d="M10 9h4"/>
              <path d="M10 9v6"/>
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight">ETL Commander</div>
            <div className="text-[10.5px] text-white/55 font-mono">v4.2.1 · build 2026.04</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-2.5 py-3">
        <div className="px-2.5 pb-1.5 text-[10px] uppercase tracking-wider text-white/40 font-semibold">Moduly</div>
        {NAV_ITEMS.map((it, i) => {
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={cls(
                'w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors',
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              )}
            >
              <span className={cls('shrink-0', isActive ? 'text-white' : 'text-white/55')}>{it.icon()}</span>
              <span className="flex-1">{it.label}</span>
              {isActive && <span className="w-1 h-1 rounded-full bg-emerald-400"></span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-white/5 ring-1 ring-white/10">
          <IcoLock className="w-4 h-4 text-emerald-300"/>
          <div className="leading-tight">
            <div className="text-[12px] font-medium">On-premise verzia</div>
            <div className="text-[10.5px] text-white/55 font-mono">prod-pg.lan · PG 16</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-2">
          <span className="text-[10.5px] text-white/40 font-mono">© 2026 Peter Novák</span>
          <span className="text-[10.5px] text-white/40 font-mono">SK</span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ active, onChange, breadcrumb }) {
  const item = NAV_ITEMS.find(n => n.id === active) || NAV_ITEMS[0];
  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-7">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-medium">ETL Commander</span>
        <IcoChevR className="w-3.5 h-3.5 text-slate-300"/>
        <span className="text-slate-700 font-medium">{item.label}</span>
        {breadcrumb && (
          <>
            <IcoChevR className="w-3.5 h-3.5 text-slate-300"/>
            <span className="text-slate-900 font-semibold">{breadcrumb}</span>
          </>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5">
        <div className="relative mr-2">
          <IcoSearch className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
          <input
            type="text" placeholder="Hľadať objekty, mappingy, joby…"
            className="h-9 pl-9 pr-3 w-72 text-[13px] rounded-md ring-1 ring-inset ring-slate-200 bg-slate-50 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1E3A5F] focus:bg-white"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white ring-1 ring-slate-200 rounded px-1 py-0.5">⌘K</kbd>
        </div>
        <button className="w-9 h-9 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center relative">
          <IcoBell className="w-[18px] h-[18px]"/>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white"></span>
        </button>
        <button className="w-9 h-9 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center">
          <IcoRefresh className="w-[18px] h-[18px]"/>
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1.5"></div>
        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-slate-100">
          <span className="w-7 h-7 rounded-full bg-[#1E3A5F] text-white text-xs font-semibold flex items-center justify-center">PN</span>
          <span className="text-sm font-medium text-slate-800">Peter</span>
          <IcoChevD className="w-4 h-4 text-slate-400"/>
        </button>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, TopBar, NAV_ITEMS });
