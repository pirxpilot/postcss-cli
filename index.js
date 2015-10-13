var globby = require("globby");
var argv = require("yargs")
  .usage('Usage: $0 -use plugin [--config|-c config.json] [--output|-o output.css] [input.css]')
  .example('postcss --use autoprefixer -c options.json -o screen.css screen.css',
    'Use autoprefixer as a postcss plugin')
  .example('postcss --use autoprefixer --autoprefixer.browsers "> 5%" -o screen.css screen.css',
    'Pass plugin parameters in plugin.option notation')
  .example('postcss -u postcss-cachify -u autoprefixer -d build *.css',
    'Use multiple plugins and multiple input files')
  .config('c')
  .alias('c', 'config')
  .describe('c', 'JSON file with plugin configuration')
  .default('c', 'postcss.json')
  .alias('u', 'use')
  .describe('u', 'postcss plugin name (can be used multiple times)')
  .alias('i', 'input')
  .alias('o', 'output')
  .describe('o', 'Output file (stdout if not provided)')
  .alias('d', 'dir')
  .describe('d', 'Output directory')
  .boolean('r')
  .alias('r', 'replace')
  .describe('r', 'Replace input file(s) with generated output')
  .alias('s', 'syntax')
  .describe('s', 'Alternative input syntax parser')
  .alias('p', 'parser')
  .describe('p', 'Alternative CSS parser')
  .alias('t', 'stringifier')
  .describe('t', 'Alternative output stringifier')
  .alias('w', 'watch')
  .describe('w', 'auto-recompile when detecting source changes')
  .requiresArg(['u', 'c', 'i', 'o', 'd', 's', 'p', 't'])
  .version(function() {
    return [
      'postcss version',
      require('./node_modules/postcss/package.json').version
    ].join(' ');
  }, 'v')
  .alias('v', 'version')
  .help('h')
  .alias('h', 'help')
  .check(function(argv) {
    if (!argv.use) {
      throw 'Please specify at least one plugin name.';
    }
    if (argv._.length && argv.input) {
      throw 'Both positional arguments and --input option used for `input file`: please only use one of them.';
    }
    if (argv.output && argv.dir && argv.replace) {
      throw '`output file`, `output directory` and `replace` provided: please use either --output, --dir or --replace option only.';
    }
    if (argv.output && argv.dir) {
      throw 'Both `output file` and `output directory` provided: please use either --output or --dir option.';
    }
    if (argv.output && argv.replace) {
      throw 'Both `output file` and `replace` provided: please use either --output or --replace option.';
    }
    if (argv.dir && argv.replace) {
      throw 'Both `output directory` and `replace` provided: please use either --dir or --replace option.';
    }
    return true;
  })
  .argv;

if (!Array.isArray(argv.use)) {
  argv.use = [argv.use];
}

var inputFiles = globby.sync(argv._);
if (!inputFiles.length) {
  if (argv.input) {
    inputFiles = Array.isArray(argv.input) ? argv.input : [argv.input];
  } else { // use stdin if nothing else is specified
    inputFiles = [undefined];
  }
}
if (inputFiles.length > 1 && !argv.dir && !argv.replace) {
  throw 'Please specify either --replace or --dir [output directory] for your files';
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

var customSyntaxOptions = ['syntax', 'parser', 'stringifier']
  .reduce(function(cso, opt) {
    if (argv[opt]) {
      cso[opt] = require(argv[opt]);
    }
    return cso;
  }, Object.create(null));

var async = require('neo-async');
var fs = require('fs');
var readFile = require('read-file-stdin');
var path = require('path');
var postcss = require('postcss');
var processor = postcss(plugins);

if (argv.watch) {
  var watchedFiles = inputFiles;
  var watcher = require('chokidar').watch(watchedFiles);
  watcher.on('change', function() { // TODO: support for "add", "unlink" etc.?
    async.forEach(inputFiles, compile, function(err) {
      return onError.call(this, err, true);
    });
  });

  global.watchCSS = function(files) { // jshint ignore:line
    watcher.unwatch(watchedFiles);
    watcher.add(files);
    watchedFiles = files;
  };
} else {
  global.watchCSS = function() {}; // jshint ignore:line
}
async.forEach(inputFiles, compile, onError);


function compile(input, fn) {
  var output = argv.output;
  if (argv.dir) {
    output = path.join(argv.dir, path.basename(input));
  } else if (argv.replace) {
    output = input;
  }
  processCSS(processor, input, output, fn);
}

function processCSS(processor, input, output, fn) {
  function doProcess(css, fn) {
    function onResult(result) {
      if (typeof result.warnings === 'function') {
        result.warnings().forEach(console.error);
      }
      fn(null, result.css);
    }

    var options = {
      from: input,
      to: output
    };

    Object.keys(customSyntaxOptions).forEach(function(opt) {
      options[opt] = customSyntaxOptions[opt];
    });

    var result = processor.process(css, options);
    if (typeof result.then === 'function') {
      result.then(onResult).catch(fn);
    } else{
      process.nextTick(onResult.bind(null, result));
    }
  }

  async.waterfall([
    async.apply(readFile, input),
    doProcess,
    async.apply(writeFile, output)
  ], fn);
}

function onError(err, keepAlive) { // XXX: avoid overloaded signature?
  if (err) {
    if (err.message && typeof err.showSourceCode === 'function') {
      console.error(err.message, err.showSourceCode());
    } else {
      console.error(err);
    }
    if (!keepAlive) {
      process.exit(1);
    }
  }
}

function writeFile(name, content, fn) {
  if (!name) {
    process.stdout.write(content);
    return fn();
  }
  fs.writeFile(name, content, fn);
}
