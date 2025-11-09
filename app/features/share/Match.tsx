// import {OpenGraph} from '@quilted/quilt/server';

import {MatchSummaryTable} from './components/MatchSummaryTable.tsx';
// import {useCurrentURL} from '@quilted/quilt/navigation';

export default function Match() {
  // const url = useCurrentURL();
  // const id = url.pathname.split('/').pop()!;
  // const ogImageUrl = new URL(`/.internal/share-match/${id}/og-image`, url);

  return (
    <div>
      {/* <OpenGraph
        title="Shared match"
        description="Shared match"
        image={ogImageUrl}
      /> */}
      <MatchSummaryTable />
    </div>
  );
}
