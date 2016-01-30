module.exports = {
  use: "postcss-url",
  output: "test/build/js-config-all.css",
  "postcss-url": {
    url: function(url) { return "http://example.com/" + url; }
  }
};
