var yargs = require('yargs');
var argv = yargs
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
      require('./node_modules/postcss/package.json').version
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
  .argv;

if (!Array.isArray(argv.use)) {
  argv.use = [argv.use];
}

if (argv.map === 'file') {
  // treat `--map file` as `--no-map.inline`
  argv.map = { inline: false };
}

// load and configure plugin array
var plugins = argv.use.map(function(name) {
  var plugin = require(name);
  if (name in argv) {
    plugin = plugin(argv[name]);
  } else {
    plugin = plugin.postcss || plugin();
  }
  return plugin;
});

var commonOptions = ['syntax', 'parser', 'stringifier']
  .reduce(function(cso, opt) {
    if (argv[opt]) {
      cso[opt] = require(argv[opt]);
    }
    return cso;
  }, Object.create(null));


if ('map' in argv) {
  commonOptions.map = argv.map;
}

var async = require('neo-async');
var fs = require('fs');
var postcss = require('postcss');
var processor = postcss(plugins);

// this is where magic happens
processCSS(processor, argv._[0], argv.output, dumpErrors);

function processCSS(processor, input, output, fn) {
  function doProcess(css, fn) {
    var options = {
      from: input,
      to: output
    };

    Object.keys(commonOptions).forEach(function(opt) {
      options[opt] = commonOptions[opt];
    });

    processor
      .process(css, options)
      .then(function(result) { fn(null, result); })
      .catch(fn);
  }

  async.waterfall([
    async.apply(fs.readFile, input),
    doProcess,
    async.apply(dumpWarnings),
    async.apply(writeResult, output)
  ], fn);
}

function dumpWarnings(result, fn) {
  result.warnings().forEach(function(w) { console.warn(w.toString()); });
  fn(null, result);
}

function dumpErrors(err) {
  if (!err) {
    return;
  }
  if (err.message && typeof err.showSourceCode === 'function') {
    console.error(err.message, err.showSourceCode());
  } else {
    console.error(err);
  }
}

function writeResult (name, content, fn) {
  var funcs = [
    async.apply(fs.writeFile, name, content.css)
  ];
  if (content.map) {
    funcs.push(async.apply(fs.writeFile, name + '.map', content.map.toString()));
  }
  async.parallel(funcs, fn);
}
