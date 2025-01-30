import {quiltApp} from '@quilted/rollup/app';
import {cloudflareWorkers} from '@quilted/cloudflare/craft';

export default quiltApp({
  browser: {entry: './browser.tsx', assets: {baseURL: '/assets/app/'}},
  server: {entry: './server.tsx', runtime: cloudflareWorkers()},
});
