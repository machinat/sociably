module.exports = {
  singleQuote: true,
  parser: 'typescript',
  plugins:
    // HACK: prettier-plugin-jsdoc doesn't work with prettier@2 which used by jest
    //       don't use it when testing
    process.env.JEST_WORKER_ID === undefined && process.env.NODE_ENV !== 'test'
      ? ['prettier-plugin-jsdoc']
      : [],
  pluginSearchDirs: false,
  tsdoc: true,
};
