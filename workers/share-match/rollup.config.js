import {quiltServer} from '@quilted/rollup/server';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default quiltServer({
  format: 'custom',
  entry: './share-match.ts',
  runtime: cloudflareWorkers(),
  output: {
    bundle: {
      dependencies: true,
      exclude: ['cloudflare:workers'],
    },
  },
});
