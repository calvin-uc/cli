import {Command} from 'commander';

import {execute as handleInstallAction} from '../command/install';

export async function cli(argv: string[]): Promise<void> {
  const program = new Command();
  program
    .command('install [category] [name]')
    .description('install packages in category (apps|packages)/name')
    .option('--regen', 'regenerate lock file', false)
    .option('--clean', 'remove node modules and store', false)
    .action(handleInstallAction);

  program.parse(argv);
}

// Called as CLI script
if (require && require.main === module) {
  cli(process.argv);
}