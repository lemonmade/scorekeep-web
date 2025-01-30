import type {DispatchNamespace} from '@cloudflare/workers-types';

export interface Environment {
  SCOREKEEP_BRANCHES: DispatchNamespace;
}

function dispatch(request: Request, env: Environment) {
  const tophat = request.headers.get('Scorekeep-Web-Tophat');

  const worker = tophat
    ? env.SCOREKEEP_BRANCHES.get(`scorekeep-web:tophat:${tophat}`)
    : env.SCOREKEEP_BRANCHES.get(`scorekeep-web:main`);

  return worker.fetch(request as any);
}

export default {fetch: dispatch};
