import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExperienceDetail } from '@/components/ExperienceDetail';
import { ProjectWriteup } from '@/components/ProjectWriteup';
import { experienceDetails } from '@/data/experience-details';
import { CATEGORIES, generatedDetailEntries, timeline } from '@/data/timeline';
import { projects } from '@/data/projects';
import { pageMetadata } from '@/lib/seo';
import { DetailStructuredData } from '@/components/StructuredData';
import styles from './page.module.css';

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return generatedDetailEntries.map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const entry = generatedDetailEntries.find((entry) => entry.id === id);
  if (!entry) return {};
  const project = projects.find((project) => project.slug === id);
  return pageMetadata({
    title: project?.title ?? entry.title,
    path: `/timeline/${id}`,
    description: experienceDetails[id].did,
  });
}

export default async function TimelineEntryPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const entry = generatedDetailEntries.find((entry) => entry.id === id);
  if (!entry) notFound();
  const project = projects.find((project) => project.slug === id);
  const category = CATEGORIES.find((category) => category.id === entry.category)?.label;
  const title = project?.title ?? entry.title;
  const images = [...(project?.hero ? [project.hero] : []), ...(project?.images ?? [])];
  const index = timeline.findIndex((row) => row.id === id);
  const previous = index > 0 ? timeline[index - 1] : null;
  const next = index >= 0 && index < timeline.length - 1 ? timeline[index + 1] : null;
  const meta = [
    { label: 'Date', value: entry.dateLabel },
    { label: 'Type', value: category },
    { label: 'Role', value: entry.subtitle ?? entry.bullets[0] },
    { label: 'Location', value: entry.location === 'Location not listed' ? '—' : entry.location },
  ];

  return (
    <main className={styles.page} id="main-content">
      <DetailStructuredData title={title} path={`/timeline/${id}`} description={experienceDetails[id].did} />
      <nav className={styles.crumbs} aria-label="Entry navigation">
        <Link href="/#experience" className="back">Index</Link>
        {index >= 0 && <span className="label muted">Entry {String(index + 1).padStart(2, '0')} / {timeline.length}</span>}
      </nav>
      <article>
        <header className={styles.head}>
          <h1 className={styles.title}>{title}</h1>
          {entry.logo && (
            <div className={styles.logo}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.logo} alt="" />
            </div>
          )}
          <dl className={styles.meta}>
            {meta.map((item) => (
              <div key={item.label}>
                <dt className="label">{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        {entry.video && (
          <figure className={styles.film}>
            <video className={styles.video} src={entry.video} poster={entry.videoPoster} controls preload="none" playsInline />
            <figcaption className="label">Fig. 1 — Project video</figcaption>
          </figure>
        )}

        <ExperienceDetail id={id}>
          {project?.external && project.external.length > 0 && (
            <div className={styles.links}>
              {project.external.map(link => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}
            </div>
          )}
        </ExperienceDetail>

        {images.length > 0 && (
          <section className={styles.gallerySection} aria-label="Project images">
            <h2 className={styles.sideLabel}><span>04</span>Images</h2>
            <div className={styles.gallery}>
              {images.map((src, i) => (
                <figure key={src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={src === project?.hero ? project.heroAlt ?? title : title} loading="lazy" />
                  <figcaption className="label">Fig. {i + 1}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <div className={styles.extra}><ProjectWriteup id={id} /></div>
      </article>

      {(previous || next) && (
        <nav className={styles.pager} aria-label="More entries">
          {previous ? (
            <Link href={previous.href ?? `/timeline/${previous.id}`} className={styles.prev}>
              <span className="label">← Newer</span>
              <span className={styles.pagerTitle}>{previous.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={next.href ?? `/timeline/${next.id}`} className={styles.next}>
              <span className="label">Older →</span>
              <span className={styles.pagerTitle}>{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
