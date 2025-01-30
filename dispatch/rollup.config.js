import {quiltServer} from '@quilted/rollup/server';

export default quiltServer({
  entry: './dispatch.ts',
  format: 'custom',
});
