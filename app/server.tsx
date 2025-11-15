import {Hono} from 'hono';

import {Router} from '@quilted/quilt/navigation';
import {
  renderAppToHTMLResponse,
  CacheControlHeader,
  ContentSecurityPolicyHeader,
  PermissionsPolicyHeader,
  StrictTransportSecurityHeader,
} from '@quilted/quilt/server';
import type {
  R2Bucket,
  DispatchNamespace,
  WorkerVersionMetadata,
} from '@cloudflare/workers-types';
import type {ShareMatchService} from '@scorekeep/worker-share-match';
import {BrowserAssets} from 'quilt:module/assets';

import type {AppContext} from '~/shared/context.ts';

import {App} from './App.tsx';

export interface Environment {
  APP_ASSETS: R2Bucket;
  SHARE_MATCH: Pick<ShareMatchService, 'share' | 'ogImage'>;
  SCOREKEEP_VERSIONS: DispatchNamespace;
  CLOUDFLARE_VERSION_METADATA?: WorkerVersionMetadata;
  CLOUDFLARE_API_TOKEN: string;
}

const PREVIEW_HEADER = 'ScoreKeep-Internal-Preview';
const WORKER_VERSION_ID_RESPONSE_HEADER =
  'ScoreKeep-Internal-Worker-Version-ID';
const WORKER_VERSION_TAG_RESPONSE_HEADER =
  'ScoreKeep-Internal-Worker-Version-Tag';

const app = new Hono<{Bindings: Environment}>();
const assets = new BrowserAssets();

// Preview deployment
app.use('*', async (c, next) => {
  if (c.env.CLOUDFLARE_VERSION_METADATA) return await next();
  
  const preview = c.req.header(PREVIEW_HEADER);
  if (!preview) return await next();

  const worker = c.env.SCOREKEEP_VERSIONS.get(`scorekeep-web.preview.${preview}`);
  const response = await worker.fetch(c.req.raw as any);
  return new ClonedResponse(response as any, {
    headers: {
      [PREVIEW_HEADER]: preview,
    },
  });
});

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

// For all GET requests, render our Preact application.
app.get('*', async (c) => {
  const request = c.req.raw;

  const context = {
    router: new Router(request.url),
  } satisfies AppContext;

  const isHttps = request.url.startsWith('https://');

  const headers = new Headers({
    // Controls how much information about the current page is included in
    // requests (through the `Referer` header). The default value
    // (strict-origin-when-cross-origin) means that only the origin is included
    // for cross-origin requests, while the origin, path, and querystring
    // are included for same-origin requests.
    //
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Disables the cache for this page, which is generally the best option
    // when dealing with authenticated content. If your site doesn't have
    // authentication, or you have a better cache policy that works for your
    // app or deployment, make sure to update this component accordingly!
    //
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    'Cache-Control': CacheControlHeader.stringify({
      cache: false,
    }),

    // Sets a strict content security policy for this page. If you load
    // assets from other origins, or want to allow some more dangerous
    // resource loading techniques like `eval`, you can change the
    // `defaultSources` to be less restrictive, or add additional items
    // to the allowlist for more specific directives.
    //
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
    'Content-Security-Policy': ContentSecurityPolicyHeader.stringify({
      // By default, only allow sources from the page's origin.
      defaultSources: ["'self'"],
      // In development, allow connections to local websockets for hot reloading.
      connectSources:
        process.env.NODE_ENV === 'development'
          ? ["'self'", `${isHttps ? 'ws' : 'wss'}://localhost:*`]
          : undefined,
      // Includes `'unsafe-inline'` because CSS is often necessary in development,
      // and can be difficult to avoid in production.
      styleSources: ["'self'", "'unsafe-inline'"],
      // Includes `data:` so that an inline image can be used for the favicon.
      // If you do not use the `emoji` or `blank` favicons in your app, and you
      // do not load any other images as data URIs, you can remove this directive.
      imageSources: ["'self'", 'data:'],
      // Don't allow this page to be rendered as a frame from a different origin.
      frameAncestors: false,
      // Ensure that all requests made by this page are made over https, unless
      // it is being served over http (typically, during local development)
      upgradeInsecureRequests: isHttps,
    }),

    // Sets a strict permissions policy for this page, which limits access
    // to some native browser features.
    //
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
    'Permissions-Policy': PermissionsPolicyHeader.stringify({
      // Disables Google's Federated Learning of Cohorts ("FLoC") tracking initiative.
      // @see https://www.eff.org/deeplinks/2021/03/googles-floc-terrible-idea
      interestCohort: false,
      // Don't use synchronous XHRs!
      // @see https://featurepolicy.info/policies/sync-xhr
      syncXhr: false,
      // Disables access to a few device APIs that are infrequently used
      // and prone to abuse. If your application uses these APIs intentionally,
      // feel free to remove the prop, or pass an array containing the origins
      // that should be allowed to use this feature (e.g., `['self']` to allow
      // only the main page's origin).
      camera: false,
      microphone: false,
      geolocation: false,
    }),

    // Instructs browsers to only load this page over HTTPS.
    //
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
    'Strict-Transport-Security': StrictTransportSecurityHeader.stringify(),
  });

  const workerVersion = c.env.CLOUDFLARE_VERSION_METADATA;

  if (workerVersion) {
    headers.set(WORKER_VERSION_ID_RESPONSE_HEADER, workerVersion.id);
    headers.set(WORKER_VERSION_TAG_RESPONSE_HEADER, workerVersion.tag);
  }

  const response = await renderAppToHTMLResponse(<App context={context} />, {
    request,
    assets,
    headers,
  });

  return response;
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
