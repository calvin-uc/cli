import {readdirSync} from 'fs';
import path from 'path';
import execa from 'execa';
import {prompt} from 'enquirer';

type Options = {
  regen: boolean,
  clean: boolean,
};

export async function execute(category: string, name: string, opts: Options) {
  if (!category) {
    category = await promptCategory();
  }

  if (!name) {
    const pathToCategory = path.resolve('development', 'uc-frontend', category);
    name = await promptName(pathToCategory);
  }

  const cwd = path.resolve('development', 'uc-frontend', category, name);
  const options:execa.Options = {cwd, stdio: 'inherit'};

  const subprocess = execa('./pnpm', ['install'], options);

  try {
    if (opts.clean) {
      await removePnpmStore();
      await removeNodeModules(options);
    }

    if (opts.regen) {
      await removeLockFile(options);
      await removeNodeModules(options);
    }

    const sp = await subprocess;

    console.log('\nSuccessfully executed:');
    console.log(`CMD: ${sp.command}`);
    console.log(`DIR: ${cwd}`);
  } catch (e) {
    console.error(e);
  }
}

async function promptCategory(): Promise<string> {
  try {
    const {category} = await prompt({
      type: 'autocomplete',
      name: 'category',
      message: 'Select a category',
      choices: [
        'apps',
        'lambdas',
        'packages',
      ],
    });

    return category;
  } catch (e) {
    // not sure how there's an error
    return '';
  }
}

async function promptName(path: string): Promise<string> {
  let dirs = [];
  try {
    dirs = readdirSync(path, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  } catch (e) {
    // this shouldn't be an issue
    return '';
  }

  try {
    const {name} = await prompt({
      type: 'autocomplete',
      name: 'name',
      message: 'Select a name',
      choices: dirs,
    });

    return name;
  } catch (e) {
    // not sure how there's an error
    return '';
  }
}

async function removePnpmStore(): Promise<void> {
  const cwd = path.resolve();
  let cmd = 'Error resolving command';
  try {
    const sp = await execa('rm', ['-rf', '.pnpm-store/'], {
      cwd,
      stdio: 'inherit',
    });
    console.log('\nSuccessfully removed pnpm store');
    cmd = sp.command;
  } catch (e) {
    console.log('\nFailed removing pnpm store');
    // TODO: log error to file
    cmd = e.command;
  }

  console.log(`CMD: ${cmd}`);
  console.log(`DIR: ${cwd}\n`);
}

async function removeNodeModules(options: execa.Options): Promise<void> {
  let cmd = 'Error resolving command';
  try {
    const sp = await execa('rm', ['-rf', 'node_modules/'], options);
    console.log('\nSuccessfully removed node modules');
    cmd = sp.command;
  } catch (e) {
    console.log('\nFailed removing node modules');
    // TODO: log error to file
    cmd = e.command;
  }

  console.log(`CMD: ${cmd}`);
  console.log(`DIR: ${options.cwd}\n`);
}

async function removeLockFile(options: execa.Options): Promise<void> {
  const lockFiles = ['shrinkwrap.yaml', 'pnpm-lock.yaml'];

  for (const file of lockFiles) {
    try {
      const sp = await execa('rm', [file], options);
      console.log(`\nSuccessfully removed ${file}`);
      console.log(`CMD: ${sp.command}`);
      console.log(`DIR: ${options.cwd}\n`);
    } catch (e) {
      // no-op
    }
  }
}