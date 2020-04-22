const test = require('tape');
const argv = require('../lib/argv');

// trim and split as a bad approximation of converting commang line into array of strings
function _(strings) {
  return strings[0].trim().split(/\s+/);
}

test('single plugin', function(t) {
  t.plan(5);

  const opts = argv(_`--use autoprefixer -o out.css in.css`);
  t.deepEqual(opts.use, [ 'autoprefixer' ]);
  t.equal(opts.output, 'out.css');
  t.deepEqual(opts._, [ 'in.css' ]);

  t.notOk(opts.version, 'should not have version');
  t.notOk(opts.help, 'should not have tape');
});

test('syntax', function(t) {
  t.plan(1);

  const opts = argv(_`
    --use autoprefixer
    -s mysyntax
    --output out.css
    in.css
  `);

  t.equal(opts.syntax, 'mysyntax');
});

test('parser', function(t) {
  t.plan(1);

  const opts = argv(_`
    --use autoprefixer
    -p myparser
    --output out.css
    in.css
  `);

  t.equal(opts.parser, 'myparser');
});

test('stringifier', function(t) {
  t.plan(1);

  const opts = argv(_`
    --use autoprefixer
    --stringifier mystringifier
    --output out.css
    in.css
  `);

  t.equal(opts.stringifier, 'mystringifier');
});

test('config .json', function(t) {
  t.plan(3);

  const opts = argv(_`--config test/fixtures/config-all.json in.css`);

  t.deepEqual(opts.use, [ 'postcss-url' ]);
  t.equal(opts.output, 'test/build/config-all.css');
  t.deepEqual(opts['postcss-url'], { url: 'inline' });
});

test('config .js', function(t) {
  t.plan(4);

  const opts = argv(_`
    --use postcss-url
    --output out.css
    --config test/fixtures/config.js
    in.css
  `);

  t.deepEqual(opts.use, [ 'postcss-url' ]);
  t.equal(opts.output, 'out.css');

  t.ok(opts['postcss-url'], 'opts should have `postcss-url` property');
  t.equal(typeof opts['postcss-url'].url, 'function');
});

test('multiple plugins with options', function(t) {
  t.plan(6);

  const opts = argv(_`
    --use postcss-url --postcss-url.url=rebase --postcss-url.assetPath /temp/example
    --use autoprefixer --autoprefixer.browsers >5%
    --use cssnano --no-cssnano.discardUnused
    --output out.css in.css
  `);

  t.deepEqual(opts.use, [ 'postcss-url', 'autoprefixer', 'cssnano' ]);
  t.deepEqual(opts.output, 'out.css');
  t.deepEqual(opts._, [ 'in.css' ]);

  t.deepEqual(opts['postcss-url'], { url: 'rebase', assetPath: '/temp/example' });
  t.deepEqual(opts.autoprefixer, { browsers: '>5%' });
  t.deepEqual(opts.cssnano, { discardUnused: false });
});
