// Root app
function App() {
  const [active, setActive] = React.useState('home');

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

  // Smooth scroll to top on section change
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [active]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900" data-screen-label="ETL Commander">
      <Sidebar active={active} onChange={setActive}/>
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar active={active} onChange={setActive}/>
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
