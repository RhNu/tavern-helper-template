import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const rootDir = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

const modeArg =
  process.argv.find(arg => arg.startsWith('--mode='))?.slice('--mode='.length) ?? process.argv[2] ?? 'production';
if (modeArg !== 'production' && modeArg !== 'development') {
  throw new Error(`[build] Unsupported mode '${modeArg}'. Use 'production' or 'development'.`);
}
const mode = modeArg;
const isProduction = mode === 'production';

const toPosix = value => value.split(path.sep).join('/');

const CDN_SPECIAL_MAPPING = {
  sass: 'https://jspm.dev/sass',
};

const CDN_EXTERNAL_MAPPING = {
  jquery: 'https://testingcf.jsdelivr.net/npm/jquery/+esm',
  lodash: 'https://testingcf.jsdelivr.net/npm/lodash/+esm',
  showdown: 'https://testingcf.jsdelivr.net/npm/showdown/+esm',
  toastr: 'https://testingcf.jsdelivr.net/npm/toastr/+esm',
  yaml: 'https://testingcf.jsdelivr.net/npm/yaml/+esm',
  zod: 'https://testingcf.jsdelivr.net/npm/zod/+esm',
};

const INLINE_PACKAGE_HINTS = ['react', 'pixi'];

/**
 * @param {string} request
 */
function isLocalOrAliasedRequest(request) {
  return (
    request.startsWith('.') ||
    request.startsWith('/') ||
    request.startsWith('@/') ||
    request.startsWith('@util/') ||
    request.startsWith('http://') ||
    request.startsWith('https://') ||
    request.startsWith('data:') ||
    path.isAbsolute(request)
  );
}

/**
 * @param {string} request
 */
function shouldInlinePackageRequest(request) {
  return INLINE_PACKAGE_HINTS.some(keyword => request.includes(keyword));
}

/**
 * @param {string} request
 */
function shouldExternalizeScriptImport(request) {
  if (!request || request.startsWith('\0')) {
    return false;
  }

  if (isLocalOrAliasedRequest(request)) {
    return false;
  }

  if (shouldInlinePackageRequest(request)) {
    return false;
  }

  return true;
}

/**
 * @param {string} request
 */
function resolveExternalCdnUrl(request) {
  return (
    CDN_SPECIAL_MAPPING[request] ??
    CDN_EXTERNAL_MAPPING[request] ??
    `https://testingcf.jsdelivr.net/npm/${request}/+esm`
  );
}

const resolveAlias = [
  {
    find: /^@util$/,
    replacement: toPosix(path.join(rootDir, 'util')),
  },
  {
    find: /^@util\//,
    replacement: `${toPosix(path.join(rootDir, 'util'))}/`,
  },
  {
    find: /^@$/,
    replacement: toPosix(srcDir),
  },
  {
    find: /^@\//,
    replacement: `${toPosix(srcDir)}/`,
  },
];

/** @typedef {'script' | 'frontend'} ProjectKind */

/**
 * @typedef Project
 * @property {string} entryFile
 * @property {string | null} htmlEntry
 * @property {string} projectRoot
 * @property {string} relativeDir
 * @property {string} outputDir
 * @property {ProjectKind} kind
 */

/**
 * @param {string} inputDir
 * @returns {string[]}
 */
function collectFiles(inputDir) {
  if (!fs.existsSync(inputDir)) {
    return [];
  }

  /** @type {string[]} */
  const result = [];
  const stack = [''];

  while (stack.length > 0) {
    const relative = stack.pop();
    const absolute = relative ? path.join(inputDir, relative) : inputDir;

    for (const entryName of fs.readdirSync(absolute)) {
      const entryRelative = relative ? path.join(relative, entryName) : entryName;
      const entryAbsolute = path.join(inputDir, entryRelative);
      const stat = fs.statSync(entryAbsolute);
      if (stat.isDirectory()) {
        stack.push(entryRelative);
      } else {
        result.push(toPosix(entryRelative));
      }
    }
  }

  return result.sort();
}

/**
 * @returns {Project[]}
 */
