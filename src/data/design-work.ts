import data from './design-work.json';
import phoneTints from './design-work-phone.json';

export type DesignGroup = { id: string; label: string; blurb: string };
export type DesignSite = {
  id: string;
  group: string;
  title: string;
  url: string;
  /** Unsolicited or exploratory direction rather than a shipped client site. */
  concept: boolean;
};

export const designGroups: DesignGroup[] = data.groups;
export const designSites: DesignSite[] = data.sites;

/** 1440×900 frame from scripts/capture-design-work.py. */
export const posterFor = (site: DesignSite) => `/design-work/${site.id}.jpg`;
/** The site's own favicon, saved by the same script. */
export const iconFor = (site: DesignSite) => `/design-work/${site.id}-icon.png`;
export const hostOf = (site: DesignSite) => new URL(site.url).host;
export const groupOf = (site: DesignSite) => designGroups.find(group => group.id === site.group)!;

/** 430-point-wide mobile frame from `capture-design-work.py --phone`. */
export const phonePosterFor = (site: DesignSite) => `/design-work/${site.id}-phone.jpg`;
/** The page's top and bottom edge colours, which iOS Safari bleeds into its chrome. */
export const phoneTintOf = (site: DesignSite): { top: string; bottom: string } =>
  (phoneTints as Record<string, { top: string; bottom: string }>)[site.id] ?? { top: '#ffffff', bottom: '#ffffff' };
