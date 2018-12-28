const yargsParser = require('yargs-parser');

module.exports = parse;

const parserConfig = {
  alias: {
    config: 'c',
    use: 'u',
    output: 'o',
    map: 'm',
    syntax: 's',
    parser: 'p',
    stringifier: 't',
    version: 'v',
    help: 'h',
  },
  array: [ 'use' ],

  config: 'config',

  nargs: {
    config: 1,
    use: 1,
    output: 1,
    syntax: 1,
    parser: 1,
    stringifier: 1,
  },

  boolean: ['version', 'help'],

  coerce: {
    map: v => v === 'file' ? { inline: false } : v
  }
};

function version() {
  const { version } = require('postcss/package.json');
  return `postcss version: ${ version }`;
}

function usage() {
  return `
Usage:
  node_modules/.bin/postcss -use plugin [--config|-c config.json] [--output|-o output.css] input.css

Options:
  -c, --config       JSON file with plugin configuration
  -u, --use          postcss plugin name (can be used multiple times)
  -o, --output       Output file
  -m, --map          Source map
  -s, --syntax       Alternative input syntax parser
  -p, --parser       Alternative CSS parser
  -t, --stringifier  Alternative output stringifier
  -v, --version      Show version number
  -h, --help         Show help

Examples:

# use autoprefixer as a postcss plugin:
postcss --use autoprefixer -c options.json -o screen.css screen.css

# pass plugin parameters in plugin.option notation
postcss --use autoprefixer --autoprefixer.browsers "> 5%" -o screen.css screen.css
`;
}

function parse(args = process.argv.slice(2)) {
  let argv = yargsParser(args, parserConfig);

  if (argv.version) {
    console.log(version());
    return 0;
  }

  if (argv.help) {
    console.log(usage());
    return 0;
  }

  if (!argv.use) {
    console.log(usage());
    console.error('Please specify at least one plugin name.');
    return 1;
  }

  if (argv._.length !== 1) {
    console.log(usage());
    console.error('Please specify a single input file.');
    return 1;
  }

  return argv;
}

