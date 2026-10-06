import { pageMetadata } from '@/lib/seo';
import { WorkShowcase } from '@/components/WorkShowcase';
import { designGroups, designSites } from '@/data/design-work';
import styles from './page.module.css';

export const metadata = pageMetadata({
  title: 'Design work',
  description: `Websites I have designed and built: ${designSites.length} live sites, shown in a working browser.`,
  path: '/work',
});

export default function WorkPage() {
  return (
    <main className={styles.page} id="main-content">
      <div className={styles.intro}>
        <div className={styles.bar}>
          <span className="label">Work</span>
          <span className="label muted">Websites, designed &amp; built</span>
          <span className="label muted">{designGroups.length} projects · {designSites.length} sites</span>
        </div>
        <h1>Design work</h1>
        <p>{designSites.length} sites I have designed and built. Every one is live: click around inside the laptop or phone, or open it in its own tab.</p>
      </div>
      <WorkShowcase />
      <p className={styles.credit}>
        Laptop: <a href="https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4" target="_blank" rel="noreferrer">MacBook Pro M3 16-inch 2024</a> by jackbaeten,{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, rigged by William Laverty. Phone:{' '}
        <a href="https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7" target="_blank" rel="noreferrer">Apple iPhone 15 Pro Max Black</a> by polyman,{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Not affiliated with Apple.
      </p>
    </main>
  );
}
