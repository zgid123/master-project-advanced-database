import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeModules = path.join(root, 'node_modules');
const workspaceFile = path.join(root, 'pnpm-workspace.yaml');
const linkMode = getLinkMode();
const dependencySections = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];
const ignoredCopyDirs = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'dist-ssr',
  'lib',
  'node_modules',
]);

const workspacePatterns = await readWorkspacePatterns();
const workspacePackages = await findWorkspacePackages(workspacePatterns);
const requiredWorkspacePackages = await findRequiredWorkspacePackages(workspacePackages);
const synced = [];

await fs.mkdir(nodeModules, { recursive: true });

for (const name of [...requiredWorkspacePackages].sort()) {
  const source = workspacePackages.get(name);

  if (!source) {
    throw new Error(`Workspace dependency "${name}" is declared but no matching package was found.`);
  }

  const target = getPackageTarget(name);
  const resolvedTarget = path.resolve(target);

  if (!resolvedTarget.startsWith(nodeModules + path.sep)) {
    throw new Error(`Refusing to write outside node_modules: ${resolvedTarget}`);
  }

  await fs.mkdir(path.dirname(resolvedTarget), { recursive: true });
  await fs.rm(resolvedTarget, { recursive: true, force: true });
  const strategy = await syncPackage(source, resolvedTarget);

  synced.push({ name, source, strategy });
}

if (synced.length === 0) {
  console.log('No workspace packages need syncing.');
} else {
  console.log(`Synced ${synced.length} workspace packages into node_modules:`);
  for (const { name, source, strategy } of synced) {
    console.log(`- ${name} (${strategy}) <- ${path.relative(root, source)}`);
  }
}

function getLinkMode() {
  const mode = (process.env.SOLVIT_WORKSPACE_LINK_MODE ?? 'auto').toLowerCase();
  const supportedModes = new Set(['auto', 'copy', 'link']);

  if (!supportedModes.has(mode)) {
    throw new Error(
      `Invalid SOLVIT_WORKSPACE_LINK_MODE="${mode}". Use "auto", "copy", or "link".`,
    );
  }

  return mode;
}

async function syncPackage(source, target) {
  if (linkMode !== 'copy') {
    try {
      await fs.symlink(source, target, process.platform === 'win32' ? 'junction' : 'dir');
      return 'linked';
    } catch (error) {
      if (linkMode === 'link') {
        throw new Error(`Unable to link ${target}: ${error.message}`);
      }
    }
  }

  await fs.cp(source, target, {
    recursive: true,
    filter: (entry) => shouldCopyEntry(source, entry),
  });

  return 'copied';
}

async function readWorkspacePatterns() {
  const contents = await fs.readFile(workspaceFile, 'utf8');
  const patterns = [];
  let inPackages = false;

  for (const line of contents.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }

    if (inPackages && /^\S/.test(line)) {
      break;
    }

    if (!inPackages) {
      continue;
    }

    const match = line.match(/^\s*-\s*['"]?(.+?)['"]?\s*$/);
    if (match && !match[1].startsWith('!')) {
      patterns.push(match[1]);
    }
  }

  return patterns;
}

async function findWorkspacePackages(patterns) {
  const packages = new Map();

  for (const pattern of patterns) {
    const base = getPatternBase(pattern);
    const absoluteBase = path.join(root, base);

    if (!(await pathExists(absoluteBase))) {
      continue;
    }

    for (const packageDir of await findPackageDirs(absoluteBase)) {
      const manifest = await readJson(path.join(packageDir, 'package.json'));
      if (manifest.name) {
        packages.set(manifest.name, packageDir);
      }
    }
  }

  return packages;
}

async function findPackageDirs(base) {
  const dirs = [];

  async function visit(dir) {
    if (await pathExists(path.join(dir, 'package.json'))) {
      dirs.push(dir);
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || ignoredCopyDirs.has(entry.name)) {
        continue;
      }

      await visit(path.join(dir, entry.name));
    }
  }

  await visit(base);
  return dirs;
}

async function findRequiredWorkspacePackages(workspacePackages) {
  const required = new Set();
  const manifests = [path.join(root, 'package.json')];

  for (const packageDir of workspacePackages.values()) {
    manifests.push(path.join(packageDir, 'package.json'));
  }

  for (const manifestPath of manifests) {
    const manifest = await readJson(manifestPath);

    for (const section of dependencySections) {
      const dependencies = manifest[section];
      if (!dependencies) {
        continue;
      }

      for (const [name, spec] of Object.entries(dependencies)) {
        if (typeof spec === 'string' && spec.startsWith('workspace:')) {
          required.add(name);
        }
      }
    }
  }

  return required;
}

function getPatternBase(pattern) {
  const wildcardIndex = pattern.search(/[*{]/);
  const base = wildcardIndex === -1 ? pattern : pattern.slice(0, wildcardIndex);
  return base.replace(/[\\/]+$/, '');
}

function getPackageTarget(name) {
  if (name.startsWith('@')) {
    const [scope, packageName] = name.split('/');
    return path.join(nodeModules, scope, packageName);
  }

  return path.join(nodeModules, name);
}

function shouldCopyEntry(source, entry) {
  const relative = path.relative(source, entry);
  if (!relative) {
    return true;
  }

  return !relative.split(path.sep).some((part) => ignoredCopyDirs.has(part));
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
