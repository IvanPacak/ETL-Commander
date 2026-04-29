// Login obrazovka — zobrazí sa namiesto appky ak používateľ nie je prihlásený.
function SectionLogin({ onLogin }) {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const data = await window.etlAuth.signIn(email.trim(), password);
      const userEmail = (data.user && data.user.email) ? data.user.email : email.trim();
      if (window.__ETL_AFTER_LOGIN__) window.__ETL_AFTER_LOGIN__(userEmail);
      if (onLogin) onLogin(userEmail);
    } catch (e) {
      setError(e.message || 'Prihlásenie zlyhalo. Skontrolujte email a heslo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f2540] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h6v6H4z"/>
                <path d="M14 12h6v6h-6z"/>
                <path d="M10 9h4"/>
                <path d="M10 9v6"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="text-white text-[18px] font-semibold tracking-tight leading-tight">ETL Commander</div>
              <div className="text-white/50 text-[11px] font-mono">On-premise · eu-central-1</div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-white/10 p-8">
          <h2 className="text-[17px] font-semibold text-slate-900 mb-1">Prihlásiť sa</h2>
          <p className="text-sm text-slate-500 mb-6">Zadajte firemné prihlasovacie údaje.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="peter.novak@firma.sk"
                className="w-full h-10 px-3.5 text-sm rounded-lg ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F] outline-none transition-colors"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 block">Heslo</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3.5 text-sm rounded-lg ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F] outline-none transition-colors"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 ring-1 ring-red-200 px-3.5 py-2.5 flex items-center gap-2.5">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full h-10 rounded-lg bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#172d4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Prihlasujem…
                </>
              ) : 'Prihlásiť sa'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-[12px] text-slate-400">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="1.5"/>
              <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
            </svg>
            On-premise · Dáta zostávajú na vašom serveri
          </div>
        </div>

        <div className="text-center mt-6 text-[11px] text-white/30 font-mono">
          v4.2.1 · Prístup len pre oprávnených používateľov
        </div>
      </div>
    </div>
  );
}
window.SectionLogin = SectionLogin;
