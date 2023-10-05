module.exports = {
  "extends": [
    'lxsmnsyc/typescript/solid',
  ],
  "parserOptions": {
    "project": "./tsconfig.eslint.json",
    "tsconfigRootDir": __dirname,
  },
  "rules": {
    "import/no-extraneous-dependencies": [
      "error", {
        "devDependencies": ["**/*.test.ts"]
      }
    ],
    "no-restricted-syntax": "off",
    "no-param-reassign": "off"
  },
};