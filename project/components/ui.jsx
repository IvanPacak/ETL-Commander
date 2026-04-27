// Reusable UI primitives.

const cls = (...a) => a.filter(Boolean).join(' ');

// Color tokens (kept as JS for reuse)
const C = {
  navy:   '#1E3A5F',
  navy2:  '#16304E',
  navy3:  '#0f243d',
  ink:    '#111827',
  sub:    '#6B7280',
  line:   '#E5E7EB',
  bg:     '#F9FAFB',
  white:  '#FFFFFF',
  green:  '#10B981',
  amber:  '#F59E0B',
  red:    '#EF4444',
  blue:   '#3B82F6',
};

// Status badge — pill-style
function Badge({ tone = 'neutral', children, className = '', dot = false }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200',
    error:   'bg-red-50 text-red-700 ring-red-200',
    info:    'bg-sky-50 text-sky-700 ring-sky-200',
    navy:    'bg-[#1E3A5F]/10 text-[#1E3A5F] ring-[#1E3A5F]/20',
    draft:   'bg-slate-100 text-slate-600 ring-slate-300',
  };
  const dotColor = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error:   'bg-red-500',
    info:    'bg-sky-500',
    neutral: 'bg-slate-400',
    navy:    'bg-[#1E3A5F]',
    draft:   'bg-slate-400',
  };
  return (
    <span className={cls(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset',
      tones[tone], className
    )}>
      {dot && <span className={cls('w-1.5 h-1.5 rounded-full', dotColor[tone])}></span>}
      {children}
    </span>
  );
}

// Buttons
function Button({ children, variant = 'primary', size = 'md', className = '', icon, iconRight, onClick, type = 'button', disabled = false, title }) {
  const variants = {
    primary: 'bg-[#1E3A5F] hover:bg-[#16304E] text-white shadow-sm',
    secondary: 'bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-inset ring-slate-300',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  };
  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1',
    md: 'h-9 px-3.5 text-sm gap-1.5',
    lg: 'h-10 px-4 text-sm gap-2',
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} title={title}
      className={cls(
        'inline-flex items-center justify-center font-medium rounded-md transition-colors',
        variants[variant], sizes[size],
        disabled && 'opacity-50 cursor-not-allowed', className
      )}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

function Card({ title, subtitle, right, children, className = '', padded = true }) {
  return (
    <div className={cls('bg-white rounded-lg ring-1 ring-slate-200', className)}>
      {(title || right) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            {title && <h3 className="text-[13px] font-semibold text-slate-800 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

// Page header
function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// Tabs
function Tabs({ tabs, value, onChange }) {
  return (
    <div className="border-b border-slate-200 flex items-center gap-1">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cls(
            'px-3.5 py-2.5 text-sm font-medium relative -mb-px border-b-2 transition-colors',
            value === t.id
              ? 'text-[#1E3A5F] border-[#1E3A5F]'
              : 'text-slate-500 hover:text-slate-700 border-transparent'
          )}
        >
          {t.label}
          {t.count != null && (
            <span className={cls(
              'ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium',
              value === t.id ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' : 'bg-slate-100 text-slate-600'
            )}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// Table primitives
function Table({ children, className = '' }) {
  return (
    <div className={cls('overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
function THead({ cols }) {
  return (
    <thead>
      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/60">
        {cols.map((c, i) => (
          <th key={i} className={cls('px-4 py-2.5 font-semibold', c.className)}>{c.label}</th>
        ))}
      </tr>
    </thead>
  );
}

function StatTile({ label, value, sublabel, tone = 'navy', icon }) {
  const dotMap = {
    navy: 'bg-[#1E3A5F]',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div className="bg-white rounded-lg ring-1 ring-slate-200 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-3 text-[26px] font-semibold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {sublabel && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <span className={cls('w-1.5 h-1.5 rounded-full', dotMap[tone])}></span>
          {sublabel}
        </div>
      )}
    </div>
  );
}

// Simple toggle (segmented)
function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-md p-0.5">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cls(
            'px-3 py-1.5 text-xs font-medium rounded transition-colors',
            value === o.value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-800'
          )}
        >{o.label}</button>
      ))}
    </div>
  );
}

// Tiny inline input/select
function Input(props) {
  const { className = '', ...rest } = props;
  return (
    <input
      className={cls(
        'h-9 px-3 text-sm rounded-md ring-1 ring-inset ring-slate-300 bg-white',
        'placeholder:text-slate-400 focus:ring-2 focus:ring-[#1E3A5F]', className
      )} {...rest}
    />
  );
}
function Select({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cls(
        'h-9 pl-3 pr-8 text-sm rounded-md ring-1 ring-inset ring-slate-300 bg-white',
        'focus:ring-2 focus:ring-[#1E3A5F] appearance-none bg-no-repeat',
        className
      )}
      style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236B7280%27 stroke-width=%272%27><path d=%27m6 9 6 6 6-6%27/></svg>")', backgroundPosition: 'right 8px center' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function EmptyHint({ children }) {
  return (
    <div className="text-center py-12 text-sm text-slate-500">{children}</div>
  );
}

// Subtle striped placeholder for charts
function ChartPlaceholder({ height = 96, label }) {
  return (
    <div className="rounded-md stripe-bg ring-1 ring-slate-100 flex items-center justify-center"
         style={{ height }}>
      <span className="text-[11px] text-slate-400 font-mono">{label}</span>
    </div>
  );
}

Object.assign(window, {
  C, cls, Badge, Button, Card, PageHeader, Tabs, Table, THead,
  StatTile, Segmented, Input, Select, EmptyHint, ChartPlaceholder
});
