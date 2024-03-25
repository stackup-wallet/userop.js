// @ts-check

const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  { ignores: ["dist", "jest.config.js", "eslint.config.js"] },
];
