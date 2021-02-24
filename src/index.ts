import { ArgserError } from './ArgserError';

export type Definition =
  | boolean
  | ((value: string) => unknown)
  | { alias?: string; value?: true | false | ((value: string) => unknown); many?: boolean };

export type Definitions = Record<string, Definition>;

export type InferArgserOptions<TDefs extends Definitions> = TDefs extends Definitions
  ? {
      _: string[];
    } & {
      [P in Exclude<keyof TDefs, '_'>]: TDefs[P] extends false | { many?: false; value?: false }
        ? boolean
        : TDefs[P] extends true | { many?: false; value: true }
        ? string | undefined
        : TDefs[P] extends (value: string) => infer TValue
        ? TValue | undefined
        : TDefs[P] extends { many?: false; value: (value: string) => infer TValue }
        ? TValue | undefined
        : TDefs[P] extends { many: true; value?: false }
        ? boolean[]
        : TDefs[P] extends { many: true; value: true }
        ? string[]
        : TDefs[P] extends { many: true; value: (value: string) => infer TValue }
        ? TValue[]
        : never;
    }
  : never;

export type ArgserResult<TDefs extends Definitions> = [InferArgserOptions<TDefs>, Error | null];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type _ArgserOptions = Record<string, any>;
type _ArgserResult = [_ArgserOptions, Error | null];
type _ArgserParams<TDefs extends Definitions> = [TDefs] | [string[], TDefs];

export default function argser<TDefs extends Definitions>(definitions: TDefs): ArgserResult<TDefs>;
export default function argser<TDefs extends Definitions>(args: string[], definitions: TDefs): ArgserResult<TDefs>;
export default function argser<TDefs extends Definitions>(...params: _ArgserParams<TDefs>): _ArgserResult {
  const [args, definitions] =
    params.length === 1
      ? [process.argv.slice(2), params[0]]
      : ([params[0].slice(), params[1]] as [(string | undefined)[], TDefs]);
  const _: string[] = [];
  const options: _ArgserOptions = {};
  const names = new Map<string, string>();
  const parsers = new Map<string, (value: string) => unknown>();
  const arrays = new Set<string>();

  Object.entries(definitions).forEach(([name, spec]) => {
    if (name === '_') {
      return;
    }

    const { alias = undefined, value = false, many = false } = typeof spec === 'object' ? spec : { value: spec };

    options[name] = many ? [] : value ? undefined : false;
    names.set(name, name);
    if (alias && alias !== '_') names.set(alias, name);
    if (value) parsers.set(name, value === true ? (v) => v : value);
    if (many) arrays.add(name);
  });

  while (args.length) {
    const arg = args.shift();

    if (arg == null) {
      continue;
    } else if (arg === '--') {
      break;
    }

    const match = arg.match(/^(-{1,2})(.+?)(?:=(.*))?$/)?.slice(1) as null | [string, string, string?];

    if (!match) {
      _.push(arg);
      continue;
    }

    const [matchDashes, matchName, matchValue] = match;

    // Split single hyphen, multi-character options into individual
    // single character arguments, with the value (if there is one)
    // attached to the last option.
    if (matchDashes === '-' && matchName.length > 1) {
      const last = matchName.length - 1;

      args.unshift(
        ...matchName.split('').reduce<(string | undefined)[]>((acc, char, i) => {
          return [...acc, `-${char}`, ...(i < last ? [undefined] : matchValue != null ? [matchValue] : [])];
        }, []),
      );

      continue;
    }

    const name = names.get(matchName);

    if (name == null) {
      return [{ ...options, _: [..._, arg, ...args] }, new ArgserError(arg, 'unknown')];
    }

    const parser = parsers.get(name);
    let value: unknown;

    if (parser) {
      const rawValue = matchValue ?? (args[0] !== '--' ? args.shift() : undefined);

      if (rawValue == null) {
        return [{ ...options, _: [..._, arg, ...args] }, new ArgserError(arg, 'incomplete')];
      }

      value = parser(rawValue);
    } else {
      value = true;
    }

    if (arrays.has(name)) {
      options[name].push(value);
    } else {
      options[name] = value;
    }
  }

  return [{ ...options, _: [..._, ...args] }, null];
}

type _CommandResult<TCommand extends string = string> = [TCommand | undefined, string[]];
type _CommandParams = [string[], ...string[]] | string[];

function command(): _CommandResult;
function command(args: string[]): _CommandResult;
function command<TCommand extends string>(...commands: TCommand[]): _CommandResult<TCommand>;
function command<TCommand extends string>(args: string[], ...commands: TCommand[]): _CommandResult<TCommand>;
function command<TCommand extends string>(...params: _CommandParams): _CommandResult<TCommand> {
  const [args, ...commands] =
    params[0] instanceof Array ? (params as [string[], ...string[]]) : [process.argv.slice(2), ...(params as string[])];

  return (commands.length === 0 && args[0]?.[0] !== '-') || commands.indexOf(args[0]) >= 0
    ? [args[0] as TCommand, args.slice(1)]
    : [undefined, args];
}

argser.command = command;

export { command };
