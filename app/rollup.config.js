import {quiltApp} from '@quilted/rollup/app';
import {cloudflareWorkersApp} from '@quilted/cloudflare/craft';

export default quiltApp({
  assets: {baseURL: '/assets/app/'},
  runtime: cloudflareWorkersApp(),
});
