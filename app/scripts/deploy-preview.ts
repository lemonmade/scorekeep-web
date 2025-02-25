import {Cloudflare} from 'cloudflare';
import spawn from 'nano-spawn';

const cloudflare = new Cloudflare();

const {output: gitHash} = await spawn('git', ['rev-parse', 'HEAD']);

const dispatchNamespace = 'scorekeep-web-versions';
const dispatchName = `scorekeep-web:preview:${gitHash}`;

const deployCommand = spawn('pnpm', [
  `exec`,
  `wrangler`,
  `deploy`,
  `--dispatch-namespace`,
  dispatchNamespace,
  `--name`,
  dispatchName,
]);

console.log('wrangler deploy:');
for await (const line of deployCommand) {
  console.log(line);
}

// Note: this approach works fine for the preview environment, but it wouldn’t
// work for the production environment, since there would be some time before
// all the necessary secrets are available.

console.log();
console.log(`Adding secrets...`);
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
  console.log(`Secret updated: ${name}`);
  console.log(result);
}
