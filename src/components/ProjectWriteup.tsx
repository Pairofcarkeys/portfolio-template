import { Fragment } from 'react';
import { projectWriteups, type WriteupBlock, type WriteupInline } from '@/data/project-writeups';
import styles from './ProjectWriteup.module.css';

function Inline({ content }: { content: WriteupInline[] }) {
  return content.map((part, index) => {
    const text = part.strong ? <strong>{part.text}</strong> : part.text;
    return part.href
      ? <a key={index} href={part.href} target="_blank" rel="noreferrer">{text}</a>
      : <Fragment key={index}>{text}</Fragment>;
  });
}

function Block({ block }: { block: WriteupBlock }) {
  switch (block.type) {
    case 'heading': return <h3><Inline content={block.content} /></h3>;
    case 'paragraph': return <p><Inline content={block.content} /></p>;
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return <List>{block.items.map((item, index) => <li key={index}><Inline content={item} /></li>)}</List>;
    }
    case 'image': return (
      <figure className={styles.figure}>
        <a href={block.src} target="_blank" rel="noreferrer" aria-label={`Open full-size image: ${block.alt}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} width={block.width} height={block.height} loading="lazy" decoding="async" />
        </a>
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
    case 'video': return (
      <figure className={styles.video}>
        {block.unavailable ? (
          <p className={styles.unavailable}>This video is no longer available.</p>
        ) : block.src ? (
          <video src={block.src} poster={block.poster} controls preload="none" playsInline aria-label={block.title} />
        ) : (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${block.youtubeId}`}
            title={block.title}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
        <figcaption>
          {block.caption && <span>{block.caption} · </span>}
          <a href={`https://www.youtube.com/watch?v=${block.youtubeId}`} target="_blank" rel="noreferrer">{block.unavailable ? 'Original video link' : 'Watch original video'} ↗</a>
        </figcaption>
      </figure>
    );
    case 'attachment': return <p><a href={block.href} download>{block.title} ↓</a></p>;
  }
}

/** The original notebook is deliberately separate from the two concise summary sections. */
export function ProjectWriteup({ id }: { id: string }) {
  const writeup = projectWriteups[id];
  if (!writeup) return null;
  const imageCount = writeup.blocks.filter(block => block.type === 'image').length;
  const videoCount = writeup.blocks.filter(block => block.type === 'video').length;
  return (
    <details className={styles.notebook} data-project-notebook={id}>
      <summary>
        <span className={styles.num}>05</span>
        <span className={styles.title}>Project notebook</span>
        <span className={styles.count}>{imageCount} images · {videoCount} {videoCount === 1 ? 'video' : 'videos'}</span>
        <span className={styles.plus} aria-hidden="true" />
      </summary>
      <div className={styles.content}>
        <p className={styles.intro}>Notes, sketches, code, and reflections, in the order they were documented. <a href={writeup.source} target="_blank" rel="noreferrer">Original write-up ↗</a></p>
        <p className={styles.hint}>Select any image to see the full-size original.</p>
        {writeup.blocks.map((block, index) => <Block key={index} block={block} />)}
      </div>
    </details>
  );
}
