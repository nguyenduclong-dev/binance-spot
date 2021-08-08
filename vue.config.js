const path = require("path");

module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: false,
    },
    output: {
      filename: "binance-spot.js",
    },
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
      },
    },
  },
  lintOnSave: false,
  productionSourceMap: false,
  css: {
    extract: false,
  },
};
