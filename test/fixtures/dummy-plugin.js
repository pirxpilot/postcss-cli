module.exports = function() {
  return {
    postcssPlugin: 'dummy-plugin',
    Rule: function (rule, { result }) {
      if (rule.selector === 'a') {
        throw rule.error('Dummy error');
      }
      if (rule.selector === 'figure') {
        result.warn('Dummy warning', { node: rule });
      }
    }
  };
};

module.exports.postcss = true;