function discoverProjects() {
  if (!fs.existsSync(srcDir)) {
    return [];
  }

  const entries = fs.globSync('**/index.{ts,tsx,js,jsx}', { cwd: srcDir }).sort();
  if (entries.length === 0) {
    return [];
  }

  /** @type {Map<string, string>} */
  const projectEntryByDir = new Map();
  for (const entry of entries) {
    const dir = path.dirname(entry);
    const existed = projectEntryByDir.get(dir);
    if (existed) {
      throw new Error(`[build] Duplicate project entry in '${dir}': '${existed}' and '${entry}'.`);
    }
    projectEntryByDir.set(dir, entry);
  }

  const dirs = [...projectEntryByDir.keys()].sort((lhs, rhs) => lhs.length - rhs.length);
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const parent = dirs[i];
      const child = dirs[j];
      if (child !== parent && child.startsWith(`${parent}${path.sep}`)) {
        throw new Error(`[build] Nested project folders are not supported yet: '${parent}' is parent of '${child}'.`);
      }
    }
  }

  return [...projectEntryByDir.values()].map(relativeEntry => {
    const entryFile = path.join(srcDir, relativeEntry);
    const projectRoot = path.dirname(entryFile);
    const htmlEntryCandidate = path.join(projectRoot, 'index.html');
    const htmlEntry = fs.existsSync(htmlEntryCandidate) ? htmlEntryCandidate : null;
    const relativeDir = path.dirname(relativeEntry) === '.' ? '' : path.dirname(relativeEntry);
    const outputDir = path.join(distDir, relativeDir);

    return {
      entryFile,
      htmlEntry,
      projectRoot,
      relativeDir,
      outputDir,
      kind: htmlEntry === null ? 'script' : 'frontend',
    };
  });
}

/**
 * @param {Project} project
 */
function assertProjectConstraints(project) {
  const vueFiles = fs.globSync('**/*.vue', { cwd: project.projectRoot });
  if (vueFiles.length > 0) {
    throw new Error(
      `[build] Vue files are no longer supported in '${project.relativeDir || '.'}': ${vueFiles.join(', ')}`,
    );
  }
}

/**
 * @param {Project} project
 */
async function buildScriptProject(project) {
  await build({
    configFile: false,
    mode,
    plugins: [react()],
    resolve: {
      alias: resolveAlias,
    },
    build: {
      target: 'es2020',
      outDir: project.outputDir,
      emptyOutDir: false,
      sourcemap: mode === 'development',
      minify: isProduction ? 'esbuild' : false,
      cssCodeSplit: false,
      lib: {
        entry: project.entryFile,
        formats: ['es'],
        fileName: () => 'index',
      },
      rollupOptions: {
        external: request => shouldExternalizeScriptImport(request),
        output: {
          entryFileNames: 'index.js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          inlineDynamicImports: true,
          manualChunks: undefined,
          paths: request => resolveExternalCdnUrl(request),
        },
      },
    },
  });
}

/**
 * @param {Project} project
 */
async function buildFrontendProject(project) {
  await build({
    configFile: false,
    mode,
    root: project.projectRoot,
    publicDir: false,
    plugins: [react(), viteSingleFile()],
    resolve: {
      alias: resolveAlias,
    },
    build: {
      target: 'es2020',
      outDir: project.outputDir,
      emptyOutDir: false,
      sourcemap: false,
      minify: isProduction ? 'esbuild' : false,
      cssCodeSplit: false,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      rollupOptions: {
        input: project.htmlEntry,
        output: {
          inlineDynamicImports: true,
          manualChunks: undefined,
        },
      },
    },
  });
}

/**
 * @param {Project} project
 */
function validateSingleFileOutput(project) {
  const files = collectFiles(project.outputDir);
  const allowed = project.kind === 'script' ? ['index.js'] : ['index.html'];
  if (mode === 'development' && project.kind === 'script') {
    allowed.push('index.js.map');
  }

  const invalid = files.filter(file => !allowed.includes(file));
  const requiredMissing = allowed.filter(file => !file.endsWith('.map') && !files.includes(file));

  if (invalid.length > 0 || requiredMissing.length > 0) {
    throw new Error(
      [
        `[build] '${project.relativeDir || '.'}' did not produce a valid single-file output.`,
        `- output files: ${files.join(', ') || '(none)'}`,
        `- allowed files: ${allowed.join(', ')}`,
      ].join('\n'),
    );
  }
}

async function main() {
  console.info(`[build] mode=${mode}`);

  const projects = discoverProjects();
  if (projects.length === 0) {
    fs.mkdirSync(distDir, { recursive: true });
    console.info('[build] No entries found in src/**/index.{ts,tsx,js,jsx}. Skipped.');
    return;
  }

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  for (const project of projects) {
    assertProjectConstraints(project);

    const display = project.relativeDir || '.';
    console.info(`[build] Building ${project.kind} project: ${display}`);

    if (project.kind === 'frontend') {
      await buildFrontendProject(project);
    } else {
      await buildScriptProject(project);
    }

    validateSingleFileOutput(project);
  }

  console.info(`[build] Completed ${projects.length} project(s).`);
}

main().catch(error => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});
