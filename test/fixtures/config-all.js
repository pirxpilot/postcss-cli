module.exports = {
  use: "postcss-url",
  output: "test/build/js-config-all.css",
  "postcss-url": {
    url: function(opts) { return "http://example.com/" + opts.url; }
  }
};
