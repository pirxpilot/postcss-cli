const test = require('node:test');

const argv = require('../lib/argv');

// trim and split as a bad approximation of converting commang line into array of strings
function _(strings) {
  return strings[0].trim().split(/\s+/);
}

test('single plugin', t => {
  t.plan(5);

  const opts = argv(_`--use autoprefixer -o out.css in.css`);
  t.assert.deepEqual(opts.use, ['autoprefixer']);
  t.assert.equal(opts.output, 'out.css');
  t.assert.deepEqual(opts._, ['in.css']);

  t.assert.equal(opts.version, undefined, 'should not have version');
  t.assert.equal(opts.help, undefined, 'should not have tape');
});

test('syntax', t => {
  t.plan(1);

  const opts = argv(_`
    --use autoprefixer
    -s mysyntax
    --output out.css
    in.css
  `);

  t.assert.equal(opts.syntax, 'mysyntax');
});

test('parser', t => {
  t.plan(1);

  const opts = argv(_`
    --use autoprefixer
    -p myparser
    --output out.css
    in.css
  `);

  t.assert.equal(opts.parser, 'myparser');
});

test('stringifier', t => {
  t.plan(1);

  const opts = argv(_`
    --use autoprefixer
    --stringifier mystringifier
    --output out.css
    in.css
  `);

  t.assert.equal(opts.stringifier, 'mystringifier');
});

test('config .json', t => {
  t.plan(3);

  const opts = argv(_`--config test/fixtures/config-all.json in.css`);

  t.assert.deepEqual(opts.use, ['postcss-url']);
  t.assert.equal(opts.output, 'test/build/config-all.css');
  t.assert.deepEqual(opts['postcss-url'], { url: 'inline' });
});

test('config .js', t => {
  t.plan(4);

  const opts = argv(_`
    --use postcss-url
    --output out.css
    --config test/fixtures/config.js
    in.css
  `);

  t.assert.deepEqual(opts.use, ['postcss-url']);
  t.assert.equal(opts.output, 'out.css');

  t.assert.ok(opts['postcss-url'], 'opts should have `postcss-url` property');
  t.assert.equal(typeof opts['postcss-url'].url, 'function');
});

test('multiple plugins with options', t => {
  t.plan(6);

  const opts = argv(_`
    --use postcss-url --postcss-url.url=rebase --postcss-url.assetPath /temp/example
    --use autoprefixer --autoprefixer.browsers >5%
    --use cssnano --no-cssnano.discardUnused
    --output out.css in.css
  `);

  t.assert.deepEqual(opts.use, ['postcss-url', 'autoprefixer', 'cssnano']);
  t.assert.deepEqual(opts.output, 'out.css');
  t.assert.deepEqual(opts._, ['in.css']);

  t.assert.deepEqual(opts['postcss-url'], { url: 'rebase', assetPath: '/temp/example' });
  t.assert.deepEqual(opts.autoprefixer, { browsers: '>5%' });
  t.assert.deepEqual(opts.cssnano, { discardUnused: false });
});
