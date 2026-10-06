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
