export default function esm() {
  return {
    postcssPlugin: 'esm-plugin',
    Declaration: {
      display(decl) {
        decl.value = 'none'
      }
    }
  };
};

esm.postcss = true;
