const path = require("path");

module.exports = (_env, argv) => ({
  entry: "./src/main.ts",
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
    filename: "content.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
});
