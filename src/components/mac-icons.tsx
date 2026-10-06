// Stroke icons drawn after SF Symbols, sized by font-size like react-icons.
type Props = { className?: string };
const icon = (paths: React.ReactNode, viewBox = '0 0 24 24') => function Icon({ className }: Props) {
  return (
    <svg className={className} viewBox={viewBox} width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths}
    </svg>
  );
};

export const ChevronLeft = icon(<path d="M15 5l-7 7 7 7" />);
export const ChevronRight = icon(<path d="M9 5l7 7-7 7" />);
export const Sidebar = icon(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M9.5 5v14M5.5 8.5h1.5M5.5 11h1.5" /></>);
export const Share = icon(<><path d="M12 3v11M8 7l4-4 4 4" /><path d="M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" /></>);
export const Plus = icon(<path d="M12 5v14M5 12h14" />);
export const Tabs = icon(<><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>);
export const Battery = icon(<><rect x="2" y="7" width="18" height="10" rx="3" /><rect x="4" y="9" width="12" height="6" rx="1.5" fill="currentColor" stroke="none" /><path d="M22 10.5v3" /></>);

// iOS status bar glyphs are solid, not stroked.
const solid = (paths: React.ReactNode, viewBox: string) => function Icon({ className }: Props) {
  return <svg className={className} viewBox={viewBox} height="1em" fill="currentColor" aria-hidden="true">{paths}</svg>;
};
export const Signal = solid(<><rect x="0" y="7.5" width="3.2" height="4.5" rx="1" /><rect x="4.6" y="5" width="3.2" height="7" rx="1" /><rect x="9.2" y="2.5" width="3.2" height="9.5" rx="1" /><rect x="13.8" y="0" width="3.2" height="12" rx="1" /></>, '0 0 17 12');
export const WifiSolid = solid(<path d="M8 2.6c2.3 0 4.4.9 6 2.4l1.1-1.2A10.1 10.1 0 0 0 8 1C5.3 1 2.8 2 .9 3.8L2 5c1.6-1.5 3.7-2.4 6-2.4Zm0 3.3c1.4 0 2.6.5 3.6 1.4l1.1-1.2A6.8 6.8 0 0 0 8 4.3c-1.8 0-3.4.7-4.7 1.8l1.1 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.3c-.6 0-1.1.2-1.5.6L8 11.5l1.5-1.7c-.4-.4-.9-.6-1.5-.6Z" />, '0 0 16 12');
export const BatterySolid = solid(<><rect x="0.5" y="0.5" width="22" height="11" rx="3.4" fill="none" stroke="currentColor" strokeOpacity="0.4" /><rect x="2" y="2" width="19" height="8" rx="2" /><path d="M24 4v4c.8-.3 1.3-1.1 1.3-2S24.8 4.3 24 4Z" fillOpacity="0.4" /></>, '0 0 26 12');
export const Ellipsis = icon(<><circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" /></>);
