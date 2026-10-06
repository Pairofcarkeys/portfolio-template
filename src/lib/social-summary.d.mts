export interface SocialSummary {
  schemaVersion: 1;
  fetchedAt: string;
  views: number;
  postCount: number;
  postsWithViews: number;
  accountCount: number;
  complete: boolean;
}
export function summarizeSocialStats(snapshot: unknown): SocialSummary | null;
export function isSocialSummary(value: unknown): value is SocialSummary;
