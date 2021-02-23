# Argser (argument-parser)

A miniscule arguments parser written in Typescript.

- [Basic Usage](#basic-usage)
- [Aliased Options](#aliased-options)
- [Repeatable Options](#repeatable-options)
- [Arguments Format](#arguments-format)
- [Errors](#errors)
- [Commands](#commands)
- [Process Arguments](#process-arguments)
- [Help Text](#help-text)

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

The returned `options` object would be as follows:

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

## Arguments Format

Option name arguments can start with any number of hyphens, and option values can be space or equal (`=`) separated. Using single hyphens and space value separation for single character options, is _purely by convention_ and not enforced.

The following argument arrays are all equivalent:

```ts
['--name=value']
['--name', 'value']
['-name=value']
['-name', 'value']
['-----name', 'value']
```

### Double Dash

Argument parsing stops when a double dash (`--`) is encountered. Any arguments after a double dash will be added to the underscore (`_`) key of the options object.

```ts
['--option', '--', '--underscore', '--values']
```

## Errors

An error will be _returned_ in the following cases.

- An undefined option is encountered.
- No value is present for an option which requires a value.

Errors are returned instead of thrown to allow the partially parsed options object to be returned with the error, and to remove the necessity of a try/catch block. Parsing stops when an error occurs, and any remaining arguments (including the error argument) will be added to the options underscore (`_`) array. The returned error will have `arg` and `reason` properties to support custom messaging.

## Commands

The `argser.command` function accepts an optional arguments array, and a variable number of command names. If the first argument matches one of the command names, it returns the matched command name, and an arguments array with the command removed.

```ts
const [command, commandArgs] = argser.command(['foo', '--help'], 'foo');
```

The above `command` value would be `"foo"`, and the `commandArgs` value would be `["--help"]`.

If no command is matched, then `command` would be `undefined`, and `commandArgs` would include _all_ of the original arguments.

## Process Arguments

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

## Help Text

Generating and printing help text isn't an included feature. I recommend simply writing a `help.ts` file which exports a default string value, and then printing the string as necessary. Most terminals will be at least 80 characters wide, so it's a good idea to manually hard wrap at about that width.

```tsx
export default `
Usage:  my-cli [--help]

A description of what this thing does.

Options:
  --help  Print this help text.
`.trim();
```

### Help Example

The following example shows how you might implement a help flag, and also handle argument errors, by printing the help text.

```ts
import argser from 'argser';
import help from './help';

const [options, err] = argser({
  help: false,
});

if (options.help || err) {
  console.error(help);

  if (err) {
    console.error();
    console.error(`${err}`);
    process.exitCode = 1;
  }
} else {
  // Implementation...
}
```
