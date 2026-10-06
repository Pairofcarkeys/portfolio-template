/**
 * SAMPLE DATA — optional long-form "project notebook" shown at the bottom of a
 * /timeline/<id> page, keyed by timeline id. Delete entries you don't need.
 */
export type WriteupInline = { text: string; href?: string; strong?: boolean };
export type WriteupBlock =
  | { type: 'paragraph' | 'heading'; content: WriteupInline[] }
  | { type: 'list'; ordered: boolean; items: WriteupInline[][] }
  | { type: 'image'; src: string; alt: string; width: number; height: number; caption?: string }
  | { type: 'video'; youtubeId: string; title: string; caption?: string; src?: string; poster?: string; unavailable?: boolean }
  | { type: 'attachment'; href: string; title: string };
export type ProjectWriteup = { title: string; source: string; blocks: WriteupBlock[] };

export const projectWriteups: Record<string, ProjectWriteup> = {
  'project-one': {
    title: 'Project One',
    source: 'https://example.com',
    blocks: [
      { type: 'heading', content: [{ text: 'Define the problem', strong: true }] },
      { type: 'paragraph', content: [{ text: 'Write a short paragraph about the problem you set out to solve and why it mattered to you.' }] },
      { type: 'heading', content: [{ text: 'Develop a solution', strong: true }] },
      { type: 'list', ordered: true, items: [
        [{ text: 'Sketch the first idea.' }],
        [{ text: 'Build the smallest version that works.' }],
        [{ text: 'Test it with real people and ' }, { text: 'write down what you learn', strong: true }, { text: '.' }],
      ] },
      { type: 'image', src: '/projects/project-one/detail.jpg', alt: 'Placeholder project screenshot', width: 1440, height: 900, caption: 'Fig. — Replace with your own screenshot.' },
      { type: 'heading', content: [{ text: 'Reflect', strong: true }] },
      { type: 'paragraph', content: [{ text: 'Close with what worked, what didn’t, and what you would change. Link to ' }, { text: 'related reading', href: 'https://example.org' }, { text: ' if it helps.' }] },
    ],
  },
};
