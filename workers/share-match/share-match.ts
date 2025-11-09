
import {launch, type Browser} from '@cloudflare/playwright';
import type {
  WorkerVersionMetadata,
  Fetcher,
  KVNamespace,
} from '@cloudflare/workers-types/experimental';
import {WorkerEntrypoint} from 'cloudflare:workers';

export interface Environment {
  DATA: KVNamespace;
  OG_IMAGE_DATA: KVNamespace;
  RENDER_OG_IMAGE_BROWSER: Fetcher;
  CLOUDFLARE_VERSION_METADATA: WorkerVersionMetadata;
}

export class ShareMatchService extends WorkerEntrypoint<Environment> {
  async share(request: Request) {
    const response = await share(request, this.env);
    return response;
  }

  async ogImage(request: Request) {
    const response = await ogImage(request, this.env);
    return response;
  }
}

export default {fetch: share};

async function share(request: Request, env: Environment) {
  const url = new URL(request.url);

  if (request.method !== 'POST') {
    return new Response('Method not allowed', {status: 405});
  }

  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return new Response('Unsupported media type', {status: 415});
  }

  let body: any;

  try {
    body = await request.json();

    if (typeof body !== 'object' || body === null) {
      throw new Error('Invalid JSON');
    }
  } catch (error) {
    return new Response('Invalid JSON', {status: 400});
  }

  const targetUrl = new URL('/share/example', url);

  // TODO: add data to KV
  await env.DATA.put(
    'example',
    JSON.stringify({
      url: targetUrl.href,
    }),
  );

  return new Response(
    JSON.stringify({
      url: targetUrl.href,
    }),
    {headers: {'Content-Type': 'application/json'}},
  );
}

async function ogImage(request: Request, env: Environment) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop()!;

  // TODO: allow caching
  let ogImage = await env.OG_IMAGE_DATA.get(`${id}-og-image`, {type: 'arrayBuffer'});

  if (!ogImage) {
    // TODO: better 404
    const data = await env.DATA.get(id, {type: 'json'});
    if (!data) {
      return new Response('Not Found', {status: 404});
    }

    const previewImageUrl = new URL(`/share/${id}/summary`, url);

    let browser: Browser | undefined;

    try {
      browser = await launch(env.RENDER_OG_IMAGE_BROWSER as any);

      const page = await browser.newPage({
        viewport: {width: 1200, height: 630},
      });
      await page.goto(previewImageUrl.href);
      ogImage = await page.screenshot({fullPage: true, type: 'png'});

      // TODO: add light and dark modes?
      await env.OG_IMAGE_DATA.put(id, ogImage!);
    } finally {
      await browser?.close();
    }
  }

  if (!ogImage) {
    return new Response('Not Found', {status: 404});
  }

  return new Response(ogImage, {headers: {'Content-Type': 'image/png'}});
}
