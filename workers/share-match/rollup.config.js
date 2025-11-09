import {quiltServer} from '@quilted/rollup/server';

export default quiltServer({
  entry: './share-match.ts',
  format: 'custom',
  output: {
    bundle: {
      exclude: ['cloudflare:workers'],
    },
  },
});
