export type Definitions = Record<
  string,
  | boolean
  | ((value: string) => unknown)
  | { alias?: string; value?: true | false | ((value: string) => unknown); many?: boolean }
>;

export type Result<TDefs> = TDefs extends Definitions
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

export default function argser<TDefs extends Definitions>(options: TDefs): Result<TDefs>;
export default function argser<TDefs extends Definitions>(args: string[], options: TDefs): Result<TDefs>;
export default function argser<TDefs extends Definitions>(...params: [TDefs] | [string[], TDefs]): Result<TDefs> {
  const [args, options] = params.length === 1 ? [process.argv.slice(2), params[0]] : [params[0].slice(), params[1]];
  const result: Record<string, unknown> = { _: [] };
  const names = new Map<string, string>();
  const parsers = new Map<string, (value: string) => unknown>();
  const arrays = new Set<string>();

  Object.entries(options).forEach(([name, spec]) => {
    if (name === '_') {
      return;
    }

    const { alias = undefined, value = false, many = false } = typeof spec === 'object' ? spec : { value: spec };

    result[name] = many ? [] : value ? undefined : false;
    names.set(name, name);
    if (alias && alias !== '_') names.set(alias, name);
    if (value) parsers.set(name, value === true ? (v) => v : value);
    if (many) arrays.add(name);
  });

  let arg: string | undefined;

  while (null != (arg = args.shift())) {
    if (arg === '--') {
      break;
    }

    const match = arg.match(/^-+(.+?)(?:=(.*))?$/)?.slice(1) as null | [string, string?];

    if (!match) {
      (result._ as unknown[]).push(arg);
      continue;
    }

    const name = names.get(match[0]);

    if (name == null) {
      throw Error(`Unknown argument: ${arg}`);
    }

    const parser = parsers.get(name);
    let value: unknown;

    if (parser) {
      const string = match[1] ?? args.shift();

      if (string == null) {
        throw Error(`Value required for argument: ${arg}`);
      }

      value = parser(string);
    } else {
      value = true;
    }

    if (arrays.has(name)) {
      (result[name] as unknown[]).push(value);
    } else {
      result[name] = value;
    }
  }

  result._ = [...(result._ as unknown[]), ...args];

  return result as Result<TDefs>;
}
