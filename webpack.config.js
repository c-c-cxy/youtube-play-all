const path = require("path");

module.exports = (_env, argv) => ({
  entry: {
    content: "./src/main.ts",
    bridge: "./src/bridge.ts",
  },
  devtool: argv.mode === "production" ? false : "inline-source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
});
