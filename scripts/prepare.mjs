import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const run = (command, args = []) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const npmCommand = process.env.npm_command ?? '';
const shouldInstallHusky = existsSync('.git') && !new Set(['pack', 'publish']).has(npmCommand);

if (shouldInstallHusky) {
  run('husky');
}
