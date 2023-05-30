import { moxy } from '@moxyjs/moxy';

module.exports = moxy({
  readFile(path, options, callback) {
    let cb;
    let useBuffer;

    if (typeof callback === 'function') {
      cb = callback;
      useBuffer = !(options && options.encoding);
    } else {
      cb = options;
      useBuffer = true;
    }

    const content = '__FILE_CONTENT__';
    cb(null, useBuffer ? Buffer.from(content) : content);
  },

  writeFile(path, content, options, callback) {
    const cb = typeof callback === 'function' ? callback : options;
    cb();
  },
});
