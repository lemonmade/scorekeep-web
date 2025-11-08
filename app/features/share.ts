import {AsyncComponent} from '@quilted/quilt/async';

export const Match = AsyncComponent.from(() => import('./share/Match.tsx'));
export const MatchSummary = AsyncComponent.from(
  () => import('./share/MatchSummary.tsx'),
);
