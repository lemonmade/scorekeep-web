import {parseArgs} from 'node:util';
import {Cloudflare} from 'cloudflare';
import spawn from 'nano-spawn';

const cloudflare = new Cloudflare();

const {commit, branch} = await (async () => {
  const {values} = parseArgs({
    options: {
      commit: {type: 'string'},
      branch: {type: 'string'},
    },
  });

  const commit =
    values.commit ?? (await spawn('git', ['rev-parse', 'HEAD'])).output;
  const branch =
    values.branch ??
    (await spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).output;

  return {commit, branch};
})();

const dispatchNamespace = 'scorekeep-web-versions';

// I could do these in parallel, but I don’t want to interleave the output of
// the two deploy commands.
await deployWithName(`scorekeep-web.preview.${commit}`);
await deployWithName(`scorekeep-web.preview.${branch}`);

async function deployWithName(dispatchName: string) {
  const deployCommand = spawn('pnpm', [
    `exec`,
    `wrangler`,
    `deploy`,
    `--dispatch-namespace`,
    dispatchNamespace,
    `--name`,
    dispatchName,
  ]);

  console.log(`[${dispatchName}] wrangler deploy:`);
  for await (const line of deployCommand) {
    console.log(line);
  }

  // Note: this approach works fine for the preview environment, but it wouldn’t
  // work for the production environment, since there would be some time before
  // all the necessary secrets are available.

  console.log();
  console.log(`[${dispatchName}] Adding secrets...`);
  const secrets = new Map([
    ['CLOUDFLARE_API_TOKEN', process.env.CLOUDFLARE_API_TOKEN ?? ''],
  ]);

  for (const [name, value] of secrets) {
    const result =
      await cloudflare.workersForPlatforms.dispatch.namespaces.scripts.secrets.update(
        dispatchNamespace,
        dispatchName,
        {
          account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
          name,
          text: value,
          type: 'secret_text',
        },
      );

    console.log();
    console.log(`[${dispatchName}] Secret updated: ${name}`);
    console.log(result);
  }
}
