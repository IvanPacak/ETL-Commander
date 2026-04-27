// Minimal lucide-style icons as React components.
// All use stroke="currentColor", strokeWidth="1.75", size via className.
const _ico = (paths) => (props) => {
  const { className = 'w-4 h-4', strokeWidth = 1.75, ...rest } = props || {};
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >{paths}</svg>
  );
};

const IcoHome     = _ico(<><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></>);
const IcoPipeline = _ico(<><circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 6h6a4 4 0 0 1 4 4v.5"/><path d="M7 18h6a4 4 0 0 0 4-4V13.5"/></>);
const IcoImport   = _ico(<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>);
const IcoMap      = _ico(<><path d="M4 6h7"/><path d="M13 6h7"/><path d="M4 12h7"/><path d="M13 12h7"/><path d="M4 18h7"/><path d="M13 18h7"/><circle cx="11.5" cy="6" r="1.2"/><circle cx="11.5" cy="12" r="1.2"/><circle cx="11.5" cy="18" r="1.2"/></>);
const IcoHash     = _ico(<><path d="M5 9h14"/><path d="M5 15h14"/><path d="M10 4 8 20"/><path d="m16 4-2 16"/></>);
const IcoSave     = _ico(<><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h8V4"/><path d="M8 14h8v6H8z"/></>);
const IcoGraph    = _ico(<><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.5 7.5 11 16"/><path d="M16.5 7.5 13 16"/></>);
const IcoShield   = _ico(<><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></>);
const IcoPivot    = _ico(<><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16"/><path d="M10 4v16"/></>);
const IcoClock    = _ico(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>);
const IcoCog      = _ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>);
const IcoCheck    = _ico(<><path d="m4 12 5 5L20 6"/></>);
const IcoX        = _ico(<><path d="M6 6 18 18"/><path d="M18 6 6 18"/></>);
const IcoWarn     = _ico(<><path d="M12 3 2 21h20z"/><path d="M12 10v5"/><path d="M12 18h.01"/></>);
const IcoChevR    = _ico(<><path d="m9 6 6 6-6 6"/></>);
const IcoChevD    = _ico(<><path d="m6 9 6 6 6-6"/></>);
const IcoSearch   = _ico(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>);
const IcoPlay     = _ico(<><path d="M7 5v14l12-7z"/></>);
const IcoPlus     = _ico(<><path d="M12 5v14"/><path d="M5 12h14"/></>);
const IcoLock     = _ico(<><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>);
const IcoDots     = _ico(<><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>);
const IcoUpload   = _ico(<><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></>);
const IcoDb       = _ico(<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>);
const IcoFile     = _ico(<><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></>);
const IcoGlobe    = _ico(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></>);
const IcoDownload = _ico(<><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></>);
const IcoRefresh  = _ico(<><path d="M21 8a9 9 0 0 0-15-3.5L3 8"/><path d="M3 4v4h4"/><path d="M3 16a9 9 0 0 0 15 3.5L21 16"/><path d="M21 20v-4h-4"/></>);
const IcoFilter   = _ico(<><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>);
const IcoBell     = _ico(<><path d="M6 8a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 19a2 2 0 0 0 4 0"/></>);
const IcoUser     = _ico(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>);
const IcoActivity = _ico(<><path d="M3 12h4l3-8 4 16 3-8h4"/></>);
const IcoLayers   = _ico(<><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/></>);
const IcoBranch   = _ico(<><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10"/><path d="M18 11c0 4-6 4-6 8"/></>);
const IcoEye      = _ico(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>);
const IcoCalendar = _ico(<><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/></>);
const IcoArrowR   = _ico(<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>);
const IcoCode     = _ico(<><path d="m8 8-5 4 5 4"/><path d="m16 8 5 4-5 4"/><path d="m14 4-4 16"/></>);
const IcoUsers    = _ico(<><circle cx="9" cy="8" r="3.5"/><path d="M3 21a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="3"/><path d="M15 21a6 6 0 0 1 6-6"/></>);
const IcoServer   = _ico(<><rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><circle cx="7" cy="7.5" r=".7"/><circle cx="7" cy="16.5" r=".7"/></>);
const IcoEdit     = _ico(<><path d="M4 20h4l10-10-4-4L4 16z"/><path d="m13 6 4 4"/></>);

Object.assign(window, {
  IcoHome, IcoPipeline, IcoImport, IcoMap, IcoHash, IcoSave, IcoGraph,
  IcoShield, IcoPivot, IcoClock, IcoCog, IcoCheck, IcoX, IcoWarn,
  IcoChevR, IcoChevD, IcoSearch, IcoPlay, IcoPlus, IcoLock, IcoDots,
  IcoUpload, IcoDb, IcoFile, IcoGlobe, IcoDownload, IcoRefresh, IcoFilter,
  IcoBell, IcoUser, IcoActivity, IcoLayers, IcoBranch, IcoEye, IcoCalendar,
  IcoArrowR, IcoCode, IcoUsers, IcoServer, IcoEdit
});
