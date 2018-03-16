module.exports = {
  "parser": "babel-eslint",
  "plugins": [
    "prettier"
  ],
  extends: [
    'airbnb-base',
    'prettier',
  ],
  "rules": {
    "strict": 0,
    "prettier/prettier": ["error", {
      trailingComma: 'es5',
      singleQuote: true,
    }],
  },
};
