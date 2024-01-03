/* eslint @typescript-eslint/no-var-requires: "off" */
const resolve = require("@rollup/plugin-node-resolve");
const typescript = require("@rollup/plugin-typescript");
const terser = require("@rollup/plugin-terser");

const extensions = [".js", ".ts"];

exports.default = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/dwait.common.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/dwait.common.min.js",
      format: "cjs",
      plugins: [terser()],
      sourcemap: true,
    },
    {
      file: "dist/dwait.esm.mjs",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/dwait.esm.min.mjs",
      format: "esm",
      plugins: [terser()],
      sourcemap: true,
    },
    {
      file: "dist/dwait.umd.js",
      format: "umd",
      name: "dwait",
      sourcemap: true,
    },
    {
      file: "dist/dwait.umd.min.js",
      format: "umd",
      name: "dwait",
      plugins: [terser()],
      sourcemap: true,
    },
  ],
  plugins: [resolve({ extensions }), typescript()],
};
