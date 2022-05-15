const { waterfall, parallel } = require('async');
const { readFile, writeFile } = require('fs');
const postcss = require('postcss');

module.exports = run;

function run(argv, fn) {

  // load and configure plugin array
  const plugins = argv.use.map(name => {
    let plugin = require(name);
    if (name in argv) {
      plugin = plugin(argv[name]);
    } else if (plugin.postcss) {
      plugin = plugin();
    }
    return plugin;
  });

  const commonOptions = [
    'syntax',
    'parser',
    'stringifier'
  ].reduce((cso, opt) => {
    if (argv[opt]) {
      cso[opt] = require(argv[opt]);
    }
    return cso;
  }, Object.create(null));

  if ('map' in argv) {
    commonOptions.map = argv.map;
  }

  const processor = postcss(plugins);
  const from = argv._[0];
  const to = argv.output;

  // this is where magic happens
  processCSS(processor, { from, to, commonOptions }, err => {
    if (err) dumpErrors(err);
    fn(err ? 1 : 0);
  });
}

function processCSS(processor, { from, to, commonOptions }, fn) {

  function doProcess(css, fn) {
    const options = Object.assign({ from, to }, commonOptions);

    processor
      .process(css, options)
      .then(result => fn(null, result))
      .catch(fn);
  }

  waterfall([
    fn => readFile(from, fn),
    doProcess,
    (result, fn) => dumpWarnings(result, fn),
    (result, fn) => writeResult(to, result, fn)
  ], fn);
}

function dumpWarnings(result, fn) {
  result.warnings().forEach(w => console.warn(w.toString()));
  fn(null, result);
}

function dumpErrors(err) {
  if (err.message && typeof err.showSourceCode === 'function') {
    console.error(err.message, err.showSourceCode());
  } else {
    console.error(err);
  }
}

function writeResult(name, { css, map }, fn) {
  const funcs = [
    fn => writeFile(name, css, fn)
  ];
  if (map) {
    funcs.push(
      fn => writeFile(`${name}.map`, map.toString(), fn)
    );
  }
  parallel(funcs, fn);
}
