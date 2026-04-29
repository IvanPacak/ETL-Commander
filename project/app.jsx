// Root app
function App() {
  const [active, setActive]     = React.useState('home');
  const [authState, setAuthState] = React.useState({ checking: true, loggedIn: false, email: null });
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  // ── Auth init ────────────────────────────────────────────────
  React.useEffect(() => {
    const session = window.etlAuth ? window.etlAuth.getSession() : null;
    if (session) {
      window.__ETL_USER__ = session.email;
    }
    setAuthState({ checking: false, loggedIn: !!session, email: session ? session.email : null });
  }, []);

  // ── Callback invoked by SectionLogin after successful sign-in ─
  window.__ETL_AFTER_LOGIN__ = (email) => {
    window.__ETL_USER__ = email;
    setAuthState({ checking: false, loggedIn: true, email });
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    if (window.etlAuth) await window.etlAuth.signOut().catch(() => {});
    window.__ETL_USER__ = null;
    setAuthState({ checking: false, loggedIn: false, email: null });
  };

  const sections = {
    home:       <SectionDashboard/>,
    pipeline:   <SectionPipeline/>,
    importer:   <SectionImporter/>,
    mapping:    <SectionMapping/>,
    numerator:  <SectionNumerator/>,
    save:       <SectionSave/>,
    lineage:    <SectionLineage/>,
    governance: <SectionGovernance/>,
    pivot:      <SectionPivot/>,
    scheduler:  <SectionScheduler/>,
    admin:      <SectionAdmin/>,
  };

  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [active]);

  // ── Loading screen ───────────────────────────────────────────
  if (authState.checking) {
    return (
      <div className="min-h-screen bg-[#0f2540] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
          <div className="text-white/60 text-sm font-mono">Načítavam…</div>
        </div>
      </div>
    );
  }

  // ── Login screen ─────────────────────────────────────────────
  if (!authState.loggedIn) {
    return <SectionLogin onLogin={(email) => setAuthState({ checking: false, loggedIn: true, email })}/>;
  }

  // ── Main app ─────────────────────────────────────────────────
  // User display: show first part of email or full email
  const displayName = authState.email
    ? authState.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()).split(' ')[0]
    : 'User';
  const initials = authState.email
    ? authState.email.split('@')[0].split('.').map(s => s[0] ? s[0].toUpperCase() : '').slice(0, 2).join('')
    : 'U';

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900" data-screen-label="ETL Commander">
      <Sidebar active={active} onChange={setActive}/>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Custom TopBar wrapper to inject auth */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-7">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">ETL Commander</span>
            <IcoChevR className="w-3.5 h-3.5 text-slate-300"/>
            <span className="text-slate-700 font-medium">
              {(NAV_ITEMS.find(n => n.id === active) || NAV_ITEMS[0]).label}
            </span>
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

            {/* User menu */}
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-slate-100"
                onClick={() => setUserMenuOpen(o => !o)}
              >
                <span className="w-7 h-7 rounded-full bg-[#1E3A5F] text-white text-xs font-semibold flex items-center justify-center">{initials}</span>
                <span className="text-sm font-medium text-slate-800">{displayName}</span>
                <IcoChevD className="w-4 h-4 text-slate-400"/>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}/>
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg ring-1 ring-slate-200 z-50 py-1">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <div className="text-[12.5px] font-semibold text-slate-800 truncate">{authState.email}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">ETL Commander</div>
                    </div>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      onClick={handleLogout}
                    >
                      <IcoLock className="w-4 h-4"/>
                      Odhlásiť sa
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto px-7 py-6" data-screen-label={active}>
          {sections[active] || <SectionDashboard/>}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppStateProvider>
    <App/>
  </AppStateProvider>
);
