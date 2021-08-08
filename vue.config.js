module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
    output: {
      filename: "binance-spot.js",
    },
  },
  productionSourceMap: false,
  css: {
    extract: false,
  },
};
