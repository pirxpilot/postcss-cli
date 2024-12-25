const test = require('node:test');
const assert = require('node:assert/strict');

const { promisify } = require('node:util');
const { exec: execCB } = require('node:child_process');
const { mkdir, rm, readFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const exec = promisify(execCB);

function c(strs) {
  return strs
    .map(s => s
      .replace('postcss', resolve(__dirname, '../bin/postcss'))
      .replace(/fixtures|ref|_build/g, p => resolve(__dirname, p))
    )
    .join('');
}

function read(path) {
  return readFile(path, 'utf-8');
}

test('cmd', async function (t) {

  t.before(function () {
    return mkdir(c`_build`, { recursive: true });
  });

  t.after(function () {
    return rm(c`_build`, { recursive: true });
  });

  await t.test('help', async function () {
    const { stdout, stderr } = await exec(c`postcss --help`);
    assert.equal(stderr, '');
    assert.ok(stdout.includes('Usage:'), 'help needs to include Usage');
    assert.ok(stdout.includes('Options:'), 'help needs to include Options');
    assert.ok(stdout.includes('Examples:'), 'help needs to include Examples');
  });

  await t.test('version', async function () {
    const { stdout, stderr } = await exec(c`postcss --version`);
    assert.equal(stderr, '');
    assert.match(stdout, /postcss version: \d+\.\d+\.\d+/, 'version of postcss is displayed');
  });

  await t.test('warning', async function () {
    const cmd = c`
    NODE_PATH=fixtures postcss --use dummy-plugin -o _build/warning.css fixtures/in-warning.css
    `;
    const { stdout, stderr } = await exec(cmd);
    assert.equal(stderr, c`dummy-plugin: fixtures/in-warning.css:1:1: Dummy warning\n`, 'should display warning');
    assert.equal(stdout, '', 'should be empty');
  });

  await t.test('error', async function () {
    const cmd = c`
      NO_COLOR=1 \
      NODE_PATH=fixtures \
      postcss \
        --use dummy-plugin \
        --dummy-plugin.fail=true \
        -o _build/invalid.css fixtures/in-force-error.css
    `;
    const { code, stderr, stdout } = await exec(cmd).catch(e => e);
    assert.equal(code, 1);
    assert.equal(stdout, '', 'should be empty');
    assert.equal(stderr, c`dummy-plugin: fixtures/in-force-error.css:1:1: Dummy error > 1 | a {
    | ^
  2 |   background: url(image.png);
  3 |   display: flex;
`
      , 'should display error');
  });

  await t.test('source-maps-file', async function () {
    const cmd = c`
        postcss -u postcss-url --postcss-url.url=rebase --map file -o _build/source-maps-file.css fixtures/in.css
        `;
    const expected = await read(c`ref/source-maps-file.css`);
    const expectedMap = await read(c`ref/source-maps-file.css.map`);
    const { stdout, stderr } = await exec(cmd);
    assert.equal(stderr, '', 'should be empty');
    assert.equal(stdout, '', 'should be empty');

    const output = await read(c`_build/source-maps-file.css`);
    assert.equal(output, expected, 'css is compiled');

    const outputMap = await read(c`_build/source-maps-file.css.map`);
    assert.equal(outputMap, expectedMap, 'source map is emitted to a file');

  });

  await cliTest('opts', c`postcss --use -u postcss-url --postcss-url.url=rebase`);

  await cliTest('source-maps', c`postcss -u postcss-url --postcss-url.url=rebase --map`);

  await cliTest('config', c`postcss -u postcss-url -c fixtures/config.json`);

  await cliTest('config-all', c`postcss -c fixtures/config-all.json`);

  await cliTest('js-config', c`postcss -u postcss-url -c fixtures/config.js`);

  await cliTest('js-config-all', c`postcss -c fixtures/config-all.js`);

  async function cliTest(name, cmd,
    inpath = c`fixtures/in.css`,
    outpath = c`_build/` + `${name}.css`,
    refpath = outpath.replace('_build', 'ref')
  ) {
    await t.test(name, async function () {
      const expected = await read(refpath);
      const { stdout, stderr } = await exec(`${cmd} -o ${outpath} ${inpath}`);
      assert.equal(stderr, '', 'stderr should be empty');
      assert.equal(stdout, '', 'stdout should be empty');
      const output = await read(outpath);
      assert.equal(output, expected, 'css should be compiled');
    });
  }
});

