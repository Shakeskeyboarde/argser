export default `
Usage:  ./cli.ts [command] [options]
        ./cli.ts --help

An example command line utility.

Options:
  -f, --foo <string>  A string valued option.
  -b, --bar <number>  A repeatable number valued option.
  --help              Display this help message.

Commands:
  zip   An example command.
  zap   A second example command.
`.trim();
