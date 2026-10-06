import type { ReactNode } from 'react';
import { experienceDetails } from '@/data/experience-details';
import styles from './ExperienceDetail.module.css';

export function ExperienceDetail({ id, children }: { id: string; children?: ReactNode }) {
  const detail = experienceDetails[id];
  if (!detail) throw new Error(`Missing experience detail: ${id}`);

  return (
    <div className={styles.detail} data-experience-detail={id}>
      <section className={styles.row} data-detail-section="did" aria-labelledby={`${id}-did`}>
        <h2 id={`${id}-did`} className={styles.label}><span>01</span>What I did</h2>
        <div className={styles.body}>
          <p className={styles.lead}>{detail.did}</p>
          {children}
          {detail.poster && (
            <figure className={styles.poster}>
              <a href={detail.poster.pdf} download>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.poster.src} alt={detail.poster.alt} loading="lazy" />
              </a>
              <figcaption>
                <span>{detail.poster.caption}</span>
                <a className={styles.download} href={detail.poster.pdf} download>Download research poster · PDF ↓</a>
              </figcaption>
            </figure>
          )}
        </div>
      </section>
      <section className={styles.row} data-detail-section="learned" aria-labelledby={`${id}-learned`}>
        <h2 id={`${id}-learned`} className={styles.label}><span>02</span>What I learned</h2>
        <div className={styles.body}><p className={styles.lead}>{detail.learned}</p></div>
      </section>
      <aside className={styles.row} aria-labelledby={`${id}-skills`}>
        <h2 id={`${id}-skills`} className={styles.label}><span>03</span>Skills</h2>
        <ul className={styles.skills}>{detail.skills.map((skill, i) => <li key={skill}><span>{String(i + 1).padStart(2, '0')}</span>{skill}</li>)}</ul>
      </aside>
    </div>
  );
}
