# nanoargs

Miniscule args parser written in Typescript.

## Getting Started

The package only exports a single function. This function accepts a map of expected option definitions.

```ts
import nanoargs from 'nanoargs';

const args = ['--flag', '--string=foo', '--integer', '123', '--example=1', '-e', '2'];
const result = nanoargs(args, {
  // A flag (--flag or -f), accepting no value.
  flag: { alias: 'f' },
  // A string option (--string), accepting one value.
  string: { value: true },
  // An integer option (--integer), parsed using `parseInt`.
  integer: { value: parseInt },
  // An integer option (--example or -e), parsed using `parseInt`,
  // repeatable to add values to the result array.
  example: { alias: 'e', value: parseInt, many: true }
});
```

The `typeof result` would be...

```ts
type Result = {
  flag: boolean;
  string: string | undefined;
  integer: number | undefined;
  example: number[];
  _: string[];
};
```

The result value would be...

```ts
{
  flag: true,
  string: 'foo',
  integer: 123,
  example: [1, 2],
  _: []
}
```

## Option Definition Shorthand

For options with only a `value` definition, you can shorten the definition to just the value of the `value` definition.

```ts
nanoargs({
  flag: false, // Same as {} or { value: false }
  string: true, // Same as { value: true }
  integer: parseInt // Same as { value: parseInt }
});
```

## Using Process Arguments

When passing in [process.argv](https://nodejs.org/docs/latest/api/process.html#process_process_argv), make sure to remove the first two non-argument values.

```ts
nanoargs(process.argv.slice(2), {
  // Option definitions...
});
```

You can also just omit the first argument, in which case the default arguments array is `process.argv.slice(2)`.

```ts
nanoargs({
  // Options definitions...
})
```

## Errors

Errors will be thrown in the following cases.

- An undefined option is encountered.
- No value is present for an option which expects a value.

## Help/Usage Text

Generating and printing help and usage text isn't an included feature. I recommend simply writing a `usage.ts` file which exports a default usage string value, and then printing the string as necessary. Most terminals will be at least 80 characters wide, so it's a good idea to manually hard wrap at about that width.

```ts
export default `
Usage:  my-cli [options]
        my-cli --help

My cool CLI that does cool things.

Options:
  -f, --foo <value>   Foos are the best.
  -b, --bar           Bars are okay too.
  --version           Print the current version.
  --help              Print this help text.
`.trim();
```
