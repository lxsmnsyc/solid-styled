module.exports = {
  "root": true,
  "extends": [
    "lxsmnsyc/typescript/react"
  ],
  "parserOptions": {
    "project": "./tsconfig.eslint.json",
    "tsconfigRootDir": __dirname,
  },
  "rules": {
    "react/no-unknown-property": "off",
    "react/destructuring-assignment": "off",
    "no-unused-expressions": "off"
  }
};
