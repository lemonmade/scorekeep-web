import type {
  R2Bucket,
  DispatchNamespace,
  WorkerVersionMetadata,
} from '@cloudflare/workers-types';

export interface Environment {
  APP_ASSETS: R2Bucket;
  SCOREKEEP_VERSIONS: DispatchNamespace;
  CLOUDFLARE_VERSION_METADATA: WorkerVersionMetadata;
}

const PREVIEW_HEADER = 'ScoreKeep-Internal-Preview';

async function dispatch(request: Request, env: Environment) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/assets/app/')) {
    const asset = await fetchAssetFromBucket(request, env.APP_ASSETS);
    return asset;
  }

  const preview = request.headers.get(PREVIEW_HEADER);

  const worker = preview
    ? env.SCOREKEEP_VERSIONS.get(`scorekeep-web.preview.${preview}`)
    : env.SCOREKEEP_VERSIONS.get(`scorekeep-web.main`);

  const response = await worker.fetch(request as any);

  const cloned = new ClonedResponse(response as any, {
    headers: preview
      ? {
          [PREVIEW_HEADER]: preview,
        }
      : {},
  });

  return cloned;
}

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

export default {fetch: dispatch};
