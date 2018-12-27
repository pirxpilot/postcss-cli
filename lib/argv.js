const yargs = require('yargs');

module.exports = parse;

function parse(options = process.argv.slice(2)) {
  let argv = yargs
  .usage('Usage: $0 -use plugin [--config|-c config.json] [--output|-o output.css] [input.css]')
  .example('postcss --use autoprefixer -c options.json -o screen.css screen.css',
    'Use autoprefixer as a postcss plugin')
  .example('postcss --use autoprefixer --autoprefixer.browsers "> 5%" -o screen.css screen.css',
    'Pass plugin parameters in plugin.option notation')
  .config('c')
  .alias('c', 'config')
  .describe('c', 'JSON file with plugin configuration')
  .alias('u', 'use')
  .describe('u', 'postcss plugin name (can be used multiple times)')
  .alias('o', 'output')
  .describe('o', 'Output file')
  .alias('m', 'map')
  .describe('m', 'Source map')
  .alias('s', 'syntax')
  .describe('s', 'Alternative input syntax parser')
  .alias('p', 'parser')
  .describe('p', 'Alternative CSS parser')
  .alias('t', 'stringifier')
  .describe('t', 'Alternative output stringifier')
  .requiresArg(['u', 'c', 'o', 's', 'p', 't'])
  .version(function() {
    return [
      'postcss version',
      require('../node_modules/postcss/package.json').version
    ].join(' ');
  }, 'v')
  .alias('v', 'version')
  .help('h')
  .alias('h', 'help')
  .demand(1, 1, 'Please specify a single input file.')
  .check(function(argv) {
    if (!argv.use) {
      throw 'Please specify at least one plugin name.';
    }
    return true;
  })
  .wrap(Math.max(yargs.terminalWidth() - 5, 60))
  .parse(options);

  if (!Array.isArray(argv.use)) {
    argv.use = [argv.use];
  }

  if (argv.map === 'file') {
    // treat `--map file` as `--no-map.inline`
    argv.map = { inline: false };
  }

  return argv;
}

