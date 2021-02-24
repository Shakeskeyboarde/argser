#!/usr/bin/env ts-node-script
import argser from '../src';
import help from './help'; // Exports raw help text.

const [command, commandArgs] = argser.command(process.argv.slice(2), 'zip', 'zap');
const [options, err] = argser(commandArgs, {
  help: false, // Equivalent to { value: false }
  foo: { value: true, alias: 'f' },
  bar: { value: parseInt, many: true, alias: 'b' },
});

if (options.help || err) {
  console.error(help);
  console.error();

  if (err) {
    console.error(`${err}`);
    process.exitCode = 1;
  }
} else {
  console.log('Command:', command);
  console.log('Options:', options);
}
