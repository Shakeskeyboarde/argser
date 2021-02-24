# Argser (argument-parser)

A miniscule arguments parser written in Typescript.

- [Example](#example)
- [Valued and Unvalued Options](#valued-and-unvalued-options)
- [Aliased Options](#aliased-options)
- [Repeatable Options](#repeatable-options)
- [Dashes](#dashes)
- [Errors](#errors)
- [Commands](#commands)
- [Arguments](#arguments)

## Example

You can run [./examples/cli.ts](./examples/cli.ts) on Mac or Linux by installing the [ts-node](https://www.npmjs.com/package/ts-node) package globally. On Windows, you will need to use the `ts-node` explicitly, by running `ts-node examples\cli.ts`.

```ts
#!/usr/bin/env ts-node-script
import argser from '../src';
import help from './help'; // Exports raw help text.

const args = process.argv.slice(2);
const [command, commandArgs] = argser.command(args, 'zip', 'zap');
const [options, err] = argser(commandArgs, {
  help: false, // Equivalent to { value: false }
  foo: { value: true, alias: 'f' },
  bar: { value: parseInt, many: true, alias: 'b' },
});

if (options.help || err) {
  console.error(help);

  if (err) {
    console.error();
    console.error(`${err}`);
    process.exitCode = 1;
  }
} else {
  console.log('Command:', command);
  console.log('Options:', options);
}
```

Example outputs from the above script:

```
$ ./examples/cli.ts --help
Usage:  ./cli.ts [command] [--foo=<string>] [--bar=<number>]
        ./cli.ts --help

An example command line utility.

Options:
  -f, --foo <string>  A string valued option.
  -b, --bar <number>  A repeatable number valued option.
  --help              Display this help message.

Commands:
  zip   An example command.
  zap   A second example command.
```

```
$ ./examples/cli.ts
Command: undefined
Options: { help: false, foo: undefined, bar: [], _: [] }
```

```
$ ./examples/cli.ts zip --foo=beep -b 1 -b 2 boop
Command: zip
Options: { help: false, foo: 'beep', bar: [ 1, 2 ], _: [ 'boop' ] }
```

## Valued and Unvalued Options

An option can be valued or unvalued depending on the `value` definition.

If the `value` definition is `true`, then the captured string is used as the option value as-is. The value can be transformed if the `value` definition is a function. The raw string value will be passed to the function, and its return value will be used as the final option value.

If the `value` definition is `false`, then the option is a "flag" and its value will be `true` if the option is present, or `false` if the option is not present.

```ts
argser({
  help: { value: false }, // Unvalued (boolean)
  message: { value: true }, // Valued (string | undefined)
  parsed: { value: parseInt }, // Valued (number | undefined)
})
```

If the option definition object only includes a `value` key, then the definition can be shortened to just the value of the `value` key.

```ts
argser({
  help: false, // Unvalued (boolean)
  message: true, // Valued (string | undefined)
  parsed: parseInt, // Valued (number | undefined)
})
```

## Aliased Options

An option can have a single alias using the `alias` definition. The option key will still be the name of the option, even if the alias is used in the arguments array.

```ts
argser({
  name: { alias: 'n' },
});
```

## Repeatable Options

An option can be repeatable using the `many` definition. A repeatable option value will always be an array. If a repeatable option does not exist in the arguments array, then the option value will be an empty array.

```ts
argser({
  name: { many: true },
});
```

## Dashes

Multi-character options _must_ start with two dashes (eg. `--name`). If an argument is a single dash followed by multiple characters (eg. `-abc`), it will be interpreted as _multiple single character options._ Common examples of this behavior are the `git -fdx` and `ls -al` commands.

The following argument arrays are equivalent, containing _three_ single character flags.

```
['-abc']
['-a', '-b', '-c']
```

For single dash arguments, _only the last option can require a value._ If any of the single character options before the last one require a value, an error will be returned. In the following example, the valued "c" option gets the value "foo", and the "a" and "b" options must be unvalued (flags).

```
['-abc=foo']
['-abc', 'foo']
```

### Double Dash Argument

Argument parsing stops when a double dash (`--`) argument is encountered. Any arguments after a double dash will be added to the underscore (`_`) key of the options object.

```
['--option', '--', '--underscore', '--values'];
```

## Errors

An error will be _returned_ in the following cases.

- An unknown option is encountered.
- No value is present for an option which requires a value.

Errors are returned instead of thrown to allow the partially parsed options object to be returned with the error, and to remove the necessity of a try/catch block. Parsing stops when an error occurs, and any remaining arguments (including the error argument) will be added to the options underscore (`_`) array. The returned error will have `arg` and `reason` properties to support custom messaging.

## Commands

The `argser.command` utility function extracts a command argument, returning a two value tuple: `[command, commandArgs]`.

If the first argument looks like a command, then the `command` value will be that first argument, and `commandArgs` will be the arguments array with the first command argument removed.

If the first argument does not look like a command, then the `command` value will be undefined, and `commandArgs` will be all of the original arguments.

```ts
// Accept any first argument that doesn't start with a dash.
const [command, commandArgs] = argser.command();

// Only accepts one of the given values (zip or zap).
const [command, commandArgs] = argser.command('zip', 'zap');
```

## Arguments

When passing in [process.argv](https://nodejs.org/docs/latest/api/process.html#process_process_argv), _make sure to remove the first two non-argument values_. These arguments are the node executable and the running script.

```ts
argser(process.argv.slice(2), { ... });
argser.command(process.argv.slice(2), ...);
```

Alternatively, omit the arguments array, in which case the default arguments array is `process.argv.slice(2)`.

```ts
argser({ ... });
argser.command(...);
```
