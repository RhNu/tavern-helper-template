import type { BuildKind, BuildMode, BuildOptions } from './types.ts';

const modes = new Set<BuildMode>(['production', 'development']);
const kinds = new Set<BuildKind>(['scripts', 'plugins']);

const helpText = `
Usage:
  node tools/build.ts [mode]
  node tools/build.ts [options]

Options:
  --mode <production|development>  Set build mode.
  --kind <scripts|plugins>          Limit project kind. Repeatable.
  --target <dir>                    Build a project directory. Repeatable.
  --watch                           Watch source directories and rebuild.
  --verbose                         Print detailed build logs.
  --no-cache                        Disable cache reads and writes.
  --clear-cache                     Remove .cache/build before building.
  --help                            Show this help text.

Examples:
  node tools/build.ts --mode production
  node tools/build.ts development --kind scripts
  node tools/build.ts --target scripts/Notifier --target plugins/example
  node tools/build.ts --watch --mode development
`.trim();

function valueAfter(argv: string[], index: number, option: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`[build] Missing value for '${option}'.`);
  return value;
}

function parseMode(value: string): BuildMode {
  if (!modes.has(value as BuildMode)) throw new Error(`[build] Unsupported mode '${value}'.`);
  return value as BuildMode;
}

function parseKind(value: string): BuildKind {
  if (!kinds.has(value as BuildKind)) throw new Error(`[build] Unsupported kind '${value}'.`);
  return value as BuildKind;
}

export function parseBuildOptions(argv: string[]): BuildOptions {
  const options: BuildOptions = {
    mode: 'production',
    kinds: [],
    targets: [],
    verbose: false,
    useCache: true,
    clearCache: false,
    watch: false,
    help: false,
  };
  let positionalModeConsumed = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument === '--verbose') options.verbose = true;
    else if (argument === '--no-cache') options.useCache = false;
    else if (argument === '--clear-cache') options.clearCache = true;
    else if (argument === '--watch') options.watch = true;
    else if (argument.startsWith('--mode=')) options.mode = parseMode(argument.slice(7));
    else if (argument === '--mode') options.mode = parseMode(valueAfter(argv, index++, '--mode'));
    else if (argument.startsWith('--kind=')) options.kinds.push(parseKind(argument.slice(7)));
    else if (argument === '--kind') options.kinds.push(parseKind(valueAfter(argv, index++, '--kind')));
    else if (argument.startsWith('--target=')) options.targets.push(argument.slice(9));
    else if (argument === '--target') options.targets.push(valueAfter(argv, index++, '--target'));
    else if (argument.startsWith('--')) throw new Error(`[build] Unknown option '${argument}'.`);
    else if (!positionalModeConsumed && modes.has(argument as BuildMode)) {
      options.mode = parseMode(argument);
      positionalModeConsumed = true;
    } else throw new Error(`[build] Unexpected positional argument '${argument}'.`);
  }

  options.kinds = [...new Set(options.kinds)];
  options.targets = [...new Set(options.targets.filter(Boolean))];
  if (options.watch && options.mode === 'production') options.mode = 'development';
  return options;
}

export function getBuildHelpText(): string {
  return helpText;
}
