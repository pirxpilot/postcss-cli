const should = require('should');
const argv = require('../lib/argv');


// trim and split as a bad approximation of converting commang line into array of strings
function _(strings) {
  return strings[0].trim().split(/\s+/);
}

/* global describe, it */

describe('argv', function() {

  it('single plugin', function() {
    const opts = argv(_`--use autoprefixer -o out.css in.css`);
    opts.should.have.property('use', [ 'autoprefixer' ]);
    opts.should.have.property('output', 'out.css');
    opts.should.have.property('_', [ 'in.css' ]);

    should(opts.version).not.be.ok();
    should(opts.help).not.be.ok();
  });

  it('syntax', function() {
    const opts = argv(_`
      --use autoprefixer
      -s mysyntax
      --output out.css
      in.css
    `);

    opts.should.have.property('syntax', 'mysyntax');
  });

  it('parser', function() {
    const opts = argv(_`
      --use autoprefixer
      -p myparser
      --output out.css
      in.css
    `);

    opts.should.have.property('parser', 'myparser');
  });

  it('stringifier', function() {
    const opts = argv(_`
      --use autoprefixer
      --stringifier mystringifier
      --output out.css
      in.css
    `);

    opts.should.have.property('stringifier', 'mystringifier');
  });

  it('config .json', function() {
    const opts = argv(_`--config test/fixtures/config-all.json in.css`);
    opts.should.containEql({
      use: [ 'postcss-url' ],
      output: 'test/build/config-all.css',
      'postcss-url': {
        url: 'inline'
      }
    });
  });

  it('config .js', function() {
    const opts = argv(_`
      --use postcss-url
      --output out.css
      --config test/fixtures/config.js
      in.css
    `);
    opts.should.containEql({
      use: [ 'postcss-url' ],
      output: 'out.css'
    });
    opts.should
      .have.property('postcss-url')
      .with.property('url')
      .Function();
  });

  it('multiple plugins with options', function() {
    const opts = argv(_`
      --use postcss-url --postcss-url.url=rebase --postcss-url.assetPath /temp/example
      --use autoprefixer --autoprefixer.browsers >5%
      --use cssnano --no-cssnano.discardUnused
      --output out.css in.css
    `);

    opts.should.have.property('use', [ 'postcss-url', 'autoprefixer', 'cssnano' ]);
    opts.should.have.property('output', 'out.css');
    opts.should.have.property('_', [ 'in.css' ]);

    opts.should.have.property('postcss-url', { url: 'rebase', assetPath: '/temp/example' });
    opts.should.have.property('autoprefixer', { browsers: '>5%' });
    opts.should.have.property('cssnano', { discardUnused: false });
  });

});
