var argv = require('./lib/argv')();

if (typeof argv === 'number') {
  process.exit(argv);
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

var async = require('async');
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
