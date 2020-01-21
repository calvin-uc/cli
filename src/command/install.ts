import {existsSync, readdirSync} from 'fs';
import path from 'path';
import execa from 'execa';
import {prompt} from 'enquirer';
import config from '../config/bin.json';

const HOME_PATH = config.home;
const ROOT_PATH = config.root;

const CATEGORY_LIST = [
  'apps',
  'lambdas',
  'packages',
];

export type Options = {
  regen?: boolean,
  clean?: boolean,
  cwd?: string,
};

export async function execute(category: string, name: string, opts: Options) {
  if (opts.cwd && !category && !name) {
    [category, name] = parseArgsFromCwd(opts.cwd);
  }

  [category, name] = validatePath(category, name);

  if (!category) {
    category = await promptCategory();
  }

  if (!name) {
    const pathToCategory = path.join(ROOT_PATH, 'uc-frontend', category);
    name = await promptName(pathToCategory);
  }

  const cwd = path.join(ROOT_PATH, 'uc-frontend', category, name);
  const options:execa.Options = {cwd, stdio: 'inherit'};

  const subprocess = execa('./pnpm', ['install'], options);

  let cmd = 'Error resolving command';
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

    console.log('\nSuccessfully installed packages:');
    cmd = sp.command;
  } catch (e) {
    console.log('\nFailed installing packages:');
    // TODO: log error to file
    cmd = e.command;
  }

  console.log(`CMD: ${cmd}`);
  console.log(`DIR: ${cwd}`);
}

function validatePath(category: string, name: string): [string, string] {
  if (category && !CATEGORY_LIST.includes(category)) {
    console.log(`Invalid category: ${category}`);
    category = '';
    name = '';
  }

  if (category && name) {
    const pathToCategory = path.join(ROOT_PATH, 'uc-frontend', category);
    const dirs = getDirectoryList(pathToCategory);
    if (!dirs.includes(name)) {
      console.log(`Invalid name: ${name}`)
      name = '';
    }
  }

  return [category, name]
}

function getDirectoryList(path: string): string[] {
  let dirs = [];
  try {
    dirs = readdirSync(path, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
  } catch (e) {
    console.error(e);
    // this shouldn't be an issue
    return [];
  }

  return dirs;
}

function parseArgsFromCwd(path: string): [string, string] {
  const PATH_MATCHER = /^.*uc-frontend\/([-\w]+)\/([-\w.]+)\/?(.+)?/
  const [_fullPath, category, name] = PATH_MATCHER.exec(path) || ['', '', ''];

  return [category, name];
}

async function promptCategory(): Promise<string> {
  try {
    const {category} = await prompt({
      type: 'autocomplete',
      name: 'category',
      message: 'Select a category',
      choices: CATEGORY_LIST,
    });

    return category;
  } catch (e) {
    // not sure how there's an error
    return '';
  }
}

async function promptName(path: string): Promise<string> {
  let dirs = getDirectoryList(path);

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
  const PNPM_STORE_FOLDER = '.pnpm-store';
  const cwd = path.join(HOME_PATH);

  console.log('cwd', cwd)
  console.log(path.join(HOME_PATH, PNPM_STORE_FOLDER))
  if (!pathExists(path.join(HOME_PATH, PNPM_STORE_FOLDER))) {
    console.log('does not exist?!?!');
    return;
  }

  let cmd = 'Error resolving command';
  try {
    const sp = await execa('rm', ['-rf', PNPM_STORE_FOLDER], {
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
  const NODE_MODULES_FOLDER = 'node_modules/';

  if (!pathExists(path.join(options.cwd || '', NODE_MODULES_FOLDER))) {
    return;
  }

  let cmd = 'Error resolving command';
  try {
    const sp = await execa('rm', ['-rf', NODE_MODULES_FOLDER], options);
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
    let cmd = 'Error resolving command';
    try {
      const sp = await execa('rm', [file], options);
      console.log(`\nSuccessfully removed ${file}`);
      cmd = sp.command;
    } catch (e) {
      // TODO: log error to file
      cmd = e.command;
    }

    console.log(`CMD: ${cmd}`);
    console.log(`DIR: ${options.cwd}\n`);
  }
}

function pathExists(path: string): boolean {
  const exists = existsSync(path);
  !exists && console.log(`\n${path} does not exist`);

  return exists;
}