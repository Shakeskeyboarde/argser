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
