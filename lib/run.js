const { readFile, writeFile } = require('node:fs/promises');
const postcss = require('postcss');

module.exports = run;

async function run(argv) {
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

  const commonOptions = ['syntax', 'parser', 'stringifier'].reduce((cso, opt) => {
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

  try {
    // this is where magic happens
    const css = await readFile(from);
    const result = await processor.process(css, { from, to, ...commonOptions });
    result.warnings().forEach(w => console.warn(w.toString()));
    await writeResult(to, result);
    return 0;
  } catch (err) {
    dumpErrors(err);
    return 1;
  }
}

function writeResult(name, { css, map }) {
  const tasks = [writeFile(name, css)];
  if (map) {
    tasks.push(writeFile(`${name}.map`, map.toString()));
  }
  return Promise.all(tasks);
}

function dumpErrors(err) {
  if (err.message && typeof err.showSourceCode === 'function') {
    console.error(err.message, err.showSourceCode());
  } else {
    console.error(err);
  }
}
