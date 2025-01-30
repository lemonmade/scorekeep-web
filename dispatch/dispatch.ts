import type {DispatchNamespace} from '@cloudflare/workers-types';

export interface Environment {
  SCOREKEEP_BRANCHES: DispatchNamespace;
}

function dispatch(request: Request, env: Environment) {
  const worker = env.SCOREKEEP_BRANCHES.get('scorekeep-web');
  return worker.fetch(request as any);
}

export default {fetch: dispatch};
