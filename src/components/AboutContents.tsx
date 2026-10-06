'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'work', label: 'What I work on' },
  { id: 'projects', label: 'Projects' },
  { id: 'audience', label: 'Writing & audience' },
  { id: 'background', label: 'Where I started' },
  { id: 'outside', label: 'Outside work' },
  { id: 'further-reading', label: 'Further reading' },
];

/** Table of contents that marks the section currently being read. */
export function AboutContents({ className }: { className?: string }) {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    const nodes = SECTIONS.map(s => document.getElementById(s.id)).filter((n): n is HTMLElement => !!n);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setCurrent(visible[0].target.id);
    }, { rootMargin: '-20% 0px -60% 0px' });
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);
  return (
    <nav className={className} aria-label="About sections">
      {SECTIONS.map(s => (
        <a key={s.id} href={`#${s.id}`} aria-current={current === s.id ? 'location' : undefined}>{s.label}</a>
      ))}
    </nav>
  );
}
