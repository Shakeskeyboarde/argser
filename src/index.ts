type NanoArgsOptions = Record<
  string,
  | boolean
  | ((value: string) => unknown)
  | { alias?: string; value?: true | false | ((value: string) => unknown); many?: boolean }
>;

type NanoArgsResult<TOptions> = TOptions extends NanoArgsOptions
  ? {
      _: string[];
    } & {
      [P in Exclude<keyof TOptions, '_'>]: TOptions[P] extends false | { many?: false; value?: false }
        ? boolean
        : TOptions[P] extends true | { many?: false; value: true }
        ? string | undefined
        : TOptions[P] extends (value: string) => infer TValue
        ? TValue | undefined
        : TOptions[P] extends { many?: false; value: (value: string) => infer TValue }
        ? TValue | undefined
        : TOptions[P] extends { many: true; value?: false }
        ? boolean[]
        : TOptions[P] extends { many: true; value: true }
        ? string[]
        : TOptions[P] extends { many: true; value: (value: string) => infer TValue }
        ? TValue[]
        : never;
    }
  : never;

export default function nanoargs<TOptions extends NanoArgsOptions>(options: TOptions): NanoArgsResult<TOptions>;
export default function nanoargs<TOptions extends NanoArgsOptions>(
  args: string[],
  options: TOptions,
): NanoArgsResult<TOptions>;
export default function nanoargs<TOptions extends NanoArgsOptions>(
  ...params: [TOptions] | [string[], TOptions]
): NanoArgsResult<TOptions> {
  const [args, options] = params.length === 1 ? [process.argv.slice(2), params[0]] : [params[0].slice(), params[1]];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = { _: [] as string[] };
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
      result._.push(arg);
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
      result[name].push(value);
    } else {
      result[name] = value;
    }
  }

  result._ = [...result._, ...args];

  return result as NanoArgsResult<TOptions>;
}
