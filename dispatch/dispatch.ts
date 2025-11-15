import {Hono} from 'hono';

import type {
  R2Bucket,
  DispatchNamespace,
  WorkerVersionMetadata,
} from '@cloudflare/workers-types/experimental';
import type {ShareMatchService} from '../workers/share-match/share-match';

export interface Environment {
  APP_ASSETS: R2Bucket;
  SHARE_MATCH: Pick<ShareMatchService, 'share' | 'ogImage'>;
  SCOREKEEP_VERSIONS: DispatchNamespace;
  CLOUDFLARE_VERSION_METADATA: WorkerVersionMetadata;
}

const PREVIEW_HEADER = 'ScoreKeep-Internal-Preview';

const app = new Hono<{Bindings: Environment}>();

app.get('/assets/app/*', async (c) => {
  console.log(`Serving app asset...`);
  const asset = await fetchAssetFromBucket(c.req.raw, c.env.APP_ASSETS);
  return asset;
});

app.post('/.internal/share-match', async (c) => {
  console.log(`Sharing match...`);
  const response = await c.env.SHARE_MATCH.share(c.req.raw);
  return response;
});

app.get('/.internal/share-match/:id/og-image', async (c) => {
  console.log(`Serving OG image (id: ${c.req.param('id')})...`);
  const response = await c.env.SHARE_MATCH.ogImage(c.req.raw);
  return response;
});

app.use('*', async (c) => {
  const request = c.req.raw;

  const preview = request.headers.get(PREVIEW_HEADER);

  const worker = preview
    ? c.env.SCOREKEEP_VERSIONS.get(`scorekeep-web.preview.${preview}`)
    : c.env.SCOREKEEP_VERSIONS.get(`scorekeep-web.main`);

  const response = await worker.fetch(request as any);

  const cloned = new ClonedResponse(response as any, {
    headers: preview
      ? {
          [PREVIEW_HEADER]: preview,
        }
      : {},
  });

  return cloned;
});

export default app;

class ClonedResponse extends Response {
  constructor(response: Response, init?: ResponseInit) {
    const headers = init?.headers
      ? new ClonedHeaders(response.headers, init.headers)
      : response.headers;

    super(response.body as any, {
      ...init,
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
}

class ClonedHeaders extends Headers {
  constructor(headers: Headers, init?: HeadersInit) {
    super(headers);

    if (init) {
      if (init instanceof Headers) {
        for (const [key, value] of init.entries()) {
          this.append(key, value);
        }
      } else if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.append(key, value);
        }
      } else {
        for (const [key, value] of Object.entries(init)) {
          this.append(key, value);
        }
      }
    }
  }
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
