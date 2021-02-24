/* eslint-disable @typescript-eslint/no-explicit-any */

import { ArgserError } from './ArgserError';

export type Definition =
  | boolean
  | ((value: string) => unknown)
  | { alias?: string; value?: true | false | ((value: string) => unknown); many?: boolean };

export type Definitions = Record<string, Definition>;

export type InferOptions<TDefs extends Definitions> = TDefs extends Definitions
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

export type Result<TDefs extends Definitions> = [InferOptions<TDefs>, Error | null];

export default function argser<TDefs extends Definitions>(definitions: TDefs): Result<TDefs>;
export default function argser<TDefs extends Definitions>(args: string[], definitions: TDefs): Result<TDefs>;
export default function argser<TDefs extends Definitions>(
  ...params: [TDefs] | [string[], TDefs]
): [Record<string, any>, Error | null] {
  const [args, definitions] = params.length === 1 ? [process.argv.slice(2), params[0]] : [params[0].slice(), params[1]];
  const _: string[] = [];
  const options: Record<string, any> = {};
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

  let arg: string | undefined;

  while (null != (arg = args.shift()) && arg !== '--') {
    const match = arg.match(/^-+(.+?)(?:=(.*))?$/)?.slice(1) as null | [string, string?];

    if (!match) {
      _.push(arg);
      continue;
    }

    const name = names.get(match[0]);

    if (name == null) {
      _.push(arg, ...args);
      return [options, new ArgserError(arg, 'unknown')];
    }

    const parser = parsers.get(name);
    let value: unknown;

    if (parser) {
      const string = match[1] ?? (args[0] !== '--' ? args.shift() : undefined);

      if (string == null) {
        _.push(arg, ...args);
        return [options, new ArgserError(arg, 'incomplete')];
      }

      value = parser(string);
    } else {
      value = true;
    }

    if (arrays.has(name)) {
      options[name].push(value);
    } else {
      options[name] = value;
    }
  }

  _.push(...args);
  options._ = _;

  return [options, null];
}

function command(): [string | undefined, string[]];
function command(args: string[]): [string | undefined, string[]];
function command<TCommand extends string>(...commands: TCommand[]): [TCommand | undefined, string[]];
function command<TCommand extends string>(args: string[], ...commands: TCommand[]): [TCommand | undefined, string[]];
function command<TCommand extends string>(
  ...params: [string[], ...string[]] | string[]
): [TCommand | undefined, string[]] {
  const [args, commands] = (params[0] instanceof Array
    ? [params[0].slice(), params.slice(1)]
    : [process.argv.slice(2), params]) as [string[], string[]];

  return commands.indexOf(args[0]) >= 0 ? [args[0] as TCommand, args.slice(1)] : [undefined, args];
}

argser.command = command;

export { command };
