const { mkdir, rm, readFileSync } = require('fs');
const { resolve } = require('path');
const { exec } = require('child_process');
const test = require('tape');

function c(strs) {
  return strs
    .map(s => s
      .replace('postcss',  resolve(__dirname, '../bin/postcss'))
      .replace(/fixtures|ref|_build/g, p => resolve(__dirname, p))
    )
    .join('');
}

function read(path) {
  return readFileSync(path, 'utf-8');
}

test('setup', function(t) {
  mkdir(c`_build`, { recursive: true }, t.end);
});

test('help', function(t) {
  exec(c`postcss --help`, function(err, stdout, stderr) {
    t.ifError(err);
    t.equal(stderr, '');
    t.ok(stdout.includes('Usage:'), 'help needs to include Usage');
    t.ok(stdout.includes('Options:'), 'help needs to include Options');
    t.ok(stdout.includes('Examples:'), 'help needs to include Examples');
    t.end();
  });
});

test('version', function(t) {
  exec(c`postcss --version`, function(err, stdout, stderr) {
    t.ifError(err);
    t.equal(stderr, '');
    t.ok(/postcss version: \d+\.\d+\.\d+/.test(stdout), 'version of postcss is displayed');
    t.end();
  });
});

test('warning', function(t) {
  const cmd = c`
    NODE_PATH=fixtures postcss --use dummy-plugin -o _build/warning.css fixtures/in-warning.css
  `;
  exec(cmd, function(err, stdout, stderr) {
    t.ifError(err);
    t.equal(stderr, c`dummy-plugin: fixtures/in-warning.css:1:1: Dummy warning\n`, 'should display warning');
    t.equal(stdout, '', 'should be empty');
    t.end();
  });
});

test('error', function(t) {
  const cmd = c`
    NODE_PATH=fixtures postcss \
      --use dummy-plugin \
      --dummy-plugin.fail=true \
      -o _build/invalid.css fixtures/in-force-error.css
  `;
  exec(cmd, function(err, stdout, stderr) {
    t.ok(err, 'should return error');
    t.equal(err.code, 1);
    t.equal(stderr, c`dummy-plugin: fixtures/in-force-error.css:1:1: Dummy error > 1 | a {
    | ^
  2 |   background: url(image.png);
  3 |   display: flex;
`
      , 'should display error');
    // t.equal(stdout, '', 'should be empty');
    t.end();
  });
});

test('source-maps-file', function(t) {
  const cmd = c`
    postcss -u postcss-url --postcss-url.url=rebase --map file -o _build/source-maps-file.css fixtures/in.css
  `;
  const expected = read(c`ref/source-maps-file.css`);
  const expectedMap = read(c`ref/source-maps-file.css.map`);
  exec(cmd, function(err, stdout, stderr) {
    t.ifError(err);
    t.equal(stderr, '', 'should be empty');
    t.equal(stdout, '', 'should be empty');

    const output = read(c`_build/source-maps-file.css`);
    t.equal(output, expected, 'css is compiled');

    const outputMap = read(c`_build/source-maps-file.css.map`);
    t.equal(outputMap, expectedMap, 'source map is emitted to a file');

    t.end();
  });
});

cliTest('opts', c`postcss --use -u postcss-url --postcss-url.url=rebase`);

cliTest('source-maps', c`postcss -u postcss-url --postcss-url.url=rebase --map`);

cliTest('config', c`postcss -u postcss-url -c fixtures/config.json`);

cliTest('config-all', c`postcss -c fixtures/config-all.json`);

cliTest('js-config', c`postcss -u postcss-url -c fixtures/config.js`);

cliTest('js-config-all', c`postcss -c fixtures/config-all.js`);


test('teardown', function(t) {
  rm(c`_build`, { recursive: true }, t.end);
});

function cliTest(name, cmd,
  inpath = c`fixtures/in.css`,
  outpath = c`_build/` + `${name}.css`,
  refpath = outpath.replace('_build', 'ref')
) {
  test(name, function(t) {
    const expected = read(refpath);
    exec(`${cmd} -o ${outpath} ${inpath}`,  function(err, stdout, stderr) {
      t.ifError(err);
      t.equal(stderr, '', 'stderr should be empty');
      t.equal(stdout, '', 'stdout should be empty');
      const output = read(outpath);
      t.equal(output, expected, 'css should be compiled');
      t.end();
    });
  });
}
