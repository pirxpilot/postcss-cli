[![Build Status](https://img.shields.io/travis/code42day/postcss-cli.svg)](http://travis-ci.org/code42day/postcss-cli)
[![Dependency Status](https://img.shields.io/gemnasium/code42day/postcss-cli.svg)](https://gemnasium.com/code42day/postcss-cli)
[![NPM version](https://img.shields.io/npm/v/postcss-cli-simple.svg)](http://badge.fury.io/js/postcss-cli-simple)

# postcss-cli-simple

Simple CLI for [postcss]. To be used in Makefiles. If you are looking for more options check out [postcss-cli].

## Installation

npm install postcss-cli-simple

## Usage

    postcss [options] -o output-file input-file

In Makefile you can use it with [pattern rules]:

````Make
deploy/%.css: %.css
  ./node_modules/.bin/postcss \
    --use postcss-url --postcss-url.url=rebase \
    --use autoprefixer --autoprefixer.browsers "> 5%" \
    --use cssnano --no-cssnano.discardUnused
    --output $@ $<
````

#### `--output|-o`

Output file name.

#### `--use|-u`

Plugin to be used. Multiple plugins can be specified. At least one plugin needs to be specified either with `--use` option or in the config file.

Plugin options can be specified using [yargs dot notation]. For example, to pass `browsers` option to `autoprefixer` one can use `--autoprefixer.browsers "> 5%"`. To set plugin option to `false` use [yargs boolean negation]. For example, to switch off `discardUnused` in `cssnano` try: `--no-cssnano.discardUnused`.  

#### `--map|-m`

Activate source map generation. By default inline maps are generated. To generate source maps
in a separate _.map_ file use `--map file` or `--no-map.inline`.

You can use [advances source map options][source-map-options] - some examples:

- `--no-map` - do not generated source maps - even if previous maps exist
- `--map.annotation <path>` - specify alternaive path to be used in source map annotation appended to CSS
- `--no-map.annotation` - supress adding annotation to CSS
- `--no-map.sourcesContent` - remove origin CSS from maps

#### `--config|-c`

JSON file with plugin configuration. Plugin names should be the keys.

````json
{
    "autoprefixer": {
        "browsers": "> 5%"
    },
    "postcss-cachify": {
        "baseUrl": "/res"
    }
}
````

JavaScript configuration can be used if functions are allowed as plugins parameters. Although you might be better of to write your own plugin.

````js
module.exports = {
  "postcss-url": {
    url: function(url) { return "http://example.com/" + url; }
  },
  autoprefixer: {
    browsers: "> 5%"
  }
};
````

Alternatively configuration options can be passed as `--plugin.option` parameters.

Note that command-line options can also be specified in the config file:

````json
{
    "use": ["autoprefixer", "postcss-cachify"],
    "output": "bundle.css",
    "autoprefixer": {
        "browsers": "> 5%"
    },
    "postcss-cachify": {
        "baseUrl": "/res"
    }
}
````

#### `--syntax|-s`

Optional module to use as a [custom PostCSS syntax](https://github.com/postcss/postcss#custom-syntaxes).

#### `--parser|-p`

Optional module to use as a [custom PostCSS input parser](https://github.com/postcss/postcss#custom-syntaxes).

#### `--stringifier|-t`

Optional module to use as a [custom PostCSS output stringifier](https://github.com/postcss/postcss#custom-syntaxes).

#### `--help|-h`

Show help

### Examples

Use autoprefixer as a postcss plugin pass parameters from a json file

    postcss --use autoprefixer -c options.json -o screen.css screen.css

Use more than one plugin and pass config parameters

    postcss --use autoprefixer --autoprefixer.browsers "> 5%" \
        --use postcss-cachify --postcss-cachify.baseUrl /res \
        -o screen.css screen.css


## License

MIT

[postcss]: https://npmjs.org/package/postcss
[postcss-cli]: https://npmjs.org/package/postcss-cli
[source-map-options]: https://github.com/postcss/postcss/blob/master/docs/source-maps.md
[pattern rules]: https://www.gnu.org/software/make/manual/html_node/Pattern-Rules.html
[yargs dot notation]: https://www.npmjs.com/package/yargs#dot-notation
[yargs boolean negation]: https://www.npmjs.com/package/yargs#negate-fields
