import type {R2Bucket, DispatchNamespace} from '@cloudflare/workers-types';

export interface Environment {
  APP_ASSETS: R2Bucket;
  SCOREKEEP_BRANCHES: DispatchNamespace;
}

async function dispatch(request: Request, env: Environment) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/assets/app/')) {
    const asset = await fetchAssetFromBucket(request, env.APP_ASSETS);
    return asset;
  }

  const tophat = request.headers.get('Scorekeep-Web-Tophat');

  const worker = tophat
    ? env.SCOREKEEP_BRANCHES.get(`scorekeep-web:tophat:${tophat}`)
    : env.SCOREKEEP_BRANCHES.get(`scorekeep-web:main`);

  return worker.fetch(request as any);
}

async function fetchAssetFromBucket(request: Request, bucket: R2Bucket) {
  const url = new URL(request.url);
  const object = await bucket.get(url.pathname.slice(1));

  if (!object || !object.body) {
    return new Response('Not Found', {status: 404});
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers as any);
  headers.set('etag', object.httpEtag);

  return new Response(object.body as any, {
    headers,
  });
}

export default {fetch: dispatch};
