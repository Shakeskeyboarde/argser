# Argser (arg-parser)

A miniscule arguments parser written in Typescript.

- [Basic Usage](#basic-usage)
- [Aliased Options](#aliased-options)
- [Repeatable Options](#repeatable-options)
- [Errors](#errors)
- [Commands](#commands)
- [Arguments Array](#arguments-array)
- [Help/Usage Text](#helpusage-text)

## Basic Usage

The default export `argser` function accepts an optional arguments array and a map of option definitions. It returns a map of values parsed from the arguments array.

```ts
import argser from 'argser';

const [options, err] = argser(['--flag', '--string=a', '--integer=1'], {
  flag: false,
  string: true,
  integer: parseInt,
});
```

The returned `options` options map would be...

```ts
{
  _: [],
  flag: true,
  string: 'a',
  integer: 1,
}
```

See the [Errors](#errors) section for an explanation of the returned `err` value.

## Aliased Options

Options can have a single alias using the `alias` definition. The options keys will still be the full name of the option, even if the alias is used in the arguments array.

```ts
argser(process.argv.slice(2), {
  flag: { value: false, alias: 'f' },
  string: { value: true, alias: 's' },
  integer: { value: parseInt, alias: 'i' },
});
```

## Repeatable Options

Options can be repeatable using the `many` definition. A repeatable option value will always be an array. If a repeatable option does not exist in the arguments array, then the option value will be an empty array.

```ts
argser(process.argv.slice(2), {
  flag: { value: false, many: true },
  string: { value: true, many: true },
  integer: { value: parseInt, many: true },
});
```

## Errors

An error will be _returned_ in the following cases.

- An undefined option is encountered.
- No value is present for an option which requires a value.

Errors are returned instead of thrown to allow the partially parsed options object to be returned with the error, and to remove the necessity of a try/catch block. Parsing stops when an error occurs, and any remaining arguments (including the error argument) will be added to the options underscore (`_`) array. The returned error will have `arg` and `reason` properties to support custom messaging.

## Commands

The `argser.command` function accepts an optional arguments array, and a variable number of command names. If the first arg matches one of the command names, it returns the matched command name, and an arguments array with the command removed.

```ts
const [command, commandArgs] = argser.command(['foo', '--help'], 'foo');
```

The above `command` value would be `"foo"`, and the `commandArgs` value would be `["--help"]`.

If no command is matched, then `command` would be `undefined`, and `commandArgs` would include _all_ of the original arguments.

## Arguments Array

When passing in [process.argv](https://nodejs.org/docs/latest/api/process.html#process_process_argv), make sure to remove the first two _non-argument_ values.

```ts
argser(process.argv.slice(2), { ... });
argser.command(process.argv.slice(2), ...);
```

Alternatively, omit the arguments array, in which case the default arguments array is `process.argv.slice(2)`.

```ts
argser({ ... });
argser.command(...);
```

## Help/Usage Text

Generating and printing help and usage text isn't an included feature. I recommend simply writing a `usage.ts` file which exports a default usage string value, and then printing the string as necessary. Most terminals will be at least 80 characters wide, so it's a good idea to manually hard wrap at about that width.

```ts
export default `
Usage:  my-cli [options]
        my-cli --version
        my-cli --help

My cool CLI that does cool things.

Options:
  -f, --foo <value>   Foos are the best.
  -b, --bar           Bars are okay too.
  --version           Print the current version.
  --help              Print this help text.
`.trim();
```
